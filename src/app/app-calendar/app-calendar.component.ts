import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, map, Subscription } from 'rxjs';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import {
  CalendarData,
  CalendarGroupByMajor,
  CalendarGroupByMajorDetail,
  CalendarGroupBySession,
  CalendarGroupBySubjectName,
  CalendarTableContent,
  CalendarTableContentInDate,
  CalendarTableContentInSession,
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
  readonly calendar$: BehaviorSubject<CalendarData | undefined>;
  readonly calendarTableContent$: BehaviorSubject<CalendarTableContent>;

  title: string = '';
  showTab: 'class-info' | 'calendar' | 'more-info' = 'class-info';
  isConflict: boolean = false;
  errorMessage: string = '';

  calendarGroupByMajor: [string, CalendarGroupByMajorDetail][] = [];
  calendarGroupByMajorSub: Subscription;

  constructor(private cdr: ChangeDetectorRef) {
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

      // Lấy tiêu đề
      this.title = data?.title || '';

      // Xử lý dữ liệu lịch học
      const calendar = processCalendar(
        (data?.data as Array<RawCalendar>) || []
      );
      this.calendar$.next(calendar);

      // Khởi tạo không gian cho bảng lịch dựa vào data lịch
      const calendarTableContent: CalendarTableContent = {};
      for (const date of calendar.dateList) {
        calendarTableContent[date] = <CalendarTableContentInDate>{};
        for (const session of this.SESSIONS)
          calendarTableContent[date][session] =
            [] as CalendarTableContentInSession;
      }
      this.calendarTableContent$.next(calendarTableContent);

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

  async calculateCalendarTableContent(): Promise<void> {
    try {
      console.log(123);
      const result: any = await new Promise((resolve, reject) => {
        const worker = new Worker(
          new URL('./calendar.worker', import.meta.url)
        );
        worker.onmessage = (res: {
          data: {
            calendarTableContent: CalendarTableContent;
            isConflict: boolean;
          };
        }) => resolve(res.data);
        worker.onerror = (err: any) => reject(err);
        worker.postMessage({
          type: 'calculateCalendarTableContent',
          data: {
            calendarTableContent: this.calendarTableContent$.value,
            calendar: this.calendar$.value,
            sessions: this.SESSIONS,
          },
        });
      });

      if (result) {
        console.log(result);
        this.calendarTableContent$.next(result.calendarTableContent);
        this.isConflict = result.isConflict;
      }
      this.errorMessage = '';
    } catch (e) {
      this.errorMessage = 'Có lỗi xảy ra, không thể cập nhật dữ liệu!';
    }
  }

  triggerRecalculateTableContent(e: Event) {
    const data = e as unknown as {
      major: string;
      subject: string;
      field: 'selectedClass' | 'displayOnCalendar';
    };
    this.calculateCalendarTableContent();
  }

  resetClass(e: Event): void {
    const major = e as unknown as string;

    const calendar = this.calendar$.value;
    const majorCalendar =
      calendar?.calendarGroupByMajor?.[major] ?? <CalendarGroupByMajor>{};

    const subjects = majorCalendar.subjects as CalendarGroupBySubjectName;
    for (const subjectName in subjects) {
      subjects[subjectName].displayOnCalendar = false;
      subjects[subjectName].selectedClass = '';
    }

    // this.selectedCalendar$.next({});
    // this.calculateCalendarTableContent();
    // this.cdr.detectChanges();
  }

  switchTab(tab: 'class-info' | 'calendar' | 'more-info'): void {
    this.showTab = tab;
  }

  print() {
    window.print();
  }
}
