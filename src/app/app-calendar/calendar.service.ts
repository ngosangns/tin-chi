import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { JSON_PATH } from '../../constants/calendar';
import { AutoMode } from '../../types/calendar';
import { Field, JSONResultData } from '../../types/excel';
import { getTotalDaysBetweenDates, numToDate } from '../../utils/date';
import { MajorSelectedSubjects } from './app-calendar.component';
import { CalendarWorkerRepsonse } from './calendar.worker';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  readonly calendar$ = new BehaviorSubject<JSONResultData>({
    title: '',
    minDate: 0,
    maxDate: 0,
    majors: {},
  });

  readonly selectedClasses$ = new BehaviorSubject<MajorSelectedSubjects>({});

  autoTh$ = new BehaviorSubject<number>(-1); // Thứ tự của kết quả cần lấy, dùng trong trường hợp tự động xếp lịch và muốn lấy kết quả khác với kết quả đầu tiên
  oldAuto$ = new BehaviorSubject<AutoMode | null>(null); // Kiểu tự động xếp lịch

  readonly calendarTableData$ = combineLatest({
    calendar: this.calendar$,
    selectedClasses: this.selectedClasses$,
  }).pipe(
    map(({ calendar, selectedClasses }) => {
      const minDate = numToDate(calendar.minDate);
      const maxDate = numToDate(calendar.maxDate);
      const totalDays = getTotalDaysBetweenDates(minDate, maxDate);

      const calendarTableData: {
        startSession: number;
        endSession: number;
        subjectName: string;
        classCode: string;
      }[][][] = new Array(totalDays + 1).fill(null).map(() => []);

      let totalConflictedSessions = 0;

      for (const majorKey of Object.keys(selectedClasses))
        for (const subjectName of Object.keys(selectedClasses[majorKey])) {
          const selectedSubjectData = selectedClasses[majorKey][subjectName];
          if (!selectedSubjectData.show || !selectedSubjectData.class) continue;

          const classData =
            calendar.majors[majorKey][subjectName][selectedSubjectData.class];

          for (const schedule of classData.schedules) {
            let isMeetRightDayOfWeek = false;

            const startDate = numToDate(schedule[Field.StartDate]);
            const endDate = numToDate(schedule[Field.EndDate]);

            for (
              const date = new Date(startDate);
              date <= endDate;
              date.setDate(date.getDate() + (isMeetRightDayOfWeek ? 7 : 1))
            ) {
              if (date.getDay() === schedule[Field.DayOfWeekStandard])
                isMeetRightDayOfWeek = true;
              else continue;

              const dateTableData =
                calendarTableData[getTotalDaysBetweenDates(minDate, date)];

              let isAdded = false;

              for (const row of dateTableData) {
                let isConflicted = false;

                for (const item of row)
                  if (
                    item.startSession <= schedule[Field.EndSession] &&
                    item.endSession >= schedule[Field.StartSession]
                  ) {
                    isConflicted = true;
                    totalConflictedSessions +=
                      Math.min(item.endSession, schedule[Field.EndSession]) -
                      Math.max(
                        item.startSession,
                        schedule[Field.StartSession]
                      ) +
                      1;
                    break;
                  }

                if (isConflicted) continue;

                row.push({
                  startSession: schedule[Field.StartSession],
                  endSession: schedule[Field.EndSession],
                  subjectName,
                  classCode: selectedSubjectData.class,
                });
                isAdded = true;
                break;
              }

              if (!isAdded)
                dateTableData.push([
                  {
                    startSession: schedule[Field.StartSession],
                    endSession: schedule[Field.EndSession],
                    subjectName,
                    classCode: selectedSubjectData.class,
                  },
                ]);
            }
          }
        }

      return {
        data: calendarTableData,
        totalConflictedSessions,
      };
    })
  );

  private readonly calendarWorker = new Worker(
    new URL('./calendar.worker', import.meta.url)
  );

  constructor() {}

  async fetchData(): Promise<void> {
    const response: Response = await fetch(JSON_PATH);
    const jsonResponse: JSONResultData = await response.json();
    if (!jsonResponse) throw new Error('Không có dữ liệu');
    this.calendar$.next(jsonResponse);
  }

  async generateCombinationOfSubjects(auto: AutoMode): Promise<void> {
    if (auto !== this.oldAuto$.value) this.autoTh$.next(0);
    else this.autoTh$.next(this.autoTh$.value + 1);

    this.oldAuto$.next(auto);

    try {
      const response = await new Promise<CalendarWorkerRepsonse>(
        (resolve, reject) => {
          try {
            this.calendarWorker.onmessage = (data: CalendarWorkerRepsonse) =>
              resolve(data);
            this.calendarWorker.postMessage({
              calendar: this.calendar$.value,
              selectedSubjects: Object.entries(
                this.selectedClasses$.value
              ).flatMap(([majorKey, majorData]) =>
                Object.entries(majorData)
                  .filter((subject) => subject[1].show)
                  .map((subject) => [majorKey, subject[0]])
              ) as [string, string][],
              auto,
              autoTh: this.autoTh$.value,
            });
          } catch (e: unknown) {
            reject(e);
          }
        }
      );

      const selectedClasses = this.selectedClasses$.value;

      for (const [majorKey, subjectName, classCode] of response.data
        .selectedClasses) {
        if (!selectedClasses[majorKey]) selectedClasses[majorKey] = {};
        selectedClasses[majorKey][subjectName] = {
          show: true,
          class: classCode,
        };
      }

      this.selectedClasses$.next(selectedClasses);
    } catch (e: unknown) {
      alert('Có lỗi xảy ra khi xếp lịch');
      console.error(e);
    }
  }

  selectMajor(e: { major: string; select: boolean }): void {
    const allSubjectNamesOfMajor = Object.keys(
      this.calendar$.value.majors[e.major]
    );

    const selectedClasses = this.selectedClasses$.value;

    if (!selectedClasses[e.major]) selectedClasses[e.major] = {};

    for (const subjectName of allSubjectNamesOfMajor)
      if (!selectedClasses[e.major][subjectName])
        selectedClasses[e.major][subjectName] = {
          show: e.select,
          class: null,
        };
      else selectedClasses[e.major][subjectName].show = e.select;

    this.selectedClasses$.next(selectedClasses);
    this.autoTh$.next(-1);
  }

  changeClass(e: {
    majorKey: string;
    subjectName: string;
    classCode: string | null;
  }): void {
    const selectedClasses = this.selectedClasses$.value;
    if (!selectedClasses[e.majorKey]) selectedClasses[e.majorKey] = {};
    if (!selectedClasses[e.majorKey][e.subjectName])
      selectedClasses[e.majorKey][e.subjectName] = {
        show: false,
        class: e.classCode,
      };
    else selectedClasses[e.majorKey][e.subjectName].class = e.classCode;
    this.selectedClasses$.next(selectedClasses);
  }

  changeShow(e: {
    majorKey: string;
    subjectName: string;
    show: boolean;
  }): void {
    const selectedClass = this.selectedClasses$.value;
    if (!selectedClass[e.majorKey]) selectedClass[e.majorKey] = {};
    if (!selectedClass[e.majorKey][e.subjectName])
      selectedClass[e.majorKey][e.subjectName] = {
        show: e.show,
        class: null,
      };
    else selectedClass[e.majorKey][e.subjectName].show = e.show;
    this.selectedClasses$.next(selectedClass);
    this.autoTh$.next(-1);
  }
}
