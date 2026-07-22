import type { DegreeType, ScholarshipType, ScoreType, UniversityType } from "@/generated/prisma/enums";

export const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  SAY: "Sayısal (SAY)",
  EA: "Eşit Ağırlık (EA)",
  SOZ: "Sözel (SÖZ)",
  DIL: "Yabancı Dil (DİL)",
  TYT: "TYT",
};

export const DEGREE_TYPE_LABELS: Record<DegreeType, string> = {
  LISANS: "4 Yıllık (Lisans)",
  ONLISANS: "2 Yıllık (Önlisans)",
  OZEL_YETENEK: "Özel Yetenek",
  ACIKOGRETIM: "Açıköğretim",
  UZAKTAN: "Uzaktan Eğitim",
};

export const SCHOLARSHIP_LABELS: Record<ScholarshipType, string> = {
  UCRETSIZ: "Ücretsiz",
  BURSLU: "Burslu",
  INDIRIM_75: "%75 İndirimli",
  INDIRIM_50: "%50 İndirimli",
  INDIRIM_25: "%25 İndirimli",
  UCRETLI: "Ücretli",
};

export const UNIVERSITY_TYPE_LABELS: Record<UniversityType, string> = {
  DEVLET: "Devlet Üniversitesi",
  VAKIF: "Vakıf Üniversitesi",
};

export const SORT_LABELS: Record<string, string> = {
  successRank: "Başarı Sırası",
  minScore: "Taban Puanı",
  programCode: "Program Kodu",
};
