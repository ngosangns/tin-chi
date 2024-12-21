import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AutoMode, CalendarGroupByMajorDetail } from '../../../types/calendar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-class-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-info.component.html',
  styleUrl: './class-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassInfoComponent {
  @Input('calendarGroupByMajor') calendarGroupByMajor: [
    string, // Tên khóa / ngành
    CalendarGroupByMajorDetail // Chi tiết lịch học của khóa / ngành
  ][] = [];
  @Input('autoTh') autoTh: number = -1;
  @Input('oldAuto') oldAuto: AutoMode = 'none';

  @Output('resetClass') readonly resetClass$ = new EventEmitter();
  @Output('selectAll') readonly selectAll$ = new EventEmitter();
  @Output('onChange') readonly onChange$ = new EventEmitter();
  @Output('onDisplayOnCalendarChange') readonly onDisplayOnCalendarChange$ =
    new EventEmitter();

  readonly defaultClassLabel = 'Chọn lớp';

  constructor() {}

  reset(major: string): void {
    this.resetClass$.emit(major);
    this.onChange$.emit({
      major,
      subject: '',
      field: 'displayOnCalendar',
      auto: 'none',
    });
  }

  selectAll(major: string): void {
    this.selectAll$.emit(major);
    this.onChange$.emit({
      major,
      subject: '',
      field: 'displayOnCalendar',
      auto: 'none',
    });
  }

  auto(auto: AutoMode): void {
    this.onChange$.emit({
      major: '',
      subject: '',
      field: '',
      auto: auto,
    });
  }

  onChange(
    major: string,
    subject: string,
    field: 'selectedClass' | 'displayOnCalendar'
  ): void {
    const majorData = this.calendarGroupByMajor.find(([m]) => m === major)?.[1];
    if (!majorData) return;

    const subjectData = majorData.subjects[subject];
    if (!subjectData) return;

    switch (field) {
      case 'selectedClass':
        if (!subjectData.displayOnCalendar) return;
        this.onChange$.emit({ major, subject, field, auto: 'none' });
        return;
      case 'displayOnCalendar':
        this.onDisplayOnCalendarChange$.emit({ major, subject });
        if (!subjectData.selectedClass.length) return;
        this.onChange$.emit({ major, subject, field, auto: 'none' });
        return;
    }
  }

  isMajorSelecting(
    calendarGroupByMajorDetail: CalendarGroupByMajorDetail
  ): boolean {
    return Object.keys(calendarGroupByMajorDetail.subjects).some((subject) => {
      const subjectData = calendarGroupByMajorDetail.subjects[subject];
      return subjectData.displayOnCalendar;
    });
  }
}
