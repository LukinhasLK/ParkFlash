import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Ficha } from '../../../core/models';
import {
  calcLiquidoCartao,
  calcTaxaDescontada,
  calcTotalDespesas,
  calcTotalDiarias,
} from '../../../core/services/calc';
import { FichasService } from '../../../core/services/fichas.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ANO_ATUAL, ANOS_DISPONIVEIS, MES_ATUAL, MESES, TODAS_UNIDADES } from '../../../core/services/periodo';
import { UnidadesService } from '../../../core/services/unidades.service';
import { ConfirmComponent } from '../../../shared/components/confirm/confirm.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { NumeroBrPipe } from '../../../shared/pipes/numero-br.pipe';

@Component({
  selector: 'pf-fichas-list',
  standalone: true,
  imports: [
    FormsModule, RouterLink, PageHeaderComponent, KpiCardComponent, IconComponent,
    ModalComponent, ConfirmComponent, CurrencyBrPipe, DataBrPipe, NumeroBrPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fichas-list.component.html',
  styleUrl: './fichas-list.component.scss',
})
export class FichasListComponent {
  private readonly fichasService = inject(FichasService);
  private readonly unidadesService = inject(UnidadesService);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly meses = MESES;
  protected readonly anos = ANOS_DISPONIVEIS;
  protected readonly todas = TODAS_UNIDADES;
  protected readonly unidades = this.unidadesService.nomes;

  protected readonly busca = signal('');
  protected readonly mes = signal(MES_ATUAL);
  protected readonly ano = signal(ANO_ATUAL);
  protected readonly unidade = signal(TODAS_UNIDADES);

  protected readonly fichas = computed(() =>
    this.fichasService.filtrar({
      mes: this.mes(),
      ano: this.ano(),
      unidade: this.unidade(),
      busca: this.busca(),
    })
  );

  protected readonly resumo = computed(() => this.fichasService.resumir(this.fichas()));

  protected readonly detalhe = signal<Ficha | null>(null);
  protected readonly paraExcluir = signal<Ficha | null>(null);

  /** Quebra do saldo usada no modal de detalhe. */
  protected readonly detalheCalculos = computed(() => {
    const ficha = this.detalhe();
    if (!ficha) return null;

    return {
      taxaDescontada: calcTaxaDescontada(ficha.valorCartao, ficha.taxaMaquininha),
      liquidoCartao: calcLiquidoCartao(ficha.valorCartao, ficha.taxaMaquininha),
      totalDiarias: calcTotalDiarias(ficha.manobristas),
      totalDespesas: calcTotalDespesas(ficha.despesasAdicionais),
    };
  });

  protected confirmarExclusao(): void {
    const ficha = this.paraExcluir();
    if (ficha) this.fichasService.excluir(ficha.id);
    this.paraExcluir.set(null);
  }

  protected limparFiltros(): void {
    this.busca.set('');
    this.mes.set(MES_ATUAL);
    this.ano.set(ANO_ATUAL);
    this.unidade.set(TODAS_UNIDADES);
  }
}
