import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-more-info',
  imports: [],
  templateUrl: './more-info.component.html',
  styleUrl: './more-info.component.scss',
})
export class MoreInfoComponent {
  @Input('EXCEL_PATH') EXCEL_PATH = '';
}
