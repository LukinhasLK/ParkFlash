import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIAS_DESPESA, CategoriaDespesa, Despesa } from '../../core/models';
import { CLASSE_CATEGORIA, DespesasService, TODAS_CATEGORIAS } from '../../core/services/despesas.service';
import { LayoutService } from '../../core/services/layout.service';
import { FichasService } from '../../core/services/fichas.service';
import { hojeIso, MESES, TODAS_UNIDADES } from '../../core/services/periodo';
import { UnidadesService } from '../../core/services/unidades.service';
import { ConfirmComponent } from '../../shared/components/confirm/confirm.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';
import { DataBrPipe } from '../../shared/pipes/data-br.pipe';
import { AvisoService } from '../../core/services/aviso.service';

@Component({
  selector: 'pf-despesas',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, PageHeaderComponent, IconComponent,
    ModalComponent, ConfirmComponent, CurrencyBrPipe, DataBrPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss',
})
export class DespesasComponent {
  private readonly despesasService = inject(DespesasService);
  private readonly aviso = inject(AvisoService);
  private readonly unidadesService = inject(UnidadesService);
  private readonly fichasService = inject(FichasService);
  private readonly fb = inject(FormBuilder);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly meses = MESES;
  protected readonly anos = this.fichasService.anosDisponiveis;
  protected readonly categorias = CATEGORIAS_DESPESA;
  protected readonly todas = TODAS_UNIDADES;
  protected readonly todasCategorias = TODAS_CATEGORIAS;
  protected readonly unidades = this.unidadesService.unidades;

  protected readonly mes = signal(this.fichasService.periodoReferencia().mes);
  protected readonly ano = signal(this.fichasService.periodoReferencia().ano);
  protected readonly unidadeId = signal(TODAS_UNIDADES);
  protected readonly categoria = signal<string>(TODAS_CATEGORIAS);

  protected readonly despesas = computed(() =>
    this.despesasService.filtrar({
      mes: this.mes(),
      ano: this.ano(),
      unidadeId: this.unidadeId(),
      categoria: this.categoria(),
    })
  );

  protected readonly total = computed(() => this.despesasService.total(this.despesas()));

  protected readonly formAberto = signal(false);
  protected readonly emEdicao = signal<Despesa | null>(null);
  protected readonly paraExcluir = signal<Despesa | null>(null);
  protected readonly detalhe = signal<Despesa | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    data: [hojeIso(), Validators.required],
    unidadeId: [null as number | null, Validators.required],
    categoria: ['Outros' as CategoriaDespesa, Validators.required],
    descricao: ['', Validators.required],
    valor: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  protected classe(categoria: CategoriaDespesa): string {
    return CLASSE_CATEGORIA[categoria];
  }

  protected nomeUnidade(id: number): string {
    return this.unidadesService.nome(id);
  }

  protected abrirForm(despesa?: Despesa): void {
    this.emEdicao.set(despesa ?? null);
    this.form.reset(
      despesa
        ? { data: despesa.data, unidadeId: despesa.unidadeId, categoria: despesa.categoria, descricao: despesa.descricao, valor: despesa.valor }
        : {
            data: hojeIso(),
            unidadeId: this.unidadeId() === TODAS_UNIDADES ? null : this.unidadeId(),
            categoria: 'Outros',
            descricao: '',
            valor: null,
          }
    );
    this.detalhe.set(null);
    this.formAberto.set(true);
  }

  protected async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const dados = { ...v, unidadeId: v.unidadeId!, valor: Number(v.valor) };
    const editada = this.emEdicao();
    try {
      if (editada) {
        await this.despesasService.atualizar({ ...dados, id: editada.id });
      } else {
        await this.despesasService.adicionar(dados);
      }
      this.formAberto.set(false);
      this.aviso.sucesso('Despesa salva.');
    } catch (erro) {
      this.aviso.erro(erro);
    }
  }

  protected async confirmarExclusao(): Promise<void> {
    const despesa = this.paraExcluir();
    this.paraExcluir.set(null);
    if (!despesa) return;
    try {
      await this.despesasService.excluir(despesa.id);
      this.aviso.sucesso('Despesa excluída.');
    } catch (erro) {
      this.aviso.erro(erro);
    }
  }

  protected invalido(nome: string): boolean {
    const campo = this.form.get(nome);
    return !!campo && campo.invalid && campo.touched;
  }
}
