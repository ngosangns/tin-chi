export const numToDate = (n: number): Date =>
  new Date(((n / 10000) | 0) + 2000, (((n / 100) | 0) % 100) - 1, n % 100); // Chuyển số nguyên thành ngày. Ví dụ: 210101 -> 2021-01-01
export const dateToNum = (d: Date): number =>
  (d.getFullYear() % 100) * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); // Chuyển ngày thành số nguyên. Ví dụ: 2021-01-01 -> 210101

export const getTotalDaysBetweenDates = (startDate: Date, endDate: Date) =>
  (Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) |
  0;
