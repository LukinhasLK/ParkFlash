import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ficha } from '../../core/models';
import { despesasDaFicha } from '../../core/services/calc';
import { FichasService } from '../../core/services/fichas.service';
import { LayoutService } from '../../core/services/layout.service';
import { ANO_ATUAL, ANOS_DISPONIVEIS, MES_ATUAL, MESES, rotuloPeriodo, TODAS_UNIDADES } from '../../core/services/periodo';
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

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly meses = MESES;
  protected readonly anos = ANOS_DISPONIVEIS;
  protected readonly todas = TODAS_UNIDADES;
  protected readonly unidades = this.unidadesService.nomes;

  protected readonly mes = signal(MES_ATUAL);
  protected readonly ano = signal(ANO_ATUAL);
  protected readonly unidade = signal(TODAS_UNIDADES);

  protected readonly periodoLabel = computed(() => rotuloPeriodo(this.mes(), this.ano()));

  private readonly fichas = computed(() =>
    this.fichasService.filtrar({ mes: this.mes(), ano: this.ano(), unidade: this.unidade() })
  );

  protected readonly linhas = computed<LinhaRelatorio[]>(() =>
    this.fichas().map((ficha) => ({ ficha, despesas: despesasDaFicha(ficha) }))
  );

  protected readonly resumo = computed(() => this.fichasService.resumir(this.fichas()));

  /**
   * Abre a caixa de impressão do navegador — "Salvar como PDF" gera o arquivo
   * sem depender de nenhuma biblioteca extra.
   */
  protected exportarPdf(): void {
    window.print();
  }
}
