import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pf-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" [class.logo--dark]="onDark()" [style.font-size.px]="size()">
      <span class="logo__mark" aria-hidden="true">⚡</span>
      <span class="logo__text"><span class="logo__park">PARK</span><span class="logo__flash">FLASH</span></span>
    </span>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      gap: .4em;
      font-weight: 800;
      letter-spacing: -.01em;
      line-height: 1;
      white-space: nowrap;
    }
    .logo__mark { font-size: .95em; }
    .logo__park { color: var(--pf-primary); }
    .logo--dark .logo__park { color: #fff; }
    .logo__flash { color: var(--pf-accent); }
  `],
})
export class LogoComponent {
  /** Usa o branco no "PARK" quando o logo está sobre fundo escuro. */
  readonly onDark = input(false);
  readonly size = input(20);
}
