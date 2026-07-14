const KR_CHARS_PER_MIN = 500;
const EN_WORDS_PER_MIN = 230;

function countKoreanChars(text: string): number {
  return text.replace(/\s/g, "").length;
}

function countEnglishWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

export function calcReadingTime(
  content: string,
  lang: "ko" | "en" = "ko",
): number {
  const stripped = content
    .replace(/^---[\s\S]*?---/, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[#*_~`>\-|]/g, "")
    .trim();

  if (!stripped) return 1;

  const minutes =
    lang === "ko"
      ? Math.ceil(countKoreanChars(stripped) / KR_CHARS_PER_MIN)
      : Math.ceil(countEnglishWords(stripped) / EN_WORDS_PER_MIN);

  return Math.max(1, minutes);
}

export function formatReadingTime(minutes: number): string {
  const convertedMinutes = Math.ceil(minutes / 2);

  if (convertedMinutes >= 60) {
    return "완독 1시간 이상 소요";
  }
  return `완독 ${convertedMinutes}분 소요`;
}
