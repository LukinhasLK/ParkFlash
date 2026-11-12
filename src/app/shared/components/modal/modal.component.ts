import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'pf-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="fechar.emit()">
      <div
        class="sheet"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        (click)="$event.stopPropagation()"
      >
        <header class="sheet__head">
          <h2 class="sheet__title">{{ title() }}</h2>
          <button type="button" class="sheet__close" aria-label="Fechar" (click)="fechar.emit()">×</button>
        </header>
        <div class="sheet__body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  host: { '(document:keydown.escape)': 'fechar.emit()' },
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, .55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 100;
      animation: fade .15s ease;
    }
    .sheet {
      background: var(--pf-surface);
      border-radius: var(--pf-radius-lg);
      box-shadow: var(--pf-shadow-lg);
      width: 100%;
      max-width: 480px;
      max-height: calc(100vh - 40px);
      display: flex;
      flex-direction: column;
      animation: rise .2s ease;
    }
    .sheet__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 22px 14px;
      border-bottom: 1px solid var(--pf-border);
    }
    .sheet__title { font-size: 17px; font-weight: 700; }
    .sheet__close {
      background: none;
      border: none;
      font-size: 26px;
      line-height: 1;
      color: var(--pf-text-muted);
      cursor: pointer;
      padding: 0 4px;
      &:hover { color: var(--pf-text); }
    }
    .sheet__body { padding: 20px 22px 22px; overflow-y: auto; }

    @keyframes fade { from { opacity: 0 } }
    @keyframes rise { from { opacity: 0; transform: translateY(12px) } }

    @media (max-width: 767px) {
      .backdrop { align-items: flex-end; padding: 0; }
      .sheet {
        max-width: none;
        border-radius: var(--pf-radius-lg) var(--pf-radius-lg) 0 0;
        max-height: 92vh;
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
  `],
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly fechar = output<void>();
}
