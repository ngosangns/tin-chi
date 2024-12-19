export type CalendarTableContent = {
  [date: string]: CalendarTableContentInDate;
};

export type CalendarTableContentInDate = {
  [session: number]: CalendarTableContentInSession;
};

export type CalendarTableContentInSession = { defaultName: string }[];

export type SelectedCalendar = {
  [subjectName: string]: {
    isChecked: boolean;
    class: {
      code: string;
      details: CalendarGroupBySession;
    } | null;
  };
};

export type RawCalendar = [string, number, string, string, string];

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
  subjects: CalendarGroupBySubjectName;

  // additional properties for calendar page
  expanded: boolean;
};

export type CalendarGroupBySubjectName = {
  [subjectName: string]: CalendarGroupBySubjectNameDetail;
};
export type CalendarGroupBySubjectNameDetail = {
  majors: string[];
  classes: CalendarGroupByClass;

  // additional properties for calendar page
  selectedClass: string;
  displayOnCalendar: boolean;
};

export type CalendarGroupByClass = {
  [subjectClassCode: string]: CalendarGroupByClassDetail;
};
export type CalendarGroupByClassDetail = {
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
