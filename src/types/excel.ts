export enum Field {
  Class = 'class',
  DayOfWeek = 'day',
  Session = 'session',
  StartDate = 'startDate',
  EndDate = 'endDate',
  Teacher = 'teacher',
}

export type SheetData = {
  [sheetName: string]: {
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
  };
};

export type JSONData = {
  [sheetName: string]: {
    fieldData: {
      [Field.Class]: string[];
      [Field.DayOfWeek]: string[];
      [Field.Session]: string[];
      [Field.StartDate]: string[];
      [Field.EndDate]: string[];
      [Field.Teacher]: string[];
    };
  };
};

export interface CellData {
  [key: string]: any;
}

export interface JSONResultData {
  title: string;
  data: [string, number, string, string, string][]; // [class, day, startDate, endDate, session, teacher]
}
