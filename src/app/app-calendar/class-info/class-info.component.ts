import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CalendarGroupByMajorDetail } from '../../utils/calendar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-class-info',
  imports: [CommonModule, FormsModule],
  templateUrl: './class-info.component.html',
  styleUrl: './class-info.component.scss',
})
export class ClassInfoComponent {
  @Input('calendarGroupByMajor') calendarGroupByMajor: [
    string, // Tên khóa / ngành
    CalendarGroupByMajorDetail // Chi tiết lịch học của khóa / ngành
  ][] = [];

  @Output('resetClass') readonly resetClass = new EventEmitter();
  @Output('onChange') readonly onChange$ = new EventEmitter();

  readonly defaultClassLabel = 'Chọn lớp';

  constructor() {}

  reset(major: string): void {
    this.resetClass.emit(major);
    this.onChange$.next({ major, subject: '', field: '' });
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
        this.onChange$.next({ major, subject, field });
        return;
      case 'displayOnCalendar':
        if (!subjectData.selectedClass.length) return;
        this.onChange$.next({ major, subject, field });
        return;
    }
  }
}
