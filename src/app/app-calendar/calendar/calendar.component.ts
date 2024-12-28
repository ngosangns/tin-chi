import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CalendarData, CalendarTableContent } from '../../../types/calendar';
import {
  END_AFTERNOON_SESSION,
  END_EVENING_SESSION,
  END_MORNING_SESSION,
  START_AFTERNOON_SESSION,
  START_EVENING_SESSION,
  START_MORNING_SESSION,
} from '../../../constants/calendar';

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

  @Input('calendar$') calendar$: BehaviorSubject<CalendarData | undefined>;
  @Input('calendarTableContent$')
  calendarTableContent$: BehaviorSubject<CalendarTableContent>;
  @Input('SESSIONS') SESSIONS: number[] = [];

  readonly DAY_OF_WEEK_MAP = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];

  constructor() {
    this.calendar$ = new BehaviorSubject<CalendarData | undefined>(undefined);
    this.calendarTableContent$ = new BehaviorSubject<any>({});
  }

  getDayFromDate(date: number): number {
    return new Date(date).getDay();
  }

  dateNumberToDate(date: number): Date {
    return new Date(date);
  }

  checkSession(shift: number): 'morning' | 'afternoon' | 'evening' {
    if (shift < 7) return 'morning';
    if (shift < 13) return 'afternoon';
    return 'evening';
  }

  processCalendarInDate(
    date: number
  ): { start: number; end: number; defaultName: string }[][] {
    const groupByName: Record<string, { start: number; end: number }[]> = {}; // Nhóm lịch theo tên môn học

    const calendarInDate = this.calendarTableContent$.value[date]; // Lịch trong ngày
    if (!calendarInDate) return [];

    // Lặp qua từng tiết trong ngày
    for (const session in calendarInDate) {
      const sessionAsNumber = parseInt(session); // Vì for ... in trả về string nên phải ép kiểu
      const sessionData = calendarInDate[sessionAsNumber]; // Dữ liệu môn học trong tiết

      // Lặp qua từng môn trong tiết
      for (const data of sessionData) {
        if (!groupByName[data.defaultName]) groupByName[data.defaultName] = []; // Khởi tạo mảng nếu chưa có
        const previousSubjectData = groupByName[data.defaultName].find(
          (v) => v.end === sessionAsNumber - 1
        ); // Lấy dữ liệu của môn học ở tiết trước đó

        if (!previousSubjectData)
          // Nếu không có dữ liệu môn học ở tiết trước đó thì tạo mới
          groupByName[data.defaultName].push({
            start: sessionAsNumber,
            end: sessionAsNumber,
          });
        else previousSubjectData.end = sessionAsNumber; // Nếu có thì cập nhật tiết kết thúc
      }
    }

    // Mảng kết quả cuối cùng, mảng này chứa nhiều hàng
    // Mỗi hàng chứa một mảng các lịch học không trùng
    const result: { start: number; end: number; defaultName: string }[][] = [
      [],
    ];

    // Lặp qua từng môn trong lịch gộp theo tên môn
    for (const defaultName in groupByName) {
      // Lặp qua từng lịch học của môn đó
      for (const subjectData of groupByName[defaultName]) {
        const toInsertSubjectData = {
          start: subjectData.start,
          end: subjectData.end,
          defaultName,
        };
        let isInserted = false; // Biến kiểm tra xem môn học đã được thêm vào mảng kết quả chưa
        // Lặp qua từng hàng trong kết quả
        for (const row of result) {
          const conflictData = row.find(
            (c) => c.end >= subjectData.start && c.start <= subjectData.end
          );
          if (!conflictData) {
            row.push(toInsertSubjectData);
            isInserted = true;
            break;
          }
        }
        // Nếu hàng lz nào cũng trùng lịch thì tạo hàng mới
        if (!isInserted) result.push([toInsertSubjectData]);
      }
    }

    return result;
  }
}
