import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  END_AFTERNOON_SESSION,
  END_EVENING_SESSION,
  END_MORNING_SESSION,
  START_AFTERNOON_SESSION,
  START_EVENING_SESSION,
  START_MORNING_SESSION,
} from '../../../constants/calendar';
import {
  dateToNum,
  numToDate,
  getTotalDaysBetweenDates,
} from '../../../utils/date';
import { CalendarService } from '../calendar.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  START_MORNING_SESSION = START_MORNING_SESSION;
  END_MORNING_SESSION = END_MORNING_SESSION;
  START_AFTERNOON_SESSION = START_AFTERNOON_SESSION;
  END_AFTERNOON_SESSION = END_AFTERNOON_SESSION;
  START_EVENING_SESSION = START_EVENING_SESSION;
  END_EVENING_SESSION = END_EVENING_SESSION;

  dateToNum = dateToNum;
  getTotalDaysBetweenDates = getTotalDaysBetweenDates;

  readonly DAY_OF_WEEK_LABEL_MAP = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];

  dateList$: Observable<Date[]>;

  constructor(public readonly cs: CalendarService) {
    this.dateList$ = this.cs.calendar$.pipe(
      map((calendar) => {
        if (!calendar.minDate || !calendar.maxDate) return [];

        const minDate = numToDate(calendar.minDate);
        const maxDate = numToDate(calendar.maxDate);

        const result: Date[] = [];
        for (let i = minDate; i <= maxDate; i.setDate(i.getDate() + 1))
          result.push(new Date(i));

        return result;
      })
    );
  }

  dateNumberToDate(date: number): Date {
    return new Date(date);
  }

  checkSession(shift: number): 'morning' | 'afternoon' | 'evening' {
    if (shift < 7) return 'morning';
    if (shift < 13) return 'afternoon';
    return 'evening';
  }

  alertCell(content: string) {
    alert(content);
  }
}
