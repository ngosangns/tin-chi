import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { JSON_PATH } from '../../constants/calendar';
import { AutoMode, CalendarTableContent } from '../../types/calendar';
import { JSONResultData } from '../../types/excel';

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

  readonly calendarTableContent$ = new BehaviorSubject<CalendarTableContent>(
    {}
  );

  readonly isConflict$ = this.calendarTableContent$.pipe(
    map((ctc) => {
      for (const date of Object.keys(ctc)) {
        const dateData = ctc[parseInt(date)];
        for (const session of Object.keys(dateData))
          if (dateData[parseInt(session)].length > 1) return true;
      }
      return false;
    })
  );

  autoTh$ = new BehaviorSubject<number>(-1); // Thứ tự của kết quả cần lấy, dùng trong trường hợp tự động xếp lịch và muốn lấy kết quả khác với kết quả đầu tiên
  oldAuto$ = new BehaviorSubject<AutoMode>('none'); // Kiểu tự động xếp lịch

  private readonly calendarWorker = new Worker(
    new URL('../../workers/calendar.worker', import.meta.url)
  );

  constructor() {}

  async fetchData(): Promise<void> {
    const response: any = await fetch(JSON_PATH);
    const jsonResponse: JSONResultData = await response.json();
    if (!jsonResponse) throw new Error('Không có dữ liệu');
    this.calendar$.next(jsonResponse);
  }

  async calculateCalendarTableContent(auto: AutoMode = 'none'): Promise<void> {
    if (auto !== this.oldAuto$.value || auto === 'none') this.autoTh$.next(0);
    else this.autoTh$.next(this.autoTh$.value + 1);

    this.oldAuto$.next(auto);

    this.calendarWorker.postMessage({
      type: 'calculateCalendarTableContent',
      data: {
        calendar: this.calendar$.value,
        auto,
        autoTh: this.autoTh$.value,
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
                updatedCalendar: JSONResultData;
              } = res.data.data;

              this.calendarTableContent$.next(data.updatedCalendarTableContent);
              this.calendar$.next(data.updatedCalendar);

              resolve({});
              break;
            }
          }
        };
        this.calendarWorker.onerror = (err: any) => {
          throw err;
        };
      });

      this.calendarWorker.onmessage = null;
      this.calendarWorker.onmessageerror = null;
      this.calendarWorker.onerror = null;
    } catch (e: any) {
      this.calendarWorker.onmessage = null;
      this.calendarWorker.onmessageerror = null;
      this.calendarWorker.onerror = null;
      throw e;
    }
  }
}
