import {
  CalendarGroupByClassDetail,
  CalendarGroupBySubjectName,
} from '../types/calendar';
import { countSpecificDayOfWeek } from './date';

/**
 * Tạo ra các tổ hợp từ các môn học đã chọn.
 *
 * @param selectedSubjects - Đối tượng chứa các môn học đã chọn, được nhóm theo tên môn học.
 * @returns Một mảng các tổ hợp, mỗi tổ hợp là một mảng chứa các chi tiết lớp học.
 *
 * Hàm này sử dụng phương pháp đệ quy để tạo ra tất cả các tổ hợp có thể có từ các môn học đã chọn.
 * - `subjectKeys` là mảng chứa các khóa của các môn học.
 * - `combinations` là mảng chứa các tổ hợp kết quả.
 * - Hàm `backtrack` được sử dụng để duyệt qua tất cả các tổ hợp có thể có.
 *   - `index` là chỉ số hiện tại trong mảng `subjectKeys`.
 *   - `currentCombination` là tổ hợp hiện tại đang được xây dựng.
 * - Nếu `index` bằng độ dài của `subjectKeys`, tổ hợp hiện tại đã hoàn thành và được thêm vào `combinations`.
 * - `subjectKey` là khóa của môn học hiện tại.
 * - `subjectData` là dữ liệu của môn học hiện tại.
 * - `classKeys` là mảng chứa các khóa của các lớp học trong môn học hiện tại.
 * - Với mỗi `classKey`, lớp học tương ứng được thêm vào `currentCombination` và hàm `backtrack` được gọi đệ quy với `index + 1`.
 * - Sau khi gọi đệ quy, lớp học được loại bỏ khỏi `currentCombination` để thử các tổ hợp khác.
 */
export function generateCombinations(
  selectedSubjects: CalendarGroupBySubjectName
): CalendarGroupByClassDetail[][] {
  const subjectKeys = Object.keys(selectedSubjects);
  const combinations: CalendarGroupByClassDetail[][] = [];

  function backtrack(
    index: number,
    currentCombination: CalendarGroupByClassDetail[]
  ) {
    if (index === subjectKeys.length) {
      // clone currentCombination completed result to avoid .pop()
      combinations.push([...currentCombination]);
      return;
    }

    const subjectKey = subjectKeys[index];
    const subjectData = selectedSubjects[subjectKey];
    const classKeys = Object.keys(subjectData.classes);

    classKeys.forEach((classKey) => {
      currentCombination.push(subjectData.classes[classKey]);
      backtrack(index + 1, currentCombination);
      currentCombination.pop();
    });
  }

  backtrack(0, []);

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
  combination: CalendarGroupByClassDetail[]
): number {
  let overlap = 0;
  for (let i = 0; i < combination.length; i++)
    for (let j = i + 1; j < combination.length; j++) {
      const classDetail1 = combination[i];
      const classDetail2 = combination[j];
      for (let session1 of classDetail1.details) {
        for (let session2 of classDetail2.details) {
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

            overlap +=
              countSpecificDayOfWeek(
                conflictStartDate,
                conflictEndDate,
                session1.dayOfWeek
              ) *
              (conflictEndSession - conflictStartSession + 1);
          }
        }
      }
    }

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

export function calculateTotalSessionsInSessionRangeOfCombination(
  combination: CalendarGroupByClassDetail[],
  startShiftSession: number,
  endShiftSession: number
): number {
  return combination.reduce((acc, classData) => {
    for (const sessionData of classData.details) {
      const overlapMorningSessionRange = getOverlapRange(
        [sessionData.startSession, sessionData.endSession],
        [startShiftSession, endShiftSession]
      );
      acc +=
        (overlapMorningSessionRange
          ? overlapMorningSessionRange[1] - overlapMorningSessionRange[0] + 1
          : 0) *
        countSpecificDayOfWeek(
          sessionData.startDate,
          sessionData.endDate,
          sessionData.dayOfWeek
        );
    }
    return acc;
  }, 0);
}
