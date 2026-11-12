import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DespesasService } from '../../core/services/despesas.service';
import { FichasService } from '../../core/services/fichas.service';
import { LayoutService } from '../../core/services/layout.service';
import { calcResultado } from '../../core/services/calc';
import { podeAcessar } from '../../core/services/permissoes';
import { MESES, MESES_CURTOS, rotuloPeriodo, TODAS_UNIDADES } from '../../core/services/periodo';
import { SociosService } from '../../core/services/socios.service';
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
  private readonly sociosService = inject(SociosService);
  private readonly auth = inject(AuthService);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly primeiroNome = computed(() => this.auth.usuario()?.nome.split(' ')[0] ?? '');

  private readonly filtro = computed(() => ({ ...this.fichasService.periodoReferencia(), unidadeId: TODAS_UNIDADES }));
  protected readonly periodoLegivel = computed(() => rotuloPeriodo(this.filtro().mes, this.filtro().ano));
  protected readonly periodo = computed(() => this.periodoLegivel().toUpperCase());

  private readonly fichasDoMes = computed(() => this.fichasService.filtrar(this.filtro()));
  protected readonly resumo = computed(() => this.fichasService.resumir(this.fichasDoMes()));
  protected readonly melhorDia = computed(() => this.fichasService.melhorDiaDaSemana(this.fichasDoMes()));

  protected readonly totalDespesas = computed(() =>
    this.despesasService.total(this.despesasService.filtrar(this.filtro()))
  );

  /** Lucro das fichas menos despesas fixas (aluguel, seguro, manutenção...). */
  protected readonly resultado = computed(() => calcResultado(this.resumo().liquido, this.totalDespesas()));

  protected readonly alertas = computed(() => {
    const alertas: { texto: string; rota: string }[] = [];
    const mes = MESES[this.filtro().mes - 1].toLowerCase();

    if (podeAcessar(this.auth.usuario()?.nivel, 'socios')) {
      for (const t of this.sociosService.totaisPorUnidade()) {
        if (!t.valido) {
          alertas.push({
            texto: t.vazia ? `${t.unidade} não tem sócios cadastrados` : `Rateio de ${t.unidade} soma ${t.total}% (precisa de 100%)`,
            rota: '/app/socios',
          });
        }
      }
    }

    const negativas = this.fichasDoMes().filter((f) => f.totalLiquido < 0).length;
    if (negativas > 0) {
      alertas.push({ texto: `${negativas} ficha(s) com líquido negativo em ${mes}`, rota: '/app/fichas' });
    }

    if (this.resultado() < 0) {
      alertas.push({ texto: `Resultado de ${mes} negativo após despesas fixas`, rota: '/app/despesas' });
    }

    return alertas;
  });

  protected readonly alertasAbertos = signal(false);

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
            cubicInterpolationMode: 'monotone',
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
    const { mes, ano } = this.filtro();
    const meses = [
      ...this.fichasService.resumoMensal(ano - 1, TODAS_UNIDADES),
      ...this.fichasService.resumoMensal(ano, TODAS_UNIDADES),
    ].slice(12 + mes - 6, 12 + mes);

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
}
