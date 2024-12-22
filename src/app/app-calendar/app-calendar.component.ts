import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { EXCEL_PATH, JSON_PATH, SESSIONS } from '../../constants/calendar';
import {
  AutoMode,
  CalendarData,
  CalendarGroupByMajor,
  CalendarGroupByMajorDetail,
  CalendarGroupBySubjectName,
  CalendarTableContent,
  CalendarTableContentInDate,
  CalendarTableContentInSession,
  ClassCombination,
  RawCalendar,
} from '../../types/calendar';
import { processCalendar } from '../../utils/calendar_processing';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { CalendarComponent } from './calendar/calendar.component';
import { ClassInfoComponent } from './class-info/class-info.component';
import { MoreInfoComponent } from './more-info/more-info.component';

@Component({
  selector: 'app-app-calendar',
  standalone: true,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCalendarComponent {
  SESSIONS = SESSIONS;
  EXCEL_PATH = EXCEL_PATH;

  readonly loading$: BehaviorSubject<boolean>;
  readonly calendar$: BehaviorSubject<CalendarData | undefined>;
  readonly calendarTableContent$: BehaviorSubject<CalendarTableContent>;

  title: string = '';
  showTab: 'class-info' | 'calendar' | 'more-info' = 'class-info';
  isConflict: boolean = false;
  autoTh: number = -1;
  oldAuto: AutoMode = 'none';
  oldTotalSelectedClass = 0;

  calendarGroupByMajor: [string, CalendarGroupByMajorDetail][] = [];
  calendarGroupByMajorSub: Subscription;

  private readonly calendarWorker: Worker;

  constructor() {
    this.loading$ = new BehaviorSubject<boolean>(true);
    this.calendar$ = new BehaviorSubject<CalendarData | undefined>(undefined);
    this.calendarTableContent$ = new BehaviorSubject<any>({});

    this.calendarGroupByMajorSub = this.calendar$.subscribe((calendar) => {
      this.calendarGroupByMajor = Object.entries(
        calendar?.calendarGroupByMajor || []
      ).sort((a, b) => a[0].localeCompare(b[0]));
    });

    this.calendarWorker = new Worker(
      new URL('../../workers/calendar.worker', import.meta.url)
    );
  }

  ngOnInit(): void {
    this.fetchData();
  }

  async fetchData(): Promise<void> {
    try {
      const response: any = await fetch(JSON_PATH);
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
        for (const session of SESSIONS)
          calendarTableContent[date][session] =
            [] as CalendarTableContentInSession;
      }
      this.calendarTableContent$.next(calendarTableContent);
    } catch (e: any) {
      console.error(e);
      alert('Có lỗi xảy ra, không thể tải dữ liệu!');
    } finally {
      this.loading$.next(false);
    }
  }

  checkSession(shift: number): 'morning' | 'afternoon' | 'evening' {
    if (shift >= 1 && shift <= 6) return 'morning';
    if (shift >= 7 && shift <= 12) return 'afternoon';
    return 'evening';
  }

  async calculateCalendarTableContent(auto: AutoMode = 'none'): Promise<void> {
    if (auto != 'none') this.loading$.next(true);

    if (auto !== this.oldAuto || auto === 'none') this.autoTh = 0;
    else this.autoTh++;

    this.oldAuto = auto;

    this.calendarWorker.postMessage({
      type: 'calculateCalendarTableContent',
      data: {
        calendarTableContent: this.calendarTableContent$.value,
        calendar: this.calendar$.value,
        sessions: SESSIONS,
        auto,
        autoTh: this.autoTh,
      },
    });

    try {
      await new Promise((resolve) => {
        this.calendarWorker.onmessage = async (res: {
          data: {
            type: string;
            data: any;
          };
        }) => {
          switch (res.data.type) {
            case 'calculateCalendarTableContent': {
              const data: {
                updatedCalendarTableContent: CalendarTableContent;
                updatedCalendarGroupByMajor: CalendarGroupByMajor;
                isConflict: boolean;
              } = res.data.data;

              if (data) {
                // Cập nhật dữ liệu lịch học sau khi xử lý
                this.calendarTableContent$.next(
                  data.updatedCalendarTableContent
                );
                const calendar = this.calendar$.value;
                if (calendar) {
                  calendar.calendarGroupByMajor =
                    data.updatedCalendarGroupByMajor;
                  this.calendar$.next(calendar);
                }
                this.isConflict = data.isConflict;
              } else throw new Error('No data received from worker!');

              resolve({});
              break;
            }
          }
        };
        this.calendarWorker.onerror = (err: any) => {
          throw err;
        };
      });
    } catch (e: any) {
      console.error(e);
      alert('Có lỗi xảy ra, không thể cập nhật dữ liệu!');
    } finally {
      this.calendarWorker.onmessage = null;
      this.calendarWorker.onmessageerror = null;
      this.calendarWorker.onerror = null;

      this.loading$.next(false);
    }
  }

  totalDisplayOnCalendarClass(): number {
    const calendar = this.calendar$.value;
    if (!calendar) return 0;

    let total = 0;
    for (const major in calendar.calendarGroupByMajor) {
      const majorCalendar = calendar.calendarGroupByMajor[major];
      for (const subjectName in majorCalendar.subjects) {
        const subject = majorCalendar.subjects[subjectName];
        if (subject.displayOnCalendar) total++;
      }
    }

    return total;
  }

  triggerRecalculateTableContent(e: Event) {
    const data = e as unknown as {
      major: string;
      subject: string;
      field: 'selectedClass' | 'displayOnCalendar';
      auto: AutoMode;
    };

    if (data.field === 'displayOnCalendar') this.autoTh = 0;

    this.calculateCalendarTableContent(data.auto);
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
  }

  selectAll(e: Event): void {
    const major = e as unknown as string;

    const calendar = this.calendar$.value;
    const majorCalendar =
      calendar?.calendarGroupByMajor?.[major] ?? <CalendarGroupByMajor>{};

    const subjects = majorCalendar.subjects as CalendarGroupBySubjectName;
    for (const subjectName in subjects)
      subjects[subjectName].displayOnCalendar = true;
  }

  switchTab(tab: 'class-info' | 'calendar' | 'more-info'): void {
    this.showTab = tab;
  }

  print() {
    window.print();
  }
}
