import { Component } from '@angular/core';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { AsyncPipe, CommonModule } from '@angular/common';
import {
  CalendarData,
  CalendarGroupByMajorDetail,
  CalendarGroupBySession,
  processCalendar,
  RawCalendar,
} from '../utils/calendar';
import { FormsModule } from '@angular/forms';
import { CalendarComponent } from './calendar/calendar.component';
import { ClassInfoComponent } from './class-info/class-info.component';

type SelectedCalendar = {
  [subjectName: string]: {
    isChecked: boolean;
    class: {
      code: string;
      details: CalendarGroupBySession;
    } | null;
  };
};

@Component({
  selector: 'app-app-calendar',
  imports: [
    CommonModule,
    FormsModule,
    AsyncPipe,
    HeaderComponent,
    FooterComponent,
    CalendarComponent,
    ClassInfoComponent,
  ],
  templateUrl: './app-calendar.component.html',
  styleUrl: './app-calendar.component.scss',
})
export class AppCalendarComponent {
  readonly sessions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  readonly defaultClassLabel = 'Chọn lớp';
  readonly jsonPath = `/tinchi.json?timestamp=${new Date().getTime()}`;
  readonly excelPath = `/tinchi.xlsx?timestamp=${new Date().getTime()}`;

  readonly loading$: BehaviorSubject<boolean>;
  readonly data$: BehaviorSubject<any>;
  readonly calendar$: BehaviorSubject<CalendarData | undefined>;
  readonly selectedCalendar: SelectedCalendar = {};
  readonly calendarTableContent$: BehaviorSubject<any>;
  readonly triggerRerenderClass = new BehaviorSubject<boolean>(false);
  readonly isOpenModel = new BehaviorSubject<boolean>(false);
  readonly modalMessage$ = new BehaviorSubject<string>('');
  readonly modalBtn = new BehaviorSubject<any>(null);

  get calendarGroupByMajor$() {
    return this.calendar$.pipe(
      map((calendar) => {
        const result = Object.entries(
          calendar?.calendarGroupByMajor || []
        ).sort((a, b) => a[0].localeCompare(b[0]));
        this.calendarGroupByMajor = result;
        return result;
      })
    );
  }

  calendarGroupByMajor: [string, CalendarGroupByMajorDetail][] = [];
  calendarGroupByMajorSub: Subscription;

  constructor() {
    this.data$ = new BehaviorSubject<any>({});
    this.loading$ = new BehaviorSubject<boolean>(true);
    this.calendar$ = new BehaviorSubject<CalendarData | undefined>(undefined);
    this.calendarTableContent$ = new BehaviorSubject<any>({});

    this.calendarGroupByMajorSub = this.calendar$.subscribe((calendar) => {
      this.calendarGroupByMajor = Object.entries(
        calendar?.calendarGroupByMajor || []
      ).sort((a, b) => a[0].localeCompare(b[0]));
    });
  }

  ngOnInit(): void {
    this.fetchData();
  }

  async fetchData(): Promise<void> {
    try {
      const response: any = await fetch(this.jsonPath);
      const data = await response.json();
      this.data$.next(data);
      const calendar = processCalendar(
        (data?.data as Array<RawCalendar>) || []
      );
      this.calendar$.next(calendar);

      const result: any = {};
      for (const date of calendar.dateList) {
        result[date] = {};
        const resultDate = result[date];
        for (const session of this.sessions) {
          resultDate[session] = [];
        }
      }
      this.calendarTableContent$.next(result);
    } catch (e: any) {
      console.error(e);
      this.modalMessage$.next(e.message);
    } finally {
      this.loading$.next(false);
    }
  }

  openModel(message: string): void {
    this.isOpenModel.next(true);
    this.modalMessage$.next(message);
    this.modalBtn.value.click();
  }

  closeModel(): void {
    this.isOpenModel.next(false);
  }

  checkSession(shift: number): 'morning' | 'afternoon' | 'evening' {
    if (shift >= 1 && shift <= 6) return 'morning';
    if (shift >= 7 && shift <= 12) return 'afternoon';
    return 'evening';
  }

  async onChangeSelectSubjectClass(
    majorName: string,
    subjectName: string,
    selectClassEvent: EventTarget | any = null
  ): Promise<void> {
    const _subjectName = majorName + '---' + subjectName;
    const classCode = '' + selectClassEvent?.value;

    // check subject
    if (!this.selectedCalendar[_subjectName]) {
      this.selectedCalendar[_subjectName] = { isChecked: false, class: null };
    }
    if (!selectClassEvent) {
      this.selectedCalendar[_subjectName].isChecked =
        !this.selectedCalendar[_subjectName].isChecked;
    } else {
      // check class
      if (classCode == this.defaultClassLabel) {
        this.selectedCalendar[_subjectName].class = null;
        if (!this.selectedCalendar[_subjectName].isChecked) {
          delete this.selectedCalendar[_subjectName];
        }
      }
      this.selectedCalendar[_subjectName].class = {
        code: classCode,
        details:
          this.calendar$.value!.calendarGroupBySubjectName[subjectName].classes[
            classCode
          ].details,
      };
    }

    // skip rerender
    if (!selectClassEvent && !this.selectedCalendar[_subjectName].class) return;
    if (selectClassEvent && !this.selectedCalendar[_subjectName].isChecked)
      return;

    await this.calculateCalendarTableContent();
  }

  async calculateCalendarTableContent(): Promise<void> {
    try {
      const result: any = await new Promise((resolve, reject) => {
        const worker = new Worker('/calendar.js');
        worker.onmessage = (res: { data: any }) => resolve(res.data);
        worker.onerror = (err: any) => reject(err);
        worker.postMessage({
          type: 'calculateCalendarTableContent',
          data: {
            calendarTableContent: this.calendarTableContent$.value,
            dateList: this.calendar$.value!.dateList,
            sessions: this.sessions,
            selectedCalendar: this.selectedCalendar,
          },
        });
      });

      if (result) {
        Object.keys(this.calendarTableContent$.value).forEach(
          (key) => delete this.calendarTableContent$.value[key]
        );
        Object.assign(
          this.calendarTableContent$.value,
          result.calendarTableContent
        );
        if (result.isConflict && !this.isOpenModel.value) {
          this.openModel('Cảnh báo trùng lịch!');
        }
      }
    } catch (e) {
      this.openModel('Có lỗi xảy ra, không thể cập nhật dữ liệu!');
    }
  }

  resetClass(): void {
    for (const key in this.selectedCalendar) delete this.selectedCalendar[key];
    this.calculateCalendarTableContent();
  }
}
