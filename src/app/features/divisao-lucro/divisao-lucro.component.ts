import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { dividirEntreSocios, round2 } from '../../core/services/calc';
import { FichasService } from '../../core/services/fichas.service';
import { LayoutService } from '../../core/services/layout.service';
import { ANO_ATUAL, ANOS_DISPONIVEIS, MES_ATUAL, MESES, rotuloPeriodo } from '../../core/services/periodo';
import { SociosService } from '../../core/services/socios.service';
import { UnidadesService } from '../../core/services/unidades.service';
import { ChartComponent } from '../../shared/charts/chart.component';
import { formatarMoeda, SERIES, SUPERFICIE, TOOLTIP } from '../../shared/charts/chart-theme';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';

/** Cinza reservado para o agrupamento "Outros" (nunca um slot categórico). */
const NEUTRO = '#9ca3af';

interface FatiaSocio {
  nome: string;
  percentual: number;
  valor: number;
  cor: string;
}

@Component({
  selector: 'pf-divisao-lucro',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, KpiCardComponent, ChartComponent, CurrencyBrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './divisao-lucro.component.html',
  styleUrl: './divisao-lucro.component.scss',
})
export class DivisaoLucroComponent {
  private readonly fichasService = inject(FichasService);
  private readonly sociosService = inject(SociosService);
  private readonly unidadesService = inject(UnidadesService);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly meses = MESES;
  protected readonly anos = ANOS_DISPONIVEIS;
  protected readonly unidades = this.unidadesService.nomes;

  /** Filtros em edição — só viram consulta ao clicar em "Calcular". */
  protected readonly mesEdicao = signal(MES_ATUAL);
  protected readonly anoEdicao = signal(ANO_ATUAL);
  protected readonly unidadeEdicao = signal(this.unidadePadrao());

  private readonly consulta = signal({
    mes: MES_ATUAL,
    ano: ANO_ATUAL,
    unidade: this.unidadePadrao(),
  });

  protected readonly periodoLabel = computed(() => rotuloPeriodo(this.consulta().mes, this.consulta().ano));
  protected readonly unidadeLabel = computed(() => this.consulta().unidade);

  private readonly fichas = computed(() => this.fichasService.filtrar(this.consulta()));
  protected readonly resumo = computed(() => this.fichasService.resumir(this.fichas()));

  protected readonly partes = computed(() =>
    dividirEntreSocios(this.resumo().liquido, this.sociosService.socios(), this.consulta().unidade)
  );

  /**
   * Cores do donut. A paleta categórica validada cobre três séries em todos os
   * pares; a partir da quarta, o excedente vira uma fatia neutra "Outros" —
   * o detalhamento ao lado continua listando cada sócio nominalmente.
   */
  protected readonly fatias = computed<FatiaSocio[]>(() => {
    const partes = this.partes();

    if (partes.length <= SERIES.length) {
      return partes.map((parte, i) => ({ ...parte, cor: SERIES[i] }));
    }

    const principais = partes.slice(0, SERIES.length - 1).map((parte, i) => ({ ...parte, cor: SERIES[i] }));
    const restante = partes.slice(SERIES.length - 1);

    return [
      ...principais,
      {
        nome: `Outros (${restante.length})`,
        percentual: round2(restante.reduce((soma, p) => soma + p.percentual, 0)),
        valor: round2(restante.reduce((soma, p) => soma + p.valor, 0)),
        cor: NEUTRO,
      },
    ];
  });

  protected readonly totalDistribuido = computed(() =>
    round2(this.partes().reduce((soma, parte) => soma + parte.valor, 0))
  );

  /** O donut representa proporção — com saldo negativo ele não faz sentido. */
  protected readonly saldoNegativo = computed(() => this.resumo().liquido < 0);

  protected readonly grafico = computed<ChartConfiguration>(() => {
    const fatias = this.fatias();

    return {
      type: 'doughnut',
      data: {
        labels: fatias.map((f) => f.nome),
        datasets: [
          {
            data: fatias.map((f) => f.percentual),
            backgroundColor: fatias.map((f) => f.cor),
            // Anel de 2px na cor da superfície separando as fatias.
            borderColor: SUPERFICIE,
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { display: false },
          tooltip: {
            ...TOOLTIP,
            callbacks: {
              label: (item) => {
                const fatia = fatias[item.dataIndex];
                return `${fatia.percentual.toFixed(1)}% · ${formatarMoeda(fatia.valor)}`;
              },
            },
          },
        },
      },
    };
  });

  /**
   * Cor da barra de cada sócio no detalhamento. A lista nomeia todos os
   * sócios, inclusive os que o donut agrupa em "Outros" — esses recebem o
   * neutro, nunca um slot categórico.
   */
  protected corDoSocio(indice: number): string {
    return indice < SERIES.length && this.partes().length <= SERIES.length
      ? SERIES[indice]
      : indice < SERIES.length - 1
        ? SERIES[indice]
        : NEUTRO;
  }

  protected calcular(): void {
    this.consulta.set({
      mes: this.mesEdicao(),
      ano: this.anoEdicao(),
      unidade: this.unidadeEdicao(),
    });
  }

  /** Largura da barra do detalhamento, proporcional ao maior percentual. */
  protected largura(percentual: number): number {
    const maior = Math.max(...this.partes().map((p) => p.percentual), 1);
    return Math.round((percentual / maior) * 100);
  }

  private unidadePadrao(): string {
    return this.sociosService.unidadesConfiguradas()[0]?.unidade ?? this.unidadesService.nomes()[0] ?? '';
  }
}
