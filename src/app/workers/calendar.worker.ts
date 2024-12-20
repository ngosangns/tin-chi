import {
  END_AFTERNOON_SESSION,
  END_EVENING_SESSION,
  END_MORNING_SESSION,
  START_AFTERNOON_SESSION,
  START_EVENING_SESSION,
  START_MORNING_SESSION,
} from '../constants/calendar';
import {
  AutoMode,
  CalendarData,
  CalendarGroupByMajor,
  CalendarGroupBySessionDetail,
  CalendarGroupBySubjectName,
  CalendarTableContent,
} from '../types/calendar';
import {
  calculateOverlap,
  calculateTotalSessionsInSessionRangeOfCombination,
  generateCombinations,
} from '../utils/calendar_overlap';

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
  sessions: number[], // Danh sách tiết học (1 -> 16),
  auto: AutoMode
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
      totalMorningSessions: calculateTotalSessionsInSessionRangeOfCombination(
        combination,
        START_MORNING_SESSION,
        END_MORNING_SESSION
      ),
      totalAfternoonSessions: calculateTotalSessionsInSessionRangeOfCombination(
        combination,
        START_AFTERNOON_SESSION,
        END_AFTERNOON_SESSION
      ),
      totalEveningSessions: calculateTotalSessionsInSessionRangeOfCombination(
        combination,
        START_EVENING_SESSION,
        END_EVENING_SESSION
      ),
      combination: combination,
    }))
    .sort((a, b) => {
      const diff = a.overlap - b.overlap;
      if (diff === 0 && auto !== 'none' && auto !== 'refer-non-overlap') {
        switch (auto) {
          case 'refer-non-overlap-morning':
            return -(a.totalMorningSessions - b.totalMorningSessions);
          case 'refer-non-overlap-afternoon':
            return -(a.totalAfternoonSessions - b.totalAfternoonSessions);
          case 'refer-non-overlap-evening':
            return -(a.totalEveningSessions - b.totalEveningSessions);
        }
      }
      return diff;
    });

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

self.onmessage = (message: {
  data: {
    type: string;
    data: any;
  };
}) => {
  const data = message.data.data as {
    calendarTableContent: CalendarTableContent;
    calendar: CalendarData;
    sessions: number[];
    auto: AutoMode;
  };

  if (message.data.type === 'calculateCalendarTableContent') {
    const data = message.data.data as {
      calendarTableContent: CalendarTableContent;
      calendar: CalendarData;
      sessions: number[];
      auto: AutoMode;
    };

    switch (data.auto) {
      case 'none': {
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
      default:
        self.postMessage(
          workerAutoCalculateCalendarTableContent(
            data.calendarTableContent,
            data.calendar.calendarGroupByMajor,
            data.calendar.dateList,
            data.sessions,
            data.auto
          )
        );
    }
  } else self.postMessage(null);
};
