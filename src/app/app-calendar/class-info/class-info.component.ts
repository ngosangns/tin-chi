import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoMode } from '../../../types/calendar';
import { CalendarService } from '../calendar.service';

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
  JSON = JSON;

  @Output('selectMajor') readonly selectMajor$ = new EventEmitter<{
    major: string;
    select: boolean;
  }>();

  @Output('onChangeClass') readonly onChangeClass$ = new EventEmitter<{
    majorKey: string;
    subjectName: string;
    classCode: string | null;
  }>();

  @Output('onChangeShow') readonly onChangeShow$ = new EventEmitter<{
    majorKey: string;
    subjectName: string;
    show: boolean;
  }>();

  @Output('generateCombinationOfSubjects')
  readonly generateCombinationOfSubjects$ = new EventEmitter<AutoMode>();

  readonly defaultClassLabel = 'Chọn lớp';

  constructor(
    public readonly cs: CalendarService,
    private cdr: ChangeDetectorRef
  ) {}

  selectMajor(major: string, select: boolean): void {
    this.selectMajor$.emit({ major, select });
    this.cdr.detectChanges();
    this.cdr.reattach();
  }

  generateCombinationOfSubjects(auto: AutoMode): void {
    this.generateCombinationOfSubjects$.emit(auto);
  }

  onChangeShow(majorKey: string, subjectName: string): void {
    this.onChangeShow$.emit({
      majorKey,
      subjectName,
      show: !this.cs.selectedClasses$.value?.[majorKey]?.[subjectName]?.show,
    });
  }

  onChangeClass(
    majorKey: string,
    subjectName: string,
    classCode: string | null
  ): void {
    this.onChangeClass$.emit({
      majorKey,
      subjectName,
      classCode,
    });
  }

  isMajorSelecting(major: string): boolean {
    const selectedClasses = this.cs.selectedClasses$.value;
    if (!selectedClasses[major]) return false;
    const majorData = selectedClasses[major];
    return Object.values(majorData).some((subjectData) => subjectData.show);
  }
}
