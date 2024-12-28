import {
  END_AFTERNOON_SESSION,
  END_EVENING_SESSION,
  END_MORNING_SESSION,
  MAX_SESSION,
  MIN_SESSION,
  START_AFTERNOON_SESSION,
  START_EVENING_SESSION,
  START_MORNING_SESSION,
} from '../constants/calendar';
import { AutoMode } from '../types/calendar';
import { Field, JSONResultData } from '../types/excel';
import {
  aDayInMiliseconds,
  calculateOverlapBetween2Classes,
} from '../utils/calendar_overlap';

// Tìm ra tổ hợp các lớp từ các môn được chọn sao cho độ trùng lặp thời gian học là ít nhất
export async function generateCombinationOfSubjects(
  calendar: JSONResultData,
  selectedSubjects: [string, string][], // Danh sách các môn học được chọn: [majorKey, subjectKey][]
  auto: AutoMode,
  autoTh: number
): Promise<{
  selectedClasses: [string, string, string][];
}> {
  // n = số môn
  // m = số lớp của mỗi môn
  // p = số lịch của mỗi lớp
  const classes: [string, string, string][][] = []; // Danh sách các lớp của các môn: n * m * [majorKey, subjectKey, classCode]
  const timeGrid: [number, number, number, number][][][] = []; // Lịch học của các lớp của các môn: n * m * p * [startDate, endDate, dayOfWeek, sessionBitmask]
  const totalSessionsInShift: number[][] = []; // Tổng số tiết học trong buổi auto của các lớp của các môn: n * m

  const autoData = [
    ['refer-non-overlap-morning', START_MORNING_SESSION, END_MORNING_SESSION],
    [
      'refer-non-overlap-afternoon',
      START_AFTERNOON_SESSION,
      END_AFTERNOON_SESSION,
    ],
    ['refer-non-overlap-evening', START_EVENING_SESSION, END_EVENING_SESSION],
  ].find((item) => item[0] === auto) as [string, number, number];

  selectedSubjects.forEach(([majorKey, subjectKey]) => {
    const subjectData = calendar.majors[majorKey][subjectKey];
    const subjectClasses: [string, string, string][] = []; // Danh sách các lớp: n * [majorKey, subjectKey, classCode]
    const subjectTimeGrid: [number, number, number, number][][] = []; // Lịch học của tất cả các lớp: m * p * [startDate, endDate, dayOfWeek, sessionBitmask]
    const subjectTotalSessionsInShift: number[] = []; // Tổng số tiết học trong buổi auto của tất cả các lớp: m

    Object.entries(subjectData).forEach(([classCode, classData]) => {
      const classScheduleGrid: [number, number, number, number][] = []; // Lịch học của lớp: m * [startDate, endDate, dayOfWeek, sessionBitmask]

      let totalShiftSesion = 0;

      for (const schedule of classData.schedules) {
        // Lấy ra số tuần giữa ngày bắt đầu và ngày kết thúc
        const totalWeeks =
          (schedule.endDate - schedule.startDate + aDayInMiliseconds) /
          (aDayInMiliseconds * 7);

        const classScheduleGridAtI: [number, number, number, number] = [
          schedule[Field.StartDate],
          schedule[Field.EndDate],
          schedule[Field.DayOfWeekStandard],
          ((1 <<
            (schedule[Field.EndSession] - schedule[Field.StartSession] + 1)) -
            1) <<
            (MAX_SESSION - MIN_SESSION + 1 - schedule[Field.EndSession]), // Tạo lịch bitmask của lớp trong lịch hiện tại
        ];

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

  const combinations: number[][] = []; // Danh sách các tổ hợp: Số lượng tổ hợp * (n + 1)
  const threshold = 12; // số tiết học có thể trùng tối đa trong 1 tổ hợp

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

self.onmessage = async (message: {
  data: {
    type: string;
    data: any;
  };
}) => {
  switch (message.data.type) {
    case 'generateCombinationOfSubjects': {
      const data = message.data.data as {
        calendar: JSONResultData;
        selectedSubjects: [string, string][];
        auto: AutoMode;
        autoTh: number;
      };

      switch (data.auto) {
        case 'refer-non-overlap':
        case 'refer-non-overlap-morning':
        case 'refer-non-overlap-afternoon':
        case 'refer-non-overlap-evening':
          self.postMessage({
            type: message.data.type,
            data: await generateCombinationOfSubjects(
              data.calendar,
              data.selectedSubjects,
              data.auto,
              data.autoTh
            ),
          });
      }

      break;
    }
  }
};
