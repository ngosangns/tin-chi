import {
  AutoMode,
  CalendarData,
  CalendarGroupByClassDetail,
  CalendarGroupByMajor,
  CalendarGroupBySessionDetail,
  CalendarGroupBySubjectName,
  CalendarTableContent,
  ClassCombination,
} from '../types/calendar';
import { calculateOverlapWithBitmask2 } from '../utils/calendar_overlap';

function workerCalculateCalendarTableContent(
  calendarTableContent: CalendarTableContent,
  calendarGroupByMajor: CalendarGroupByMajor,
  dateList: number[], // Danh sách ngày của học kỳ
  sessions: number[]
): {
  updatedCalendarTableContent: CalendarTableContent;
  updatedCalendarGroupByMajor: CalendarGroupByMajor;
  isConflict: boolean;
} {
  const updatedCalendarTableContent = structuredClone(calendarTableContent);
  const updatedCalendarGroupByMajor = structuredClone(calendarGroupByMajor);
  let isConflict = false;

  // Lặp qua từng ngày
  for (const date of dateList) {
    // Lấy ra lịch học trong ngày
    const dateData = updatedCalendarTableContent[date];

    // Lặp qua từng tiết
    for (const session of sessions) {
      // Lấy ra thông tin lịch học của tiết đó
      dateData[session] = workerGetSessionContent(
        updatedCalendarGroupByMajor,
        date,
        session
      );

      // Nếu tiết học đó có trên 2 môn học thì xem như tiết học bị trùng
      if (dateData[session].length > 1) isConflict = true;
    }
  }

  return {
    updatedCalendarTableContent,
    updatedCalendarGroupByMajor,
    isConflict,
  };
}

function workerGetSessionContent(
  calendarGroupByMajor: CalendarGroupByMajor,
  date: number,
  session: number
): CalendarGroupBySessionDetail[] {
  const result: CalendarGroupBySessionDetail[] = [];
  const dow = new Date(date).getDay();

  // Lặp qua từng khóa / ngành
  for (const majorName in calendarGroupByMajor) {
    // Chi tiết lịch học của khóa / ngành
    const majorData = calendarGroupByMajor[majorName];

    // Lặp qua từng môn của khóa / ngành
    for (const subjectName in majorData.subjects) {
      // Chi tiết lịch học của môn
      const subjectData = majorData.subjects[subjectName];

      // Nếu môn đó không được hiển thị trên lịch hoặc không có lớp nào được chọn
      // thì bỏ qua
      if (!subjectData.displayOnCalendar || !subjectData.selectedClass?.length)
        continue;

      // Chi tiết lịch học của lớp được chọn
      const classData = subjectData.classes[subjectData.selectedClass];

      // Lặp qua từng phần lịch của lớp
      for (const classPart of classData.details) {
        // Nếu thời gian của phần lịch học trùng khớp với thời gian hiện tại
        // thì thêm vào kết quả
        if (
          classPart.startDate <= date &&
          classPart.endDate >= date &&
          dow === classPart.dayOfWeek &&
          classPart.startSession <= session &&
          classPart.endSession >= session
        )
          result.push(classPart);
      }
    }
  }

  return result;
}

/**
 * Tìm ra tổ hợp các lớp từ các môn được chọn sao cho độ trùng lặp thời gian học là ít nhất
 *
 * @param selectedCalendar - Đối tượng chứa các môn học đã được chọn
 *
 * @returns Đối tượng CalendarTableContent chứa tổ hợp các lớp học tối ưu
 */
