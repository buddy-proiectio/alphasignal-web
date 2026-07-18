// Meeus/Jones/Butcher algorithm for Easter Sunday
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  // Return Date in UTC to avoid timezone issues during calculation
  return new Date(Date.UTC(year, month - 1, day));
}

function getGoodFriday(year: number): Date {
  const easter = getEasterDate(year);
  // Subtract 2 days (Friday is 2 days before Easter Sunday)
  return new Date(
    Date.UTC(
      easter.getUTCFullYear(),
      easter.getUTCMonth(),
      easter.getUTCDate() - 2,
    ),
  );
}

// Helper to find specific weekday occurrence in a month
function getWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number,
): Date {
  // weekday: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // occurrence: 1 = 1st, 2 = 2nd, 3 = 3rd, 4 = 4th, -1 = last
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const candidates: number[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === weekday) {
      candidates.push(d);
    }
  }

  const selectedDay =
    occurrence === -1
      ? candidates[candidates.length - 1]
      : candidates[occurrence - 1];

  return new Date(Date.UTC(year, month, selectedDay));
}

function getObservedDate(
  year: number,
  month: number,
  day: number,
  options = { skipSat: false },
): Date {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

  if (dayOfWeek === 0) {
    // Sunday: observed on Monday
    return new Date(Date.UTC(year, month, day + 1));
  } else if (dayOfWeek === 6) {
    // Saturday: observed on Friday (unless skipSat is true, e.g. for New Year's Day if it falls on Dec 31 of prior year)
    if (options.skipSat) {
      return new Date(Date.UTC(year, month, day)); // Return original
    }
    return new Date(Date.UTC(year, month, day - 1));
  }
  return new Date(Date.UTC(year, month, day));
}

export function getUsMarketHolidays(year: number): Set<string> {
  const holidays = new Set<string>();

  const addHoliday = (date: Date) => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    holidays.add(`${y}-${m}-${d}`);
  };

  // 1. New Year's Day (Jan 1). If Saturday, not observed in NYSE (no Dec 31 holiday in prior year)
  const newYear = getObservedDate(year, 0, 1, { skipSat: true });
  if (newYear.getUTCFullYear() === year && newYear.getUTCDay() !== 6) {
    addHoliday(newYear);
  }

  // 2. Martin Luther King Jr. Day (3rd Monday in Jan)
  addHoliday(getWeekdayOfMonth(year, 0, 1, 3));

  // 3. Washington's Birthday / Presidents' Day (3rd Monday in Feb)
  addHoliday(getWeekdayOfMonth(year, 1, 1, 3));

  // 4. Good Friday (Friday before Easter)
  addHoliday(getGoodFriday(year));

  // 5. Memorial Day (Last Monday in May)
  addHoliday(getWeekdayOfMonth(year, 4, 1, -1));

  // 6. Juneteenth (June 19)
  addHoliday(getObservedDate(year, 5, 19));

  // 7. Independence Day (July 4)
  addHoliday(getObservedDate(year, 6, 4));

  // 8. Labor Day (1st Monday in Sep)
  addHoliday(getWeekdayOfMonth(year, 8, 1, 1));

  // 9. Thanksgiving Day (4th Thursday in Nov)
  addHoliday(getWeekdayOfMonth(year, 10, 4, 4));

  // 10. Christmas Day (Dec 25)
  addHoliday(getObservedDate(year, 11, 25));

  return holidays;
}

export function isUsMarketHoliday(date: Date): boolean {
  // Format given date as YYYY-MM-DD in KST timezone
  const kstParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = kstParts.find(p => p.type === "year")?.value;
  const m = kstParts.find(p => p.type === "month")?.value;
  const d = kstParts.find(p => p.type === "day")?.value;

  if (!y || !m || !d) return false;
  const ymd = `${y}-${m}-${d}`;

  const holidays = getUsMarketHolidays(Number(y));
  return holidays.has(ymd);
}
