import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CalendarGroupByMajorDetail } from '../../utils/calendar';

@Component({
  selector: 'app-class-info',
  imports: [CommonModule],
  templateUrl: './class-info.component.html',
  styleUrl: './class-info.component.scss',
})
export class ClassInfoComponent {
  @Input('data$') data$: BehaviorSubject<any>;
  @Input('calendarGroupByMajor') calendarGroupByMajor: [
    string,
    CalendarGroupByMajorDetail
  ][] = [];

  @Output('resetClass') readonly resetClass$ = new EventEmitter();
  @Output('onChangeSelectSubjectClass') readonly onChangeSelectSubjectClass$ =
    new EventEmitter();

  readonly defaultClassLabel = 'Chọn lớp';

  constructor() {
    this.data$ = new BehaviorSubject<any>({});
  }

  resetClass(): void {
    this.resetClass$.next(true);
  }

  onChangeSelectSubjectClass(
    majorName: string,
    subjectName: string,
    selectClassEvent: EventTarget | any = null
  ) {
    this.onChangeSelectSubjectClass$.next({
      majorName,
      subjectName,
      selectClassEvent,
    });
  }
}
