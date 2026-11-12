import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * Envelope fino sobre o Chart.js: recria o gráfico sempre que a configuração
 * muda e destrói o canvas ao sair de tela.
 */
@Component({
  selector: 'pf-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="holder" [style.height.px]="height()">
      <canvas #canvas [attr.aria-label]="ariaLabel()" role="img"></canvas>
    </div>
  `,
  styles: [':host { display: block; } .holder { position: relative; width: 100%; }'],
})
export class ChartComponent implements OnDestroy {
  readonly config = input.required<ChartConfiguration>();
  readonly height = input(260);
  readonly ariaLabel = input('Gráfico');

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject(ElementRef);
  private chart?: Chart;

  constructor() {
    effect(() => {
      const config = this.config();
      const elemento = this.canvas().nativeElement;

      this.chart?.destroy();
      this.chart = new Chart(elemento, config);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
