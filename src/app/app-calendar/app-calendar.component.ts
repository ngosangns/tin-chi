import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, map, Subscription } from 'rxjs';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import {
  CalendarData,
  CalendarGroupByMajorDetail,
  CalendarGroupBySession,
  CalendarTableContent,
  processCalendar,
  RawCalendar,
} from '../utils/calendar';
import { CalendarComponent } from './calendar/calendar.component';
import { ClassInfoComponent } from './class-info/class-info.component';
import { MoreInfoComponent } from './more-info/more-info.component';

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
    MoreInfoComponent,
  ],
  templateUrl: './app-calendar.component.html',
  styleUrl: './app-calendar.component.scss',
})
export class AppCalendarComponent {
  readonly SESSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  readonly DEFAULT_CLASS_LABEL = 'Chọn lớp';
  readonly JSON_PATH = `/tinchi.json?timestamp=${new Date().getTime()}`;
  readonly EXCEL_PATH = `/tinchi.xlsx?timestamp=${new Date().getTime()}`;

  readonly loading$: BehaviorSubject<boolean>;
  readonly data$: BehaviorSubject<any>;
  readonly calendar$: BehaviorSubject<CalendarData | undefined>;
  readonly selectedCalendar$: BehaviorSubject<SelectedCalendar> =
    new BehaviorSubject({});
  readonly calendarTableContent$: BehaviorSubject<CalendarTableContent>;
  showTab: 'class-info' | 'calendar' | 'more-info' = 'class-info';
  isConflict: boolean = false;
  errorMessage: string = '';

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

  constructor(private cdr: ChangeDetectorRef) {
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
      const response: any = await fetch(this.JSON_PATH);
      const data = await response.json();
      this.data$.next(data);
      const calendar = processCalendar(
        (data?.data as Array<RawCalendar>) || []
      );
      this.calendar$.next(calendar);

      // init calendarTableContent
      const result: CalendarTableContent = {};
      for (const date of calendar.dateList) {
        result[date] = {};
        for (const session of this.SESSIONS) result[date][session] = [];
      }
      this.calendarTableContent$.next(result);
      this.errorMessage = '';
    } catch (e: any) {
      console.error(e);
      this.errorMessage = e.message;
    } finally {
      this.loading$.next(false);
    }
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
    const marjorSubject = majorName + '---' + subjectName;
    const classCode = '' + selectClassEvent?.value;
    const selectedCalendar = this.selectedCalendar$.value;

    // check subject
    if (!selectedCalendar[marjorSubject])
      selectedCalendar[marjorSubject] = { isChecked: false, class: null };

    if (!selectClassEvent)
      selectedCalendar[marjorSubject].isChecked =
        !selectedCalendar[marjorSubject].isChecked;
    else {
      // check class
      if (classCode == this.DEFAULT_CLASS_LABEL) {
        selectedCalendar[marjorSubject].class = null;
        if (!selectedCalendar[marjorSubject].isChecked)
          delete selectedCalendar[marjorSubject];
      }
      selectedCalendar[marjorSubject].class = {
        code: classCode,
        details:
          this.calendar$.value!.calendarGroupBySubjectName[subjectName].classes[
            classCode
          ].details,
      };
    }

    this.selectedCalendar$.next(selectedCalendar);

    // skip recalculate
    if (!selectClassEvent && !selectedCalendar[marjorSubject].class) return;
    if (selectClassEvent && !selectedCalendar[marjorSubject].isChecked) return;

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
            sessions: this.SESSIONS,
            selectedCalendar: this.selectedCalendar$.value,
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

        this.isConflict = result.isConflict;
      }
      this.errorMessage = '';
    } catch (e) {
      this.errorMessage = 'Có lỗi xảy ra, không thể cập nhật dữ liệu!';
    }
  }

  resetClass(): void {
    this.selectedCalendar$.next({});
    this.calculateCalendarTableContent();
    this.cdr.detectChanges();
  }

  switchTab(tab: 'class-info' | 'calendar' | 'more-info'): void {
    this.showTab = tab;
  }

  print() {
    window.print();
  }
}
