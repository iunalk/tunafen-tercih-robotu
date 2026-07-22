#!/usr/bin/env python3
"""YÖK Atlas tercih kılavuzu verisini çekip Postgres'e yükler.

YÖK Atlas'ın kendi JSON API'sini (https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search)
doğrudan httpx ile çağırır. `yokatlas-py` paketinin pydantic modelleri bazı gerçek
alan değerlerinde (örn. universiteTuru="KKTC") doğrulama hatası verdiği ve geçmiş
yıl kontenjan alanlarını (gk1/gk2/gk3) hiç okumadığı için, ham JSON'u burada
kendimiz parse ediyoruz.

Kullanım:
  source .venv/bin/activate
  python scripts/ingest_yokatlas.py --max-pages 2       # küçük alt kümeyle deneme
  python scripts/ingest_yokatlas.py                     # tüm veri (~21.000 program)
"""
from __future__ import annotations

import argparse
import os
import sys
import time
import unicodedata
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import httpx
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search"
SCORE_TYPES = ["SAY", "SÖZ", "EA", "DİL", "TYT"]
SCORE_TYPE_MAP = {"SAY": "SAY", "SÖZ": "SOZ", "EA": "EA", "DİL": "DIL", "TYT": "TYT"}

SCHOLARSHIP_MAP = {
    "ucretsiz": "UCRETSIZ",
    "burslu": "BURSLU",
    "%75 indirimli": "INDIRIM_75",
    "%50 indirimli": "INDIRIM_50",
    "%25 indirimli": "INDIRIM_25",
    "ucretli": "UCRETLI",
}

PAGE_SIZE = 100
REQUEST_DELAY_SECONDS = 0.25


def _norm(s: str) -> str:
    """Türkçe karakterleri sadeleştirip küçük harfe çevirir (karşılaştırma için)."""
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().strip()


def fetch_page(client: httpx.Client, puan_turu: str, page: int) -> dict[str, Any]:
    body = {
        "filters": {
            "puanTuru": puan_turu,
            "universiteId": [],
            "birimGrupId": [],
            "ilKodu": [],
            "birimTuruId": None,
            "universiteTuru": None,
            "bursOraniId": None,
            "ogrenimTuruId": None,
            "kilavuzKodu": None,
            "minBasariSirasi": None,
            "maxBasariSirasi": None,
        },
        "page": page,
        "size": PAGE_SIZE,
        "sortBy": "basariSirasi",
        "direction": "ASC",
    }
    last_exc: Exception | None = None
    for attempt in range(4):
        try:
            r = client.post(API_URL, json=body, timeout=30)
            r.raise_for_status()
            return r.json()
        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            last_exc = exc
            wait = 2**attempt
            print(f"  ! hata ({exc}), {wait}s sonra tekrar denenecek...", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f"'{puan_turu}' sayfa {page} alınamadı") from last_exc


def coerce_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if f > 0 else None


def coerce_int(v: Any) -> int | None:
    if v is None or v == "":
        return None
    try:
        i = int(float(v))
    except (TypeError, ValueError):
        return None
    return i if i > 0 else None


def map_scholarship(raw: str | None) -> str:
    if not raw:
        return "UCRETLI"
    key = _norm(raw)
    for k, v in SCHOLARSHIP_MAP.items():
        if _norm(k) == key:
            return v
    print(f"  ! bilinmeyen burs_orani_adi: {raw!r} -> UCRETLI kabul edildi", file=sys.stderr)
    return "UCRETLI"


def map_degree_type(birim_turu_adi: str | None, ogrenim_turu_adi: str | None) -> str:
    ogrenim = _norm(ogrenim_turu_adi or "")
    if "acikogretim" in ogrenim:
        return "ACIKOGRETIM"
    if "uzaktan" in ogrenim:
        return "UZAKTAN"
    if (birim_turu_adi or "").upper() == "ONLISANS":
        return "ONLISANS"
    return "LISANS"


