let notoSansBase64Cache: string | null = null;

/** jsPDF'in varsayılan fontları Türkçe karakterleri (İ, ı, ş, ğ, ç, ü, ö) desteklemediği için
 * Noto Sans TTF'i gömülü font olarak yüklüyoruz. */
export async function loadNotoSansBase64(): Promise<string> {
  if (notoSansBase64Cache) return notoSansBase64Cache;
  const res = await fetch("/fonts/NotoSans-Regular.ttf");
  const buffer = await res.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  notoSansBase64Cache = btoa(binary);
  return notoSansBase64Cache;
}
