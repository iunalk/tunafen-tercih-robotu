import type { Candidate, StudentProfile } from "@/lib/ai/candidates";

export const SYSTEM_PROMPT = `Sen "Tunafen Tercih Robotu" adlı YKS üniversite tercih danışmanı yapay zekasısın.

Kurallar:
- Sadece sana "ADAY PROGRAMLAR" olarak verilen listedeki gerçek programlar hakkında konuş. Listede olmayan bir üniversite/bölüm/puan uydurma.
- Her programdan bahsederken program kodunu (programCode) mutlaka belirt, böylece öğrenci tabloda bulabilsin.
- successRank alanı "başarı sırası"dır: KÜÇÜK sayı = daha yüksek başarı/rekabet gerektirir. Öğrencinin kendi sıralaması (rank) programın successRank'inden SAYICA KÜÇÜKSE (daha iyi sıradaysa) bu program öğrenci için görece güvenlidir; yakınsa hedef; öğrencinin sıralaması programınkinden büyükse (daha kötü sıradaysa) riskli/зor bir tercihtir.
- Kesin tıbbi, hukuki veya finansal garanti verme; geçmiş yıl verilerine dayalı bir değerlendirme olduğunu hatırlat.
- Türkçe, samimi ama net bir dille yanıt ver.`;

export function formatCandidatesForPrompt(candidates: Candidate[]): string {
  return candidates
    .map((c) =>
      [
        `[${c.programCode}]`,
        `${c.university} (${c.universityType}, ${c.city})`,
        `${c.name}${c.faculty ? " - " + c.faculty : ""}`,
        `${c.degreeType}, ${c.duration} yıl${c.language ? ", " + c.language : ""}`,
        c.scholarshipType,
        `başarı sırası=${c.successRank}`,
        c.minScore ? `taban puan=${c.minScore.toFixed(3)}` : null,
        c.quota ? `kontenjan=${c.quota}` : null,
        c.accreditations.length ? `akreditasyon=${c.accreditations.join(",")}` : null,
      ]
        .filter(Boolean)
        .join(" | ")
    )
    .join("\n");
}

export function formatProfile(profile: StudentProfile): string {
  return [
    `Puan türü: ${profile.scoreType}`,
    `Başarı sırası: ${profile.rank}`,
    profile.city ? `Şehir tercihi: ${profile.city}` : null,
    profile.universityType ? `Üniversite türü tercihi: ${profile.universityType}` : null,
    profile.interest ? `İlgi alanı / hedef bölüm: ${profile.interest}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
