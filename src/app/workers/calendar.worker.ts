import {
  CalendarData,
  CalendarGroupByClassDetail,
  CalendarGroupByMajor,
  CalendarGroupBySessionDetail,
  CalendarGroupBySubjectName,
  CalendarTableContent,
} from '../types/calendar';

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
  const dateDayOfWeek = dow === 0 ? 8 : dow;

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
          dateDayOfWeek === classPart.dayOfWeek &&
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
export function workerAutoCalculateCalendarTableContent(
  calendarTableContent: CalendarTableContent,
  calendarGroupByMajor: CalendarGroupByMajor,
  dateList: number[], // Danh sách ngày của học kỳ
  sessions: number[]
): {
  updatedCalendarTableContent: CalendarTableContent;
  updatedCalendarGroupByMajor: CalendarGroupByMajor;
  isConflict: boolean;
} {
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

  const combinations = generateCombinations(selectedSubjects);
  const combinationsOrderByOverlap = combinations
    .map((combination) => ({
      overlap: calculateOverlap(combination),
      combination: combination,
    }))
    .sort((a, b) => a.overlap - b.overlap);

  const bestCombination = combinationsOrderByOverlap.length
    ? combinationsOrderByOverlap[0]
    : undefined;

  const updatedCalendarGroupByMajor = bestCombination
    ? (() => {
        const clonedCalendarGroupByMajor =
          structuredClone(calendarGroupByMajor);
        for (const classData of bestCombination.combination)
          for (const major of classData.majors) {
            const majorData = clonedCalendarGroupByMajor[major];
            const subjectData = majorData.subjects[classData.subjectName];
            subjectData.selectedClass = classData.subjectClassCode;
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

  return {
    updatedCalendarTableContent,
    updatedCalendarGroupByMajor,
    isConflict: bestCombination ? bestCombination.overlap > 0 : false,
  };
}

function generateCombinations(
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

function calculateOverlap(combination: CalendarGroupByClassDetail[]): number {
  let overlap = 0;
  const sessions: { [key: string]: boolean } = {};

  for (let i = 0; i < combination.length; i++)
    for (let j = i + 1; j < combination.length; j++) {
      const classDetail1 = combination[i];
      const classDetail2 = combination[j];
      for (let session1 of classDetail1.details) {
        for (let session2 of classDetail2.details) {
          if (
            session1.dayOfWeek === session2.dayOfWeek &&
            session1.startDate <= session2.endDate &&
            session1.endDate >= session2.startDate &&
            session1.startSession <= session2.endSession &&
            session1.endSession >= session2.startSession
          ) {
            overlap++;
          }
        }
      }
    }

  return overlap;
}

self.onmessage = (message: {
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
      };
      self.postMessage(
        workerCalculateCalendarTableContent(
          data.calendarTableContent,
          data.calendar.calendarGroupByMajor,
          data.calendar.dateList,
          data.sessions
        )
      );
      break;
    }
    case 'autoCalculateCalendarTableContent': {
      const data = message.data.data as {
        calendarTableContent: CalendarTableContent;
        calendar: CalendarData;
        sessions: number[];
      };
      self.postMessage(
        workerAutoCalculateCalendarTableContent(
          data.calendarTableContent,
          data.calendar.calendarGroupByMajor,
          data.calendar.dateList,
          data.sessions
        )
      );
      break;
    }
    default:
      self.postMessage(null);
  }
};
