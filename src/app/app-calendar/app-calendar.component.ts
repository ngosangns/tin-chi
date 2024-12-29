import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
type SubjectSelectedClass = Record<string, SelectedClass>; // key: subject name
interface SelectedClass {
  show: boolean;
  class: string | null;
}

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
export class AppCalendarComponent implements OnInit {
  EXCEL_PATH = EXCEL_PATH;

  readonly loading$ = new BehaviorSubject<boolean>(true);

  showTab: 'class-info' | 'calendar' | 'more-info' = 'class-info';

  constructor(public readonly cs: CalendarService) {}

  async ngOnInit() {
    try {
      this.loading$.next(true);
      await this.cs.fetchData();
    } catch (e: unknown) {
      console.error(e);
      alert('Có lỗi xảy ra, không thể tải dữ liệu!');
    } finally {
      this.loading$.next(false);
    }
  }

  getSessionShift(session: number): 'morning' | 'afternoon' | 'evening' {
    if (session >= START_MORNING_SESSION && session <= END_MORNING_SESSION)
      return 'morning';
    if (session >= START_AFTERNOON_SESSION && session <= END_AFTERNOON_SESSION)
      return 'afternoon';
    return 'evening';
  }

  async generateCombinationOfSubjects(auto: AutoMode): Promise<void> {
    try {
      this.loading$.next(true); // Show loading spinner vì việc tính toán khi xếp lịch tự động mất nhiều thời gian
      await this.cs.generateCombinationOfSubjects(auto);
    } catch (e: unknown) {
      console.error(e);
      alert('Có lỗi xảy ra, không thể cập nhật dữ liệu!');
    } finally {
      this.loading$.next(false);
    }
  }

  switchTab(tab: 'class-info' | 'calendar' | 'more-info'): void {
    this.showTab = tab;
  }

  print() {
    window.print();
  }
}
