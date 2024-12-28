export function countSpecificDayOfWeek(
  startDateTimestamp: number,
  endDateTimestamp: number,
  targetDay: number
): number {
  // Convert timestamps to Date objects
  const startDate: Date = new Date(startDateTimestamp);
  const endDate: Date = new Date(endDateTimestamp);

  let count: number = 0; // Initialize the counter for the target day

  // Iterate through each date from startDate to endDate
  for (
    let date: Date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    if (date.getDay() === targetDay) count++; // Check if the day matches the target
  }

  return count;
}

export const numToDate = (n: number): Date =>
  new Date(((n / 10000) | 0) + 2000, (((n / 100) | 0) % 100) - 1, n % 100); // Chuyển số nguyên thành ngày. Ví dụ: 210101 -> 2021-01-01
export const dateToNum = (d: Date): number =>
  (d.getFullYear() % 100) * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); // Chuyển ngày thành số nguyên. Ví dụ: 2021-01-01 -> 210101
