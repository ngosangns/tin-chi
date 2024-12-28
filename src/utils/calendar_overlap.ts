export function getOverlapRange(
  range1: [number, number],
  range2: [number, number]
): [number, number] | null {
  const [start1, end1] = range1;
  const [start2, end2] = range2;

  // Check if the ranges overlap
  if (start1 <= end2 && start2 <= end1) {
    // Calculate the overlapping range
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    return [overlapStart, overlapEnd];
  }

  // No overlap
  return null;
}

// Hàm đếm bit 1 trong một số nguyên
export function countBit1(n: number): number {
  let count = 0;
  while (n > 0) {
    count += n & 1; // Nếu bit cuối là 1, tăng count
    n >>= 1; // Dịch phải để kiểm tra bit tiếp theo
  }
  return count;
}

export const aDayInMiliseconds = 24 * 60 * 60 * 1000;

// Hàm tính overlap giữa 2 lớp
export function calculateOverlapBetween2Classes(
  c1: [number, number, number, number][], // [startDate, endDate, dayOfWeek, sessionBitmask][]
  c2: [number, number, number, number][]
): number {
  if (c1.length === 0 || c2.length === 0) return 0;

  // Kiểm tra nếu khoảng thời gian của hai lớp không giao nhau thì trả về 0
  if (c1[c1.length - 1][1] < c2[0][0] || c2[c2.length - 1][1] < c1[0][0])
    return 0;

  let overlap = 0;

  for (let i = 0; i < c1.length; i++)
    for (let j = 0; j < c2.length; j++)
      // Kiểm tra nếu khoảng thời gian của hai lớp có giao nhau và cùng ngày học trong tuần
      if (
        c1[i][0] <= c2[j][1] &&
        c1[i][1] >= c2[j][0] &&
        c1[i][2] === c2[j][2]
      ) {
        // Tính toán overlap bằng cách sử dụng bitmask
        const _overlap = c1[i][3] & c2[j][3];
        // Tính tổng số tuần mà hai lớp học chung
        const totalWeeks =
          (Math.min(c1[i][1], c2[j][1]) -
            Math.max(c1[i][0], c2[j][0]) +
            aDayInMiliseconds) /
          (aDayInMiliseconds * 7);
        // Nếu có overlap, đếm số bit 1 trong bitmask và cộng vào tổng overlap
        if (_overlap > 0) overlap += countBit1(_overlap) * totalWeeks;
      }

  return overlap;
}
