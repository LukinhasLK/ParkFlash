import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIAS_DESPESA, CategoriaDespesa, Despesa } from '../../core/models';
import { CLASSE_CATEGORIA, DespesasService, TODAS_CATEGORIAS } from '../../core/services/despesas.service';
import { LayoutService } from '../../core/services/layout.service';
import { ANO_ATUAL, ANOS_DISPONIVEIS, MES_ATUAL, MESES, TODAS_UNIDADES } from '../../core/services/periodo';
import { UnidadesService } from '../../core/services/unidades.service';
import { ConfirmComponent } from '../../shared/components/confirm/confirm.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';
import { DataBrPipe } from '../../shared/pipes/data-br.pipe';

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
  private readonly unidadesService = inject(UnidadesService);
  private readonly fb = inject(FormBuilder);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly meses = MESES;
  protected readonly anos = ANOS_DISPONIVEIS;
  protected readonly categorias = CATEGORIAS_DESPESA;
  protected readonly todas = TODAS_UNIDADES;
  protected readonly todasCategorias = TODAS_CATEGORIAS;
  protected readonly unidades = this.unidadesService.nomes;

  protected readonly mes = signal(MES_ATUAL);
  protected readonly ano = signal(ANO_ATUAL);
  protected readonly unidade = signal(TODAS_UNIDADES);
  protected readonly categoria = signal<string>(TODAS_CATEGORIAS);

  protected readonly despesas = computed(() =>
    this.despesasService.filtrar({
      mes: this.mes(),
      ano: this.ano(),
      unidade: this.unidade(),
      categoria: this.categoria(),
    })
  );

  protected readonly total = computed(() => this.despesasService.total(this.despesas()));

  protected readonly formAberto = signal(false);
  protected readonly paraExcluir = signal<Despesa | null>(null);
  protected readonly detalhe = signal<Despesa | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    data: [new Date().toISOString().slice(0, 10), Validators.required],
    unidade: ['', Validators.required],
    categoria: ['Outros' as CategoriaDespesa, Validators.required],
    descricao: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]],
  });

  protected classe(categoria: CategoriaDespesa): string {
    return CLASSE_CATEGORIA[categoria];
  }

  protected abrirForm(): void {
    this.form.reset({
      data: new Date().toISOString().slice(0, 10),
      unidade: this.unidade() === TODAS_UNIDADES ? '' : this.unidade(),
      categoria: 'Outros',
      descricao: '',
      valor: 0,
    });
    this.formAberto.set(true);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.despesasService.adicionar(this.form.getRawValue());
    this.formAberto.set(false);
  }

  protected confirmarExclusao(): void {
    const despesa = this.paraExcluir();
    if (despesa) this.despesasService.excluir(despesa.id);
    this.paraExcluir.set(null);
  }

  protected invalido(nome: string): boolean {
    const campo = this.form.get(nome);
    return !!campo && campo.invalid && campo.touched;
  }
}
