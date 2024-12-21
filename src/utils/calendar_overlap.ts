import {
  CalendarGroupByClassDetail,
  CalendarGroupBySubjectName,
  ClassCombination,
} from '../types/calendar';
import { countSpecificDayOfWeek } from './date';

/**
 * Tạo ra các tổ hợp từ các môn học đã chọn.
 *
 * @param selectedSubjects - Đối tượng chứa các môn học đã chọn, được nhóm theo tên môn học.
 * @returns Một mảng các tổ hợp, mỗi tổ hợp là một mảng chứa các chi tiết lớp học.
 *
 */
export function generateCombinations(
  selectedSubjects: CalendarGroupBySubjectName
): ClassCombination[] {
  const subjectKeys = Object.keys(selectedSubjects);
  const combinations: ClassCombination[] = [];
  const currentCombination: ClassCombination = [];

  function backtrack(index: number) {
    if (index === subjectKeys.length) {
      combinations.push([...currentCombination]);
      return;
    }

    const subjectKey = subjectKeys[index];
    const subjectData = selectedSubjects[subjectKey];
    if (!subjectData) return;

    const classKeys = Object.keys(subjectData.classes);
    for (const classKey of classKeys) {
      currentCombination.push(subjectData.classes[classKey]);
      backtrack(index + 1);
      currentCombination.pop();
    }
  }

  backtrack(0);
  return combinations;
}

/**
 * Tính toán số lượng tiết học bị trùng lặp giữa các lớp học
 *
 * @param {CalendarGroupByClassDetail[]} combination - Mảng các chi tiết lớp học được nhóm lại.
 * @returns {number} - Số lượng tiết học bị trùng lặp.
 *
 * Hàm này duyệt qua tất cả các cặp lớp học trong mảng `combination` và kiểm tra xem có tiết học nào bị trùng lặp hay không.
 * Nếu có, nó sẽ tính toán số lượng tiết học bị trùng lặp và cộng dồn vào biến `overlap`.
 *
 * Các điều kiện để xác định tiết học bị trùng lặp bao gồm:
 * - Ngày bắt đầu của tiết học 1 phải nhỏ hơn hoặc bằng ngày kết thúc của tiết học 2.
 * - Ngày kết thúc của tiết học 1 phải lớn hơn hoặc bằng ngày bắt đầu của tiết học 2.
 * - Tiết bắt đầu của tiết học 1 phải nhỏ hơn hoặc bằng tiết kết thúc của tiết học 2.
 * - Tiết kết thúc của tiết học 1 phải lớn hơn hoặc bằng tiết bắt đầu của tiết học 2.
 * - Ngày trong tuần của hai tiết học phải giống nhau.
 *
 * Nếu các điều kiện trên đều thỏa mãn, hàm sẽ tính toán số lượng ngày bị trùng lặp và số lượng tiết học bị trùng lặp trong các ngày đó.
 * Kết quả cuối cùng là tổng số tiết học bị trùng lặp giữa tất cả các lớp học trong nhóm.
 */
export function calculateOverlap(
  combination: CalendarGroupByClassDetail[],
  cache?: {
    [key: string]: number;
  }
): number {
  let overlap = 0;
  let combinationCacheKey = combination
    .map((cd) => [cd.majors[0], cd.subjectName, cd.subjectClassCode].join('-'))
    .join('|');

  if (cache && cache.hasOwnProperty(combinationCacheKey))
    return cache[combinationCacheKey];

  for (let i = 0; i < combination.length; i++)
    for (let j = i + 1; j < combination.length; j++) {
      const classDetail1 = combination[i];
      const classDetail2 = combination[j];

      const pairCacheKey = [
        classDetail1.majors[0],
        classDetail1.subjectName,
        classDetail1.subjectClassCode,
        classDetail2.majors[0],
        classDetail2.subjectName,
        classDetail2.subjectClassCode,
      ].join('|');

      if (cache && cache.hasOwnProperty(pairCacheKey)) {
        overlap += cache[pairCacheKey];
      } else {
        let classPairTotalOverlap = 0;
        for (let session1 of classDetail1.details)
          for (let session2 of classDetail2.details)
            if (
              session1.startDate <= session2.endDate &&
              session1.endDate >= session2.startDate &&
              session1.startSession <= session2.endSession &&
              session1.endSession >= session2.startSession &&
              session1.dayOfWeek === session2.dayOfWeek
            ) {
              const conflictStartDate = Math.max(
                session1.startDate,
                session2.startDate
              ); // Ngày bắt đầu trùng
              const conflictEndDate = Math.min(
                session1.endDate,
                session2.endDate
              ); // Ngày kết thúc trùng

              const conflictStartSession = Math.max(
                session1.startSession,
                session2.startSession
              ); // Tiết bắt đầu trùng
              const conflictEndSession = Math.min(
                session1.endSession,
                session2.endSession
              ); // Tiết kết thúc trùng

              classPairTotalOverlap +=
                countSpecificDayOfWeek(
                  conflictStartDate,
                  conflictEndDate,
                  session1.dayOfWeek
                ) *
                (conflictEndSession - conflictStartSession + 1);
            }
        cache && (cache[pairCacheKey] = classPairTotalOverlap);
        overlap += classPairTotalOverlap;
      }
    }

  cache && (cache[combinationCacheKey] = overlap);

  return overlap;
}

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

export function calculateTotalSessionsInSessionRange(
  combination: CalendarGroupByClassDetail[],
  startShiftSession: number,
  endShiftSession: number,
  cache?: {
    [key: string]: number;
  }
): number {
  const cacheKeyPrefix = `totalSessionsInSessionRange-${startShiftSession}-${endShiftSession}`;
  const combinationCacheKey = [
    cacheKeyPrefix,
    ...combination.map((cd) =>
      [cd.majors[0], cd.subjectName, cd.subjectClassCode].join('-')
    ),
  ].join('|');

  if (cache && cache.hasOwnProperty(combinationCacheKey))
    return cache[combinationCacheKey];

  const result = combination.reduce((acc, classData) => {
    const cacheKey = [
      cacheKeyPrefix,
      classData.majors[0],
      classData.subjectName,
      classData.subjectClassCode,
    ].join('|');

    if (cache && cache.hasOwnProperty(cacheKey)) acc += cache[cacheKey];
    else {
      let localAcc = 0;
      for (const sessionData of classData.details) {
        const overlapRange = getOverlapRange(
          [sessionData.startSession, sessionData.endSession],
          [startShiftSession, endShiftSession]
        );
        localAcc +=
          (overlapRange ? overlapRange[1] - overlapRange[0] + 1 : 0) *
          countSpecificDayOfWeek(
            sessionData.startDate,
            sessionData.endDate,
            sessionData.dayOfWeek
          );
      }

      cache && (cache[cacheKey] = localAcc);
      acc += localAcc;
    }

    return acc;
  }, 0);

  cache && (cache[combinationCacheKey] = result);

  return result;
}
