import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AvisoComponent } from './shared/components/aviso/aviso.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AvisoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet /><pf-aviso />',
})
export class AppComponent {}
