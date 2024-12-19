import {
  CalendarData,
  CalendarGroupBySessionDetail,
  CalendarTableContent,
} from '../types/calendar';

function workerCalculateCalendarTableContent(
  calendarTableContent: CalendarTableContent,
  calendar: CalendarData,
  sessions: number[]
): {
  calendarTableContent: CalendarTableContent;
  isConflict: boolean;
} {
  let isConflict = false;

  // Danh sách ngày của học kỳ
  const dateList = calendar.dateList;

  // Lặp qua từng ngày
  for (const date of dateList) {
    // Lấy ra lịch học trong ngày
    const dateData = calendarTableContent[date];

    // Lặp qua từng tiết
    for (const session of sessions) {
      // Lấy ra thông tin lịch học của tiết đó
      dateData[session] = workerGetSessionContent(calendar, date, session);

      // Nếu tiết học đó có trên 2 môn học thì xem như tiết học bị trùng
      if (dateData[session].length > 1) isConflict = true;
    }
  }

  return {
    calendarTableContent,
    isConflict,
  };
}

function workerGetSessionContent(
  calendar: CalendarData,
  date: number,
  session: number
): CalendarGroupBySessionDetail[] {
  const result: CalendarGroupBySessionDetail[] = [];
  const dow = new Date(date).getDay();
  const dateDayOfWeek = dow === 0 ? 8 : dow;

  // Lặp qua từng khóa / ngành
  for (const majorName in calendar.calendarGroupByMajor) {
    // Chi tiết lịch học của khóa / ngành
    const majorData = calendar.calendarGroupByMajor[majorName];

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

self.onmessage = (message) => {
  message = message.data;
  switch (message.type) {
    case 'calculateCalendarTableContent': {
      self.postMessage(
        workerCalculateCalendarTableContent(
          message.data.calendarTableContent,
          message.data.calendar,
          message.data.sessions
        )
      );
      break;
    }
    default:
      self.postMessage(null);
  }
};
