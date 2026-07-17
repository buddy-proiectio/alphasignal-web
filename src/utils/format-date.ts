export function formatSignalDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Check if the original string has time information (contains 'T' or ':')
  const hasTime = dateStr.includes("T") || dateStr.includes(":");
  if (!hasTime) {
    return `${year}.${month}.${day}.`;
  }

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "오후" : "오전";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${year}.${month}.${day}. ${ampm} ${hour12}시 ${minutes}분`;
}
