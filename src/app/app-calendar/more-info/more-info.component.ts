import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-more-info',
  imports: [AsyncPipe],
  templateUrl: './more-info.component.html',
  styleUrl: './more-info.component.scss',
})
export class MoreInfoComponent {
  @Input('data$') data$: BehaviorSubject<any> = new BehaviorSubject({});
  @Input('EXCEL_PATH') EXCEL_PATH = '';
}
