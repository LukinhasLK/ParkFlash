import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DespesasService } from '../../core/services/despesas.service';
import { FichasService } from '../../core/services/fichas.service';
import { LayoutService } from '../../core/services/layout.service';
import { ANO_ATUAL, MES_ATUAL, MESES_CURTOS, rotuloPeriodo, TODAS_UNIDADES } from '../../core/services/periodo';
import { ChartComponent } from '../../shared/charts/chart.component';
import { AZUL, escalasPadrao, formatarMoeda, opcoesBase } from '../../shared/charts/chart-theme';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';
import { NumeroBrPipe } from '../../shared/pipes/numero-br.pipe';

@Component({
  selector: 'pf-dashboard',
  standalone: true,
  imports: [RouterLink, KpiCardComponent, ChartComponent, IconComponent, CurrencyBrPipe, NumeroBrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly fichasService = inject(FichasService);
  private readonly despesasService = inject(DespesasService);
  private readonly auth = inject(AuthService);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly primeiroNome = computed(() => this.auth.usuario()?.nome.split(' ')[0] ?? '');
  protected readonly periodo = rotuloPeriodo(MES_ATUAL, ANO_ATUAL).toUpperCase();
  protected readonly periodoLegivel = rotuloPeriodo(MES_ATUAL, ANO_ATUAL);

  private readonly filtro = { mes: MES_ATUAL, ano: ANO_ATUAL, unidade: TODAS_UNIDADES };

  private readonly fichasDoMes = computed(() => this.fichasService.filtrar(this.filtro));
  protected readonly resumo = computed(() => this.fichasService.resumir(this.fichasDoMes()));
  protected readonly melhorDia = computed(() => this.fichasService.melhorDiaDaSemana(this.fichasDoMes()));

  protected readonly totalDespesas = computed(() =>
    this.despesasService.total(this.despesasService.filtrar(this.filtro))
  );

  /** Últimos nove dias com movimento no mês. */
  private readonly serieDiaria = computed(() => this.fichasService.liquidoPorDia(this.fichasDoMes(), 9));

  protected readonly graficoLinha = computed<ChartConfiguration>(() => {
    const pontos = this.serieDiaria();

    return {
      type: 'line',
      data: {
        labels: pontos.map((p) => p.rotulo),
        datasets: [
          {
            label: 'Valor líquido',
            data: pontos.map((p) => p.valor),
            borderColor: AZUL.medio,
            backgroundColor: 'rgba(42, 120, 214, .10)',
            borderWidth: 2,
            fill: true,
            tension: .35,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: AZUL.medio,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        ...opcoesBase(),
        scales: escalasPadrao((v) => formatarMoeda(v).replace(/\s?,00$/, '')),
        plugins: {
          ...opcoesBase().plugins,
          tooltip: {
            ...opcoesBase().plugins!.tooltip,
            callbacks: {
              title: (itens) => `Dia ${itens[0].label}`,
              label: (item) => formatarMoeda(item.parsed.y ?? 0),
            },
          },
        },
      },
    };
  });

  protected readonly graficoBarras = computed<ChartConfiguration>(() => {
    const meses = this.fichasService
      .resumoMensal(ANO_ATUAL, TODAS_UNIDADES)
      .slice(MES_ATUAL - 6, MES_ATUAL);

    const maior = Math.max(...meses.map((m) => m.liquido));

    return {
      type: 'bar',
      data: {
        labels: meses.map((m) => MESES_CURTOS[m.mes - 1]),
        datasets: [
          {
            label: 'Líquido',
            data: meses.map((m) => m.liquido),
            // Mesma hue; o mês recorde ganha o passo mais escuro.
            backgroundColor: meses.map((m) => (m.liquido === maior ? AZUL.escuro : AZUL.medio)),
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        ...opcoesBase(),
        interaction: { mode: 'nearest', intersect: true },
        scales: escalasPadrao((v) => formatarMoeda(v).replace(/\s?,00$/, '')),
        plugins: {
          ...opcoesBase().plugins,
          tooltip: {
            ...opcoesBase().plugins!.tooltip,
            callbacks: { label: (item) => formatarMoeda(item.parsed.y ?? 0) },
          },
        },
      },
    };
  });

  protected readonly notificacoes = signal(2);
}
