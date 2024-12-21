export type CalendarTableContent = {
  [date: string]: CalendarTableContentInDate;
};

export type CalendarTableContentInDate = {
  [session: number]: CalendarTableContentInSession;
};

export type CalendarTableContentInSession = { defaultName: string }[];

export type RawCalendar = [string, number, string, string, string];

/**
 * @typedef CalendarData
 * @description Định nghĩa kiểu dữ liệu cho thông tin lịch.
 *
 * @property {Calendar[]} calendar - Danh sách các lịch.
 * @property {CalendarGroupBySubjectName} calendarGroupBySubjectName - Nhóm lịch theo tên môn học.
 * @property {CalendarGroupByMajor} calendarGroupByMajor - Nhóm lịch theo chuyên ngành.
 * @property {number} minTime - Thời gian bắt đầu sớm nhất trong lịch.
 * @property {number} maxTime - Thời gian kết thúc muộn nhất trong lịch.
 * @property {number[]} dateList - Danh sách các ngày trong lịch.
 */
export type CalendarData = {
  calendar: Calendar[];
  calendarGroupBySubjectName: CalendarGroupBySubjectName;
  calendarGroupByMajor: CalendarGroupByMajor;
  minTime: number;
  maxTime: number;
  dateList: number[];
};

export type Calendar = {
  defaultName: string;
  majors: string[];
  nameOnly: string;
  codeOnly: string;
  dayOfWeek: number;
  startDate: number;
  endDate: number;
  startSession: number;
  endSession: number;
};

export type CalendarGroupByMajor = {
  [major: string]: CalendarGroupByMajorDetail;
};

export type CalendarGroupByMajorDetail = {
  major: string;
  subjects: CalendarGroupBySubjectName;

  // additional properties for calendar page
  expanded: boolean;
};

export type CalendarGroupBySubjectName = {
  [subjectName: string]: CalendarGroupBySubjectNameDetail;
};
export type CalendarGroupBySubjectNameDetail = {
  majors: string[];
  subjectName: string;
  classes: CalendarGroupByClass;

  // additional properties for calendar page
  selectedClass: string;
  displayOnCalendar: boolean;
};

export type CalendarGroupByClass = {
  [subjectClassCode: string]: CalendarGroupByClassDetail;
};
export type CalendarGroupByClassDetail = {
  majors: string[];
  subjectName: string;
  subjectClassCode: string;
  details: CalendarGroupBySession;
};

export type CalendarGroupBySession = [CalendarGroupBySessionDetail];
export type CalendarGroupBySessionDetail = {
  defaultName: string;
  startDate: number;
  endDate: number;
  dayOfWeek: number;
  startSession: number;
  endSession: number;
};

export type AutoMode =
  | 'none'
  | 'refer-non-overlap'
  | 'refer-non-overlap-morning'
  | 'refer-non-overlap-afternoon'
  | 'refer-non-overlap-evening';

export type ClassCombination = CalendarGroupByClassDetail[];
