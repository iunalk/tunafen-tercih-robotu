import Link from "next/link";
import { DegreeType, ScholarshipType, ScoreType } from "@/generated/prisma/enums";
import { FilterableCheckboxList } from "@/components/ui/FilterableCheckboxList";
import { FormAutoSubmit } from "@/components/ui/FormAutoSubmit";
import { PillCheckbox } from "@/components/ui/PillCheckbox";
import { SegmentedRadio } from "@/components/ui/SegmentedRadio";
import { DEGREE_TYPE_LABELS, SCHOLARSHIP_LABELS, SCORE_TYPE_LABELS } from "@/lib/labels";
import type { ParsedFilters } from "@/lib/search";

interface FilterPanelProps {
  filters: ParsedFilters;
  cities: string[];
  universities: { id: number; name: string }[];
  departments: string[];
}

function Section({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2.5">
      <legend className="flex w-full items-center justify-between text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <span>{title}</span>
        {extra}
      </legend>
      {children}
    </fieldset>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-ring/30";

function SortRadio({ value, defaultChecked }: { value: ParsedFilters["sort"]; defaultChecked: boolean }) {
  return (
    <label className="flex normal-case cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <input type="radio" name="sort" value={value} defaultChecked={defaultChecked} className="accent-accent" />
      Bu alana göre sırala
    </label>
  );
}

export function FilterPanel({ filters, cities, universities, departments }: FilterPanelProps) {
  const cityOptions = cities.map((c) => ({ value: c, label: c }));
  const universityOptions = universities.map((u) => ({ value: String(u.id), label: u.name }));
  const deptOptions = departments.map((d) => ({ value: d, label: d }));

  return (
    <form
      method="get"
      action="/"
      className="flex min-w-0 flex-col gap-6 rounded-2xl border border-border bg-surface p-5 text-sm shadow-[var(--shadow-md)]"
    >
      <FormAutoSubmit />
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="dir" value={filters.dir} />

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Arama Kriterleri</h2>
        <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-accent">
          Sıfırla
        </Link>
      </div>

      <Section title="1. Puan Türü">
        <div className="flex flex-wrap gap-1.5">
          {Object.values(ScoreType).map((v) => (
            <PillCheckbox key={v} name="scoreType" value={v} defaultChecked={filters.scoreTypes.includes(v)}>
              {SCORE_TYPE_LABELS[v]}
            </PillCheckbox>
          ))}
        </div>
      </Section>

      <Section title="2. Bölüm Türü">
        <div className="flex flex-wrap gap-1.5">
          {Object.values(DegreeType).map((v) => (
            <PillCheckbox key={v} name="degreeType" value={v} defaultChecked={filters.degreeTypes.includes(v)}>
              {DEGREE_TYPE_LABELS[v]}
            </PillCheckbox>
          ))}
        </div>
      </Section>

      <Section title="3. Ücret / Burs Durumu">
        <div className="flex flex-wrap gap-1.5">
          {Object.values(ScholarshipType).map((v) => (
            <PillCheckbox key={v} name="scholarshipType" value={v} defaultChecked={filters.scholarshipTypes.includes(v)}>
              {SCHOLARSHIP_LABELS[v]}
            </PillCheckbox>
          ))}
        </div>
      </Section>

      <Section title="4. Şehirler">
        <FilterableCheckboxList
          name="city"
          options={cityOptions}
          selected={filters.cities}
          placeholder="Şehir ara..."
          emptyLabel="Seçili diğer kriterlere uyan şehir yok."
        />
      </Section>

      <Section title="5. Üniversiteler">
        <div className="flex flex-col gap-2.5">
          <SegmentedRadio
            name="universityType"
            options={[
              { value: "", label: "Tümü", defaultChecked: !filters.universityType },
              { value: "DEVLET", label: "Devlet", defaultChecked: filters.universityType === "DEVLET" },
              { value: "VAKIF", label: "Vakıf", defaultChecked: filters.universityType === "VAKIF" },
            ]}
          />
          <FilterableCheckboxList
            name="universityId"
            options={universityOptions}
            selected={filters.universityIds.map(String)}
            placeholder="Üniversite ara..."
            emptyLabel="Seçili diğer kriterlere uyan üniversite yok."
          />
        </div>
      </Section>

      <Section title="6. Bölümler / Programlar">
        <FilterableCheckboxList
          name="dept"
          options={deptOptions}
          selected={filters.deptNames}
          placeholder="Bölüm ara (örn. Bilgisayar Mühendisliği)"
          emptyLabel="Seçili diğer kriterlere uyan bölüm yok."
        />
      </Section>

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          7. Sıralama / Puan Aralığı
        </p>

        <Section
          title="Sıralama Aralığı"
          extra={<SortRadio value="currentSuccessRank" defaultChecked={filters.sort === "currentSuccessRank"} />}
        >
          <div className="flex items-center gap-2">
            <input type="number" name="minRank" placeholder="min" defaultValue={filters.minRank ?? ""} className={inputClass} />
            <span className="text-muted-foreground">–</span>
            <input type="number" name="maxRank" placeholder="max" defaultValue={filters.maxRank ?? ""} className={inputClass} />
          </div>
        </Section>

        <Section
          title="Puan Aralığı"
          extra={<SortRadio value="currentMinScore" defaultChecked={filters.sort === "currentMinScore"} />}
        >
          <div className="flex items-center gap-2">
            <input type="number" name="minScore" placeholder="min" defaultValue={filters.minScore ?? ""} className={inputClass} />
            <span className="text-muted-foreground">–</span>
            <input type="number" name="maxScore" placeholder="max" defaultValue={filters.maxScore ?? ""} className={inputClass} />
          </div>
        </Section>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-accent-hover"
      >
        Sonuçları Listele
      </button>
    </form>
  );
}
