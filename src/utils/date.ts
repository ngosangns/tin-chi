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
