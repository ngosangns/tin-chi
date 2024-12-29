import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-more-info',
  standalone: true,
  imports: [],
  templateUrl: './more-info.component.html',
  styleUrl: './more-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoreInfoComponent {
  @Input() EXCEL_PATH = '';
}