export async function workerAutoCalculateCalendarTableContent(
  calendarTableContent: CalendarTableContent,
  calendarGroupByMajor: CalendarGroupByMajor,
  dateList: number[], // Danh sách ngày của học kỳ
  sessions: number[], // Danh sách tiết học (1 -> 16),
  auto: AutoMode,
  autoTh: number
): Promise<{
  updatedCalendarTableContent: CalendarTableContent;
  updatedCalendarGroupByMajor: CalendarGroupByMajor;
  isConflict: boolean;
}> {
  const selectedSubjects = Object.keys(calendarGroupByMajor).reduce(
    (acc, majorKey) => {
      const subjectData = calendarGroupByMajor[majorKey].subjects;
      const selectedSubjects = Object.keys(subjectData).filter(
        (subjectKey) => subjectData[subjectKey].displayOnCalendar
      );
      for (const subjectKey of selectedSubjects)
        acc[subjectKey] = subjectData[subjectKey];
      return acc;
    },
    <CalendarGroupBySubjectName>{}
  );

  const selectedSubjectsKeys = Object.keys(selectedSubjects);
  const selectedSubjectsLength = selectedSubjectsKeys.length;

  const aDayInMiliseconds = 24 * 60 * 60 * 1000;
  const getDateIndex = (date: number) =>
    (date - dateList[0]) / aDayInMiliseconds;

  const classes: CalendarGroupByClassDetail[][] = []; // Danh sách các lớp
  const timeGrid: number[][][] = []; // Lịch học của tất cả các lớp
  const totalSessionsInSessionRange: [number, number, number][][] = []; // Tổng số tiết học trong mỗi buổi của tất cả các lớp

  selectedSubjectsKeys.forEach((subjectKey) => {
    const subjectData = selectedSubjects[subjectKey];

    const subjectClasses: CalendarGroupByClassDetail[] = []; // Danh sách các lớp
    const subjectTimeGrid: number[][] = []; // Lịch học của tất cả các lớp
    const subjectTotalSessionsInSessionRange: [number, number, number][] = []; // Tổng số tiết học trong mỗi buổi của tất cả các lớp

    Object.keys(subjectData.classes).forEach((classKey) => {
      const classData = subjectData.classes[classKey];
      const classScheduleGrid = new Array(dateList.length).fill(0);

      let totalMorningSessions = 0;
      let totalAfternoonSessions = 0;
      let totalEveningSessions = 0;

      classData.details.forEach((detail) => {
        const startDateIndex = getDateIndex(detail.startDate);
        const endDateIndex = getDateIndex(detail.endDate);

        for (let i = startDateIndex; i <= endDateIndex; i++) {
          classScheduleGrid[i] =
            ((1 << (detail.endSession - detail.startSession + 1)) - 1) <<
            (sessions.length - detail.endSession); // Tạo lịch bitmask của lớp trong lịch hiện tại

          // Lấy ra số tuần giữa ngày bắt đầu và ngày kết thúc
          const totalWeek =
            (detail.endDate - detail.startDate + aDayInMiliseconds) /
            (aDayInMiliseconds * 7);

          // Tính số tiết học trong buổi sáng
          if (detail.startSession <= 6)
            totalMorningSessions +=
              (Math.min(6, detail.endSession) - detail.startSession + 1) *
              totalWeek;

          // Tính số tiết học trong buổi chiều
          if (detail.startSession <= 12 && detail.endSession >= 7)
            totalAfternoonSessions +=
              (Math.min(12, detail.endSession) -
                Math.max(7, detail.startSession) +
                1) *
              totalWeek;

          // Tính số tiết học trong buổi tối
          if (detail.endSession >= 13)
            totalEveningSessions +=
              (detail.endSession - Math.max(13, detail.startSession) + 1) *
              totalWeek;
        }
      });

      subjectTimeGrid.push(classScheduleGrid); // Thêm lịch học của lớp vào lịch môn
      subjectClasses.push(classData); // Thêm lớp vào danh sách các lớp của môn
      subjectTotalSessionsInSessionRange.push([
        totalMorningSessions,
        totalAfternoonSessions,
        totalEveningSessions,
      ]); // Thêm tổng số tiết học trong mỗi buổi của lớp trong môn học
    });

    timeGrid.push(subjectTimeGrid); // Thêm lịch học của môn học vào lịch
    classes.push(subjectClasses); // Thêm danh sách các lớp của môn học vào danh sách các lớp
    totalSessionsInSessionRange.push(subjectTotalSessionsInSessionRange); // Thêm tổng số tiết học trong mỗi buổi của các lớp trong môn học
  });

  const combinations: ClassCombination[] = [];

  // Hàm tạo tổ hợp
  function generateCombination(current: ClassCombination, index: number) {
    if (index === selectedSubjectsLength) {
      combinations.push([...current]);
      return;
    }

    const subjectData = selectedSubjects[selectedSubjectsKeys[index]];
    const classKeys = Object.keys(subjectData.classes);

    for (const classKey of classKeys) {
      current.push(subjectData.classes[classKey]);
      generateCombination(current, index + 1);
      current.pop();
    }
  }

  const start = performance.now();

  generateCombination([], 0);

  // const combinations = generateCombinations(selectedSubjects);
  console.log('Generate combinations:', performance.now() - start);
  console.log('Total combinations:', combinations.length);

  const start2 = performance.now();

  const combinationsWithOverlap: {
    overlap: number;
    totalSessionsInSessionRangeOfCombination: number;
    combination: ClassCombination;
  }[] = [];
  for (const combination of combinations) {
    combinationsWithOverlap.push({
      overlap: calculateOverlapWithBitmask2(
        combination,
        dateList[0],
        dateList[dateList.length - 1],
        sessions.length
      ),
      totalSessionsInSessionRangeOfCombination: 0,
      combination,
    });
  }

  console.log('Calculate overlap:', performance.now() - start2);

  const combinationsWithOverlapSorted = combinationsWithOverlap!.sort(
    (a, b) => {
      const diff = a.overlap - b.overlap;
      if (diff === 0)
        return -(
          a.totalSessionsInSessionRangeOfCombination -
          b.totalSessionsInSessionRangeOfCombination
        );
      return diff;
    }
  );

  const bestCombination = combinationsWithOverlapSorted.length
    ? combinationsWithOverlapSorted[
        autoTh % combinationsWithOverlapSorted.length
      ]
    : undefined;

  const start3 = performance.now();

  const updatedCalendarGroupByMajor = bestCombination
    ? (() => {
        const clonedCalendarGroupByMajor =
          structuredClone(calendarGroupByMajor);
        for (const cls of bestCombination.combination) {
          const classData =
            selectedSubjects[cls.subjectName].classes[cls.subjectClassCode];
          for (const major of classData.majors) {
            const majorData = clonedCalendarGroupByMajor[major];
            const subjectData = majorData.subjects[classData.subjectName];
            subjectData.selectedClass = classData.subjectClassCode;
          }
        }
        return clonedCalendarGroupByMajor;
      })()
    : calendarGroupByMajor;
  const updatedCalendarTableContent = bestCombination
    ? workerCalculateCalendarTableContent(
        calendarTableContent,
        updatedCalendarGroupByMajor,
        dateList,
        sessions
      ).updatedCalendarTableContent
    : calendarTableContent;

  console.log('Update calendar:', performance.now() - start3);

  return {
    updatedCalendarTableContent,
    updatedCalendarGroupByMajor,
    isConflict: bestCombination ? bestCombination.overlap > 0 : false,
  };
}

self.onmessage = async (message: {
  data: {
    type: string;
    data: any;
  };
}) => {
  switch (message.data.type) {
    case 'calculateCalendarTableContent': {
      const data = message.data.data as {
        calendarTableContent: CalendarTableContent;
        calendar: CalendarData;
        sessions: number[];
        auto: AutoMode;
        autoTh: number;
      };

      switch (data.auto) {
        case 'none': {
          self.postMessage({
            type: message.data.type,
            data: workerCalculateCalendarTableContent(
              data.calendarTableContent,
              data.calendar.calendarGroupByMajor,
              data.calendar.dateList,
              data.sessions
            ),
          });
          break;
        }
        case 'refer-non-overlap':
        case 'refer-non-overlap-morning':
        case 'refer-non-overlap-afternoon':
        case 'refer-non-overlap-evening':
          self.postMessage({
            type: message.data.type,
            data: await workerAutoCalculateCalendarTableContent(
              data.calendarTableContent,
              data.calendar.calendarGroupByMajor,
              data.calendar.dateList,
              data.sessions,
              data.auto,
              data.autoTh
            ),
          });
      }

      break;
    }
  }
};
