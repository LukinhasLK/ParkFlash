import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ficha } from '../../core/models';
import { calcResultado, despesasDaFicha } from '../../core/services/calc';
import { DespesasService } from '../../core/services/despesas.service';
import { FichasService } from '../../core/services/fichas.service';
import { LayoutService } from '../../core/services/layout.service';
import { MESES, rotuloPeriodo, TODAS_UNIDADES } from '../../core/services/periodo';
import { UnidadesService } from '../../core/services/unidades.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';
import { DataBrPipe } from '../../shared/pipes/data-br.pipe';

interface LinhaRelatorio {
  ficha: Ficha;
  despesas: number;
}

@Component({
  selector: 'pf-relatorios',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, KpiCardComponent, IconComponent, CurrencyBrPipe, DataBrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.scss',
})
export class RelatoriosComponent {
  private readonly fichasService = inject(FichasService);
  private readonly unidadesService = inject(UnidadesService);
  private readonly despesasService = inject(DespesasService);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly meses = MESES;
  protected readonly anos = this.fichasService.anosDisponiveis;
  protected readonly todas = TODAS_UNIDADES;
  protected readonly unidades = this.unidadesService.unidades;

  protected readonly mes = signal(this.fichasService.periodoReferencia().mes);
  protected readonly ano = signal(this.fichasService.periodoReferencia().ano);
  protected readonly unidadeId = signal(TODAS_UNIDADES);

  protected readonly periodoLabel = computed(() => rotuloPeriodo(this.mes(), this.ano()));
  protected readonly unidadeLabel = computed(() =>
    this.unidadeId() === TODAS_UNIDADES ? 'todas as unidades' : this.unidadesService.nome(this.unidadeId())
  );

  private readonly filtro = computed(() => ({ mes: this.mes(), ano: this.ano(), unidadeId: this.unidadeId() }));
  private readonly fichas = computed(() => this.fichasService.filtrar(this.filtro()));

  protected readonly linhas = computed<LinhaRelatorio[]>(() =>
    this.fichas().map((ficha) => ({ ficha, despesas: despesasDaFicha(ficha) }))
  );

  protected readonly resumo = computed(() => this.fichasService.resumir(this.fichas()));
  protected readonly despesasFixas = computed(() => this.despesasService.total(this.despesasService.filtrar(this.filtro())));
  protected readonly resultado = computed(() => calcResultado(this.resumo().liquido, this.despesasFixas()));

  protected nomeUnidade(id: number): string {
    return this.unidadesService.nome(id);
  }

  /**
   * Abre a caixa de impressão do navegador — "Salvar como PDF" gera o arquivo
   * sem depender de nenhuma biblioteca extra.
   */
  protected exportarPdf(): void {
    window.print();
  }
}
