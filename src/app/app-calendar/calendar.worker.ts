import {
  START_MORNING_SESSION,
  END_MORNING_SESSION,
  START_AFTERNOON_SESSION,
  END_AFTERNOON_SESSION,
  START_EVENING_SESSION,
  END_EVENING_SESSION,
  MAX_SESSION,
  MIN_SESSION,
} from '../../constants/calendar';
import { AutoMode } from '../../types/calendar';
import { Field, JSONResultData } from '../../types/excel';
import { numToDate } from '../../utils/date';

export type CalendarWorkerRepsonse = {
  data: GenerateCombinationOfSubjectsResponse;
};

type GenerateCombinationOfSubjectsResponse = {
  selectedClasses: [string, string, string][];
};

// Tìm ra tổ hợp các lớp từ các môn được chọn sao cho độ trùng lặp thời gian học là ít nhất
export function generateCombinationOfSubjects(e: {
  calendar: JSONResultData;
  selectedSubjects: [string, string][]; // Danh sách các môn học được chọn: [majorKey, subjectKey][]
  auto: AutoMode;
  autoTh: number;
}): GenerateCombinationOfSubjectsResponse {
  const { calendar, selectedSubjects, auto, autoTh } = e;

  const classes: [string, string, string][][] = []; // Danh sách các lớp của các môn: [majorKey, subjectKey, classCode][numClasses][numSubjects]
  const timeGrid: [number, number, number, number][][][] = []; // Lịch học của các lớp của các môn: [startDate, endDate, dayOfWeek, sessionBitmask][numSchedules][numClasses][numSubjects]
  const totalSessionsInShift: number[][] = []; // Tổng số tiết học trong buổi auto của các lớp của các môn: [numClasses][numSubjects]

  const autoData = [
    ['refer-non-overlap-morning', START_MORNING_SESSION, END_MORNING_SESSION],
    [
      'refer-non-overlap-afternoon',
      START_AFTERNOON_SESSION,
      END_AFTERNOON_SESSION,
    ],
    ['refer-non-overlap-evening', START_EVENING_SESSION, END_EVENING_SESSION],
  ].find((item) => item[0] === auto) as [string, number, number];

  const aDayInMiliseconds = 24 * 60 * 60 * 1000;

  selectedSubjects.forEach(([majorKey, subjectKey]) => {
    const subjectData = calendar.majors[majorKey][subjectKey];
    const subjectClasses: [string, string, string][] = []; // Danh sách các lớp: [majorKey, subjectKey, classCode][numSubjects]
    const subjectTimeGrid: [number, number, number, number][][] = []; // Lịch học của tất cả các lớp: [startDate, endDate, dayOfWeek, sessionBitmask][numSchedules][numClasses]
    const subjectTotalSessionsInShift: number[] = []; // Tổng số tiết học trong buổi auto của tất cả các lớp: [numClasses]

    Object.entries(subjectData).forEach(([classCode, classData]) => {
      const classScheduleGrid: [number, number, number, number][] = []; // Lịch học của lớp: [startDate, endDate, dayOfWeek, sessionBitmask][numClasses]

      let totalShiftSesion = 0;

      for (const schedule of classData.schedules) {
        const classScheduleGridAtI: [number, number, number, number] = [
          numToDate(schedule[Field.StartDate]).getTime(),
          numToDate(schedule[Field.EndDate]).getTime() + aDayInMiliseconds - 1,
          schedule[Field.DayOfWeekStandard],
          ((1 <<
            (schedule[Field.EndSession] - schedule[Field.StartSession] + 1)) -
            1) <<
            (MAX_SESSION - MIN_SESSION + 1 - schedule[Field.EndSession]), // Tạo lịch bitmask của lớp trong lịch hiện tại
        ];

        // Lấy ra số tuần giữa ngày bắt đầu và ngày kết thúc
        const [startDate, endDate] = classScheduleGridAtI;
        const totalWeeks = (endDate + 1 - startDate) / (aDayInMiliseconds * 7);

        classScheduleGrid.push(classScheduleGridAtI); // Thêm lịch học của lớp vào lịch

        // Tính số tiết học trong buổi
        if (
          autoData &&
          schedule[Field.StartSession] <= autoData[2] &&
          schedule[Field.EndSession] >= autoData[1]
        )
          totalShiftSesion +=
            (Math.min(autoData[2], schedule[Field.EndSession]) -
              Math.max(autoData[1], schedule[Field.StartSession]) +
              1) *
            totalWeeks;
      }

      subjectTimeGrid.push(classScheduleGrid); // Thêm lịch học của lớp vào lịch môn
      subjectClasses.push([majorKey, subjectKey, classCode]); // Thêm lớp vào danh sách các lớp của môn
      subjectTotalSessionsInShift.push(totalShiftSesion); // Thêm tổng số tiết học của ca học của lớp trong môn học
    });

    classes.push(subjectClasses); // Thêm danh sách các lớp của môn học vào danh sách các lớp
    timeGrid.push(subjectTimeGrid); // Thêm lịch học của môn học vào lịch
    totalSessionsInShift.push(subjectTotalSessionsInShift); // Thêm tổng số tiết học trong mỗi buổi của các lớp trong môn học
  });

  const combinations: number[][] = []; // Danh sách các tổ hợp: Số lượng tổ hợp * (numSubjects + 1)
  const threshold = 12; // số tiết học có thể trùng tối đa trong 1 tổ hợp

  function countBit1(n: number): number {
    let count = 0;
    while (n > 0) {
      count += n & 1; // Nếu bit cuối là 1, tăng count
      n >>= 1; // Dịch phải để kiểm tra bit tiếp theo
    }
    return count;
  }

  // Hàm tính overlap giữa 2 lớp
  function calculateOverlapBetween2Classes(
    c1: [number, number, number, number][], // [startDate, endDate, dayOfWeek, sessionBitmask][]
    c2: [number, number, number, number][]
  ): number {
    if (c1.length === 0 || c2.length === 0) return 0;

    // Kiểm tra nếu khoảng thời gian của hai lớp không giao nhau thì trả về 0
    if (c1[c1.length - 1][1] < c2[0][0] || c2[c2.length - 1][1] < c1[0][0])
      return 0;

    let overlap = 0;

    // Kiểm tra nếu khoảng thời gian của hai lớp có giao nhau và cùng ngày học trong tuần
    for (const [startDate1, endDate1, dayOfWeek1, timeGrid1] of c1)
      for (const [startDate2, endDate2, dayOfWeek2, timeGrid2] of c2)
        if (
          startDate1 <= endDate2 &&
          endDate1 >= startDate2 &&
          dayOfWeek1 === dayOfWeek2
        ) {
          // Tính toán overlap bằng cách sử dụng bitmask
          const _overlap = timeGrid1 & timeGrid2;
          // Tính tổng số tuần mà hai lớp học chung
          const totalWeeks =
            (Math.min(endDate1, endDate2) -
              Math.max(startDate1, startDate2) +
              aDayInMiliseconds) /
            (aDayInMiliseconds * 7);
          // Nếu có overlap, đếm số bit 1 trong bitmask và cộng vào tổng overlap
          if (_overlap > 0) overlap += countBit1(_overlap) * totalWeeks;
        }

    return overlap;
  }

  // Hàm tạo tổ hợp
  function generateCombination(
    current: number[],
    index: number,
    overlap: number
  ) {
    // Nếu đã chọn hết tất cả các môn thì thêm tổ hợp này vào danh sách tổ hợp
    if (index === selectedSubjects.length) {
      combinations.push([overlap, ...current]);
      return;
    }

    const classesData = classes[index]; // Lấy danh sách các lớp của môn học hiện tại
    for (let i = 0; i < classesData.length; i++) {
      let newOverlap = overlap;

      const currentClassTimeGrid = timeGrid[index][i]; // Lấy lịch học của lớp hiện tại

      // Tính số tiết học bị trùng trong trường hợp thêm lớp này vào tổ hợp
      for (let j = 0; j < index; j++) {
        newOverlap += calculateOverlapBetween2Classes(
          timeGrid[j][current[j]],
          currentClassTimeGrid
        );

        // Nếu số tiết học bị trùng vượt quá ngưỡng thì bỏ qua tổ hợp này
        if (newOverlap > threshold) break;
      }

      // Nếu số tiết học bị trùng vượt quá ngưỡng thì bỏ qua tổ hợp này
      if (newOverlap > threshold) continue;

      current[index] = i; // Lưu lớp được chọn
      generateCombination(current, index + 1, newOverlap); // Tìm tổ hợp cho môn tiếp theo
    }
  }

  const start = performance.now();

  generateCombination(new Array(selectedSubjects.length).fill(0), 0, 0); // Phần tử đầu tiên trong mảng là tổng số tiết học bị trùng

  console.log('Generate combinations time:', performance.now() - start);
  console.log('Total combinations:', combinations.length);

  // Sắp xếp các tổ hợp theo thứ tự tăng dần của số tiết học bị trùng
  const combinationsWithOverlapSorted = combinations.sort((a, b) => {
    const diff = a[0] - b[0];
    if (diff !== 0 || !autoData) return diff;

    return (
      b
        .slice(1)
        .reduce((acc, cur, i) => acc + totalSessionsInShift[i][cur], 0) -
      a.slice(1).reduce((acc, cur, i) => acc + totalSessionsInShift[i][cur], 0)
    );
  });

  if (combinationsWithOverlapSorted.length) {
    // Tìm tổ hợp tối ưu nhất dựa trên số tiết học bị trùng
    const bestCombinationIndex = autoTh % combinationsWithOverlapSorted.length;

    const bestCombination =
      combinationsWithOverlapSorted[bestCombinationIndex].slice(1);

    return {
      selectedClasses: bestCombination.map(
        (classIndex, i) => classes[i][classIndex]
      ),
    };
  }

  return {
    selectedClasses: [],
  };
}

self.onmessage = (e) => self.postMessage(generateCombinationOfSubjects(e.data));