def map_university_type(raw: str | None) -> str:
    return "DEVLET" if (raw or "").upper() == "DEVLET" else "VAKIF"


def build_special_conditions(row: dict[str, Any]) -> str | None:
    parts: list[str] = []
    for item in row.get("kosulList") or []:
        for _code, text in item.items():
            if text:
                parts.append(text.strip())
    extra = row.get("minBasariSirasiKosul")
    if extra:
        parts.append(extra.strip())
    return "\n\n".join(parts) if parts else None


def build_accreditations(row: dict[str, Any]) -> list[str]:
    raw = row.get("akreditasyon")
    if not raw:
        return []
    return [a.strip() for a in raw.replace(";", ",").split(",") if a.strip()]


def extract_yearly_stats(row: dict[str, Any]) -> list[dict[str, Any]]:
    year = row.get("yil")
    if not year:
        return []
    stats = [
        {
            "year": year,
            "quota": coerce_int(row.get("kontenjan")),
            "enrolled": coerce_int(row.get("gkY")),
            "minScore": coerce_float(row.get("minPuan")),
            "successRank": coerce_int(row.get("basariSirasi")),
        }
    ]
    for offset in (1, 2, 3):
        stats.append(
            {
                "year": year - offset,
                "quota": coerce_int(row.get(f"gk{offset}")),
                "enrolled": coerce_int(row.get(f"gkY{offset}")),
                "minScore": coerce_float(row.get(f"minPuan{offset}")),
                "successRank": coerce_int(row.get(f"basariSirasi{offset}")),
            }
        )
    return [s for s in stats if any(v is not None for k, v in s.items() if k != "year")]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--score-types", nargs="+", default=SCORE_TYPES, choices=SCORE_TYPES)
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="her puan türü için en fazla kaç sayfa çekilsin (test için)",
    )
    args = parser.parse_args()

    # Prisma'nın "?schema=public" gibi kendine özgü query parametreleri psycopg2
    # tarafından tanınmıyor; DSN'i psycopg2 için sadeleştiriyoruz.
    parts = urlsplit(os.environ["DATABASE_URL"])
    database_url = urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))
    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    cur = conn.cursor()

    university_cache: dict[str, int] = {}
    total_programs = 0
    total_stats = 0

    with httpx.Client(headers={"User-Agent": "tunafen-tercih-robotu-ingest/0.1"}) as client:
        for puan_turu in args.score_types:
            page = 0
            while True:
                data = fetch_page(client, puan_turu, page)
                total_pages = data["totalPages"]
                rows = data["content"]
                print(f"[{puan_turu}] sayfa {page + 1}/{total_pages} ({len(rows)} kayıt)")

                # 1) Bu sayfada geçen, henüz cache'te olmayan üniversiteleri TEK sorguda yükle.
                new_universities: dict[str, tuple[str, str]] = {}
                for row in rows:
                    uni_name = row["universiteAdi"].strip()
                    if uni_name not in university_cache and uni_name not in new_universities:
                        new_universities[uni_name] = (
                            row.get("uniIlAdi") or row.get("ilAdi") or "",
                            map_university_type(row.get("universiteTuru")),
                        )

                if new_universities:
                    uni_rows = psycopg2.extras.execute_values(
                        cur,
                        """
                        INSERT INTO "University" (name, city, type, "updatedAt")
                        VALUES %s
                        ON CONFLICT (name) DO UPDATE SET city = EXCLUDED.city, "updatedAt" = now()
                        RETURNING id, name
                        """,
                        [(name, city, typ) for name, (city, typ) in new_universities.items()],
                        template="(%s, %s, %s, now())",
                        fetch=True,
                    )
                    for uni_id, name in uni_rows:
                        university_cache[name] = uni_id

                # 2) Bu sayfadaki tüm programları TEK sorguda upsert et.
                program_values = []
                for row in rows:
                    uni_id = university_cache[row["universiteAdi"].strip()]
                    program_values.append(
                        (
                            str(row["kilavuzKodu"]),
                            uni_id,
                            (row.get("birimGrupAdi") or row["birimAdi"]).strip(),
                            row.get("fymkAdi"),
                            row.get("ilAdi") or "",
                            SCORE_TYPE_MAP[row["puanTuru"]],
                            map_degree_type(row.get("birimTuruAdi"), row.get("ogrenimTuruAdi")),
                            row.get("ogrenimSuresi") or 4,
                            row.get("ogrenimDiliAdi"),
                            map_scholarship(row.get("bursOraniAdi")),
                            build_special_conditions(row),
                            build_accreditations(row),
                            coerce_int(row.get("basariSirasi")),
                            coerce_float(row.get("minPuan")),
                            coerce_int(row.get("kontenjan")),
                        )
                    )

                program_id_by_code: dict[str, int] = {}
                if program_values:
                    program_rows = psycopg2.extras.execute_values(
                        cur,
                        """
                        INSERT INTO "Program"
                          ("programCode", "universityId", name, faculty, city, "scoreType", "degreeType",
                           duration, language, "scholarshipType", "specialConditions", accreditations,
                           "currentSuccessRank", "currentMinScore", "currentQuota", "updatedAt")
                        VALUES %s
                        ON CONFLICT ("programCode") DO UPDATE SET
                          "universityId" = EXCLUDED."universityId",
                          name = EXCLUDED.name,
                          faculty = EXCLUDED.faculty,
                          city = EXCLUDED.city,
                          "scoreType" = EXCLUDED."scoreType",
                          "degreeType" = EXCLUDED."degreeType",
                          duration = EXCLUDED.duration,
                          language = EXCLUDED.language,
                          "scholarshipType" = EXCLUDED."scholarshipType",
                          "specialConditions" = EXCLUDED."specialConditions",
                          accreditations = EXCLUDED.accreditations,
                          "currentSuccessRank" = EXCLUDED."currentSuccessRank",
                          "currentMinScore" = EXCLUDED."currentMinScore",
                          "currentQuota" = EXCLUDED."currentQuota",
                          "updatedAt" = now()
                        RETURNING id, "programCode"
                        """,
                        program_values,
                        template="(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now())",
                        fetch=True,
                    )
                    for program_id, program_code in program_rows:
                        program_id_by_code[program_code] = program_id
                    total_programs += len(program_rows)

                # 3) Bu sayfadaki tüm yıllık istatistikleri TEK sorguda upsert et.
                stat_values = []
                for row in rows:
                    program_id = program_id_by_code[str(row["kilavuzKodu"])]
                    for stat in extract_yearly_stats(row):
                        stat_values.append(
                            (
                                program_id,
                                stat["year"],
                                stat["quota"],
                                stat["enrolled"],
                                stat["minScore"],
                                stat["successRank"],
                            )
                        )

                if stat_values:
                    psycopg2.extras.execute_values(
                        cur,
                        """
                        INSERT INTO "ProgramYearlyStat" ("programId", year, quota, enrolled, "minScore", "successRank")
                        VALUES %s
                        ON CONFLICT ("programId", year) DO UPDATE SET
                          quota = EXCLUDED.quota,
                          enrolled = EXCLUDED.enrolled,
                          "minScore" = EXCLUDED."minScore",
                          "successRank" = EXCLUDED."successRank"
                        """,
                        stat_values,
                    )
                    total_stats += len(stat_values)

                conn.commit()
                page += 1
                if args.max_pages is not None and page >= args.max_pages:
                    break
                if page >= total_pages:
                    break
                time.sleep(REQUEST_DELAY_SECONDS)

    cur.close()
    conn.close()
    print(
        f"Bitti. {total_programs} program, {total_stats} yıllık istatistik satırı işlendi. "
        f"Üniversite sayısı: {len(university_cache)}"
    )


if __name__ == "__main__":
    main()
