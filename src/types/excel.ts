export enum Field {
  Class = 'class',
  Teacher = 'teacher',

  DayOfWeek = 'dayOfWeek',
  DayOfWeekStandard = 'dayOfWeekStandard',

  Session = 'session',
  StartSession = 'startSession',
  EndSession = 'endSession',

  StartDate = 'startDate',
  EndDate = 'endDate',
}

export type SheetData = Record<
  string,
  {
    startRow: number;
    endRow: number;
    fieldColumn: {
      [Field.Class]: string;
      [Field.DayOfWeek]: string;
      [Field.Session]: string;
      [Field.StartDate]: string;
      [Field.EndDate]: string;
      [Field.Teacher]: string;
    };
  }
>; // key: sheetName

export type JSONData = Record<
  string,
  {
    fieldData: {
      [Field.Class]: string[];
      [Field.DayOfWeek]: string[];
      [Field.Session]: string[];
      [Field.StartDate]: string[];
      [Field.EndDate]: string[];
      [Field.Teacher]: string[];
    };
  }
>; // key: sheetName

export type CellData = Record<string, unknown>;

type MajorData = Record<string, SubjectData>; // key: subject name

type SubjectData = Record<string, ClassData>; // key: class code

export interface ClassData {
  practiceSchedules?: Record<string, Schedules>; // key: practice class code
  schedules: Schedules;
  [Field.Teacher]: string;
}

type Schedules = Schedule[];

interface Schedule {
  [Field.StartDate]: number;
  [Field.EndDate]: number;
  [Field.DayOfWeekStandard]: number;
  [Field.StartSession]: number;
  [Field.EndSession]: number;
}

export interface JSONResultData {
  title: string;
  minDate: number;
  maxDate: number;
  majors: Record<string, MajorData>;
}
