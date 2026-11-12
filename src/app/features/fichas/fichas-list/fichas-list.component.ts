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
import { AuthService } from '../../../core/services/auth.service';
import { ManobristasService } from '../../../core/services/manobristas.service';
import { MESES, TODAS_UNIDADES } from '../../../core/services/periodo';
import { podeAcessar } from '../../../core/services/permissoes';
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
  private readonly manobristasService = inject(ManobristasService);
  private readonly auth = inject(AuthService);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly meses = MESES;
  protected readonly anos = this.fichasService.anosDisponiveis;
  protected readonly todas = TODAS_UNIDADES;
  protected readonly unidades = this.unidadesService.unidades;
  protected readonly podeEditar = computed(() => podeAcessar(this.auth.nivel(), 'fichas/:id/editar'));

  protected readonly busca = signal('');
  protected readonly mes = signal(this.fichasService.periodoReferencia().mes);
  protected readonly ano = signal(this.fichasService.periodoReferencia().ano);
  protected readonly unidadeId = signal(TODAS_UNIDADES);

  protected readonly fichas = computed(() =>
    this.fichasService.filtrar(
      { mes: this.mes(), ano: this.ano(), unidadeId: this.unidadeId(), busca: this.busca() },
      (id) => this.unidadesService.nome(id)
    )
  );

  protected nomeUnidade(id: number): string {
    return this.unidadesService.nome(id);
  }

  protected nomeManobrista(id: number): string {
    return this.manobristasService.nome(id);
  }

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
    this.mes.set(this.fichasService.periodoReferencia().mes);
    this.ano.set(this.fichasService.periodoReferencia().ano);
    this.unidadeId.set(TODAS_UNIDADES);
  }
}
