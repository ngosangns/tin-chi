import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import {
  END_AFTERNOON_SESSION,
  END_MORNING_SESSION,
  EXCEL_PATH,
  START_AFTERNOON_SESSION,
  START_MORNING_SESSION,
} from '../../constants/calendar';
import { AutoMode } from '../../types/calendar';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { CalendarService } from './calendar.service';
import { CalendarComponent } from './calendar/calendar.component';
import { ClassInfoComponent } from './class-info/class-info.component';
import { MoreInfoComponent } from './more-info/more-info.component';

export type MajorSelectedSubjects = Record<string, SubjectSelectedClass>; // key: major
export type SubjectSelectedClass = Record<string, SelectedClass>; // key: subject name
export type SelectedClass = {
  show: boolean;
  class: string;
};

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
    AsyncPipe,
  ],
  templateUrl: './app-calendar.component.html',
  styleUrl: './app-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCalendarComponent {
  EXCEL_PATH = EXCEL_PATH;

  readonly loading$ = new BehaviorSubject<boolean>(true);

  showTab: 'class-info' | 'calendar' | 'more-info' = 'class-info';

  readonly selectedClasses$ = new BehaviorSubject<MajorSelectedSubjects>({});

  constructor(public readonly cs: CalendarService) {}

  async ngOnInit() {
    try {
      this.loading$.next(true);
      await this.cs.fetchData();
    } catch (e: any) {
      console.error(e);
      alert('Có lỗi xảy ra, không thể tải dữ liệu!');
    } finally {
      this.loading$.next(false);
    }
  }

  checkSession(shift: number): 'morning' | 'afternoon' | 'evening' {
    if (shift >= START_MORNING_SESSION && shift <= END_MORNING_SESSION)
      return 'morning';
    if (shift >= START_AFTERNOON_SESSION && shift <= END_AFTERNOON_SESSION)
      return 'afternoon';
    return 'evening';
  }

  async calculateCalendarTableContent(auto: AutoMode = 'none'): Promise<void> {
    try {
      if (auto != 'none') this.loading$.next(true); // Show loading spinner vì việc tính toán khi xếp lịch tự động mất nhiều thời gian
      await this.cs.calculateCalendarTableContent(auto);
    } catch (e: any) {
      console.error(e);
      alert('Có lỗi xảy ra, không thể cập nhật dữ liệu!');
    } finally {
      this.loading$.next(false);
    }
  }

  triggerRecalculateTableContent(e: Event) {
    const data = e as unknown as {
      major: string;
      subject: string;
      field: 'selectedClass' | 'displayOnCalendar';
      auto: AutoMode;
    };

    if (data.field === 'displayOnCalendar') this.cs.autoTh$.next(0);

    this.calculateCalendarTableContent(data.auto);
  }

  resetClass(e: Event): void {
    const major = e as unknown as string;
    this.selectedClasses$.value[major] = {};
    this.selectedClasses$.next(this.selectedClasses$.value);
  }

  selectAll(e: Event): void {
    const major = e as unknown as string;
    const allSubjectNamesOfMajor = Object.keys(
      this.cs.calendar$.value.majors[major]
    );
    for (const subjectName of allSubjectNamesOfMajor) {
      if (!this.selectedClasses$.value[major][subjectName])
        this.selectedClasses$.value[major][subjectName] = {
          show: true,
          class: 'all',
        };
      else this.selectedClasses$.value[major][subjectName].show = true;
    }
  }

  switchTab(tab: 'class-info' | 'calendar' | 'more-info'): void {
    this.showTab = tab;
  }

  print() {
    window.print();
  }
}
