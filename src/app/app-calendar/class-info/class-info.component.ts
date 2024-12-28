import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AutoMode } from '../../../types/calendar';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../calendar.service';
import { BehaviorSubject } from 'rxjs';
import { MajorSelectedSubjects } from '../app-calendar.component';

@Component({
  selector: 'app-class-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './class-info.component.html',
  styleUrl: './class-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassInfoComponent {
  Object = Object;

  @Input('selectedClasses$') selectedClasses$ =
    new BehaviorSubject<MajorSelectedSubjects>({});

  @Output('resetMajor') readonly resetMajor$ = new EventEmitter<string>();
  @Output('selectMajor') readonly selectMajor$ = new EventEmitter<string>();
  @Output('onChangeClass') readonly onChangeClass$ = new EventEmitter<{
    major: string;
    subject: string;
  }>();
  @Output('onChangeShow') readonly onChangeShow$ = new EventEmitter<{
    major: string;
    subject: string;
  }>();
  @Output('onTriggerAuto') readonly onTriggerAuto$ =
    new EventEmitter<AutoMode>();

  readonly defaultClassLabel = 'Chọn lớp';

  constructor(public readonly cs: CalendarService) {}

  resetMajor(major: string): void {
    this.resetMajor$.emit(major);
  }

  selectMajor(major: string): void {
    this.selectMajor$.emit(major);
  }

  onTriggerAuto(auto: AutoMode): void {
    this.onTriggerAuto$.emit(auto);
  }

  onChangeShow(major: string, subject: string): void {
    this.onChangeShow$.emit({
      major,
      subject,
    });
  }

  onChangeClass(major: string, subject: string): void {
    this.onChangeClass$.emit({
      major,
      subject,
    });
  }
}
