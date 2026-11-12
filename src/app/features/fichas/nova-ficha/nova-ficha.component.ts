import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Turno } from '../../../core/models';
import {
  calcLiquidoCartao,
  calcSaldoFinal,
  calcTaxaDescontada,
  calcTotalBruto,
  calcTotalCarros,
  calcTotalDespesas,
  calcTotalDiarias,
  dividirEntreSocios,
} from '../../../core/services/calc';
import { FichasService } from '../../../core/services/fichas.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ManobristasService } from '../../../core/services/manobristas.service';
import { SociosService } from '../../../core/services/socios.service';
import { UnidadesService } from '../../../core/services/unidades.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';

/** A numeração final precisa cobrir a inicial mais as fichas canceladas. */
function sequenciaValida(grupo: AbstractControl): ValidationErrors | null {
  const inicio = Number(grupo.get('fichaInicio')?.value ?? 0);
  const fim = Number(grupo.get('fichaFim')?.value ?? 0);
  const canceladas = Number(grupo.get('fichasCanceladas')?.value ?? 0);

  return fim - inicio - canceladas < 0 ? { sequenciaInvalida: true } : null;
}

const ETAPAS = [
  { titulo: 'Identificação', subtitulo: 'Onde e quando o serviço aconteceu' },
  { titulo: 'Controle de Carros', subtitulo: 'Numeração das fichas do dia' },
  { titulo: 'Equipe', subtitulo: 'Manobristas e diárias' },
  { titulo: 'Pagamentos', subtitulo: 'Recebimentos e despesas do dia' },
  { titulo: 'Resumo Final', subtitulo: 'Confira antes de lançar' },
] as const;

@Component({
  selector: 'pf-nova-ficha',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, IconComponent, ModalComponent, CurrencyBrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nova-ficha.component.html',
  styleUrl: './nova-ficha.component.scss',
})
export class NovaFichaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly fichasService = inject(FichasService);
  private readonly manobristasService = inject(ManobristasService);
  private readonly sociosService = inject(SociosService);
  private readonly unidadesService = inject(UnidadesService);
  private readonly router = inject(Router);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly etapas = ETAPAS;
  protected readonly unidades = this.unidadesService.unidades;
  protected readonly manobristasDisponiveis = this.manobristasService.manobristas;

  protected readonly etapa = signal(0);
  protected readonly novoManobristaAberto = signal(false);
  protected readonly enviado = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      unidade: ['', Validators.required],
      data: [new Date().toISOString().slice(0, 10), Validators.required],
      turno: ['dia' as Turno, Validators.required],
      fichaInicio: [0, [Validators.required, Validators.min(0)]],
      fichaFim: [0, [Validators.required, Validators.min(0)]],
      fichasCanceladas: [0, [Validators.required, Validators.min(0)]],
      manobristas: this.fb.array<FormGroup>([]),
      valorDinheiro: [0, [Validators.required, Validators.min(0)]],
      valorCartao: [0, [Validators.required, Validators.min(0)]],
      taxaMaquininha: [2, [Validators.required, Validators.min(0), Validators.max(100)]],
      despesasAdicionais: this.fb.array<FormGroup>([]),
    },
    { validators: sequenciaValida }
  );

  /** Espelho reativo do formulário — alimenta todos os cálculos em tela. */
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly novoManobristaForm = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    telefone: [''],
    cpf: [''],
  });

  constructor() {
    this.adicionarManobrista();
    this.adicionarManobrista();
  }

  /* --------------------------------------------------------------------- */
  /* Arrays dinâmicos                                                       */
  /* --------------------------------------------------------------------- */

  get manobristas(): FormArray<FormGroup> {
    return this.form.controls.manobristas;
  }

  get despesas(): FormArray<FormGroup> {
    return this.form.controls.despesasAdicionais;
  }

  protected adicionarManobrista(): void {
    this.manobristas.push(
      this.fb.nonNullable.group({
        nome: ['', Validators.required],
        diaria: [80, [Validators.required, Validators.min(0)]],
      })
    );
  }

  protected removerManobrista(indice: number): void {
    this.manobristas.removeAt(indice);
  }

  protected adicionarDespesa(): void {
    this.despesas.push(
      this.fb.nonNullable.group({
        descricao: ['', Validators.required],
        valor: [0, [Validators.required, Validators.min(0)]],
      })
    );
  }

  protected removerDespesa(indice: number): void {
    this.despesas.removeAt(indice);
  }

  protected salvarNovoManobrista(): void {
    if (this.novoManobristaForm.invalid) {
      this.novoManobristaForm.markAllAsTouched();
      return;
    }

    const criado = this.manobristasService.salvarManobrista({
      ...this.novoManobristaForm.getRawValue(),
      diasNoMes: 0,
      totalRecebido: 0,
    });

    // Aproveita a primeira linha vazia da equipe, se houver.
    const vaga = this.manobristas.controls.find((grupo) => !grupo.get('nome')?.value);
    if (vaga) {
      vaga.get('nome')?.setValue(criado.nome);
    } else {
      this.adicionarManobrista();
      this.manobristas.at(this.manobristas.length - 1).get('nome')?.setValue(criado.nome);
    }

    this.novoManobristaForm.reset({ nome: '', telefone: '', cpf: '' });
    this.novoManobristaAberto.set(false);
  }

  /* --------------------------------------------------------------------- */
  /* Cálculos                                                               */
  /* --------------------------------------------------------------------- */

  protected readonly totalCarros = computed(() => {
    const v = this.valores();
    return calcTotalCarros(Number(v.fichaInicio), Number(v.fichaFim), Number(v.fichasCanceladas));
  });

  protected readonly taxaDescontada = computed(() =>
    calcTaxaDescontada(Number(this.valores().valorCartao), Number(this.valores().taxaMaquininha))
  );

  protected readonly liquidoCartao = computed(() =>
    calcLiquidoCartao(Number(this.valores().valorCartao), Number(this.valores().taxaMaquininha))
  );

  private readonly equipe = computed(() =>
    (this.valores().manobristas ?? [])
      .map((m) => ({ nome: String(m?.['nome'] ?? ''), diaria: Number(m?.['diaria'] ?? 0) }))
      .filter((m) => m.nome)
  );

  private readonly despesasInformadas = computed(() =>
    (this.valores().despesasAdicionais ?? [])
      .map((d) => ({ descricao: String(d?.['descricao'] ?? ''), valor: Number(d?.['valor'] ?? 0) }))
      .filter((d) => d.descricao)
  );

  protected readonly totalDiarias = computed(() => calcTotalDiarias(this.equipe()));
  protected readonly totalDespesas = computed(() => calcTotalDespesas(this.despesasInformadas()));

  protected readonly saldoFinal = computed(() =>
    calcSaldoFinal({
      valorDinheiro: Number(this.valores().valorDinheiro),
      valorCartao: Number(this.valores().valorCartao),
      taxaMaquininha: Number(this.valores().taxaMaquininha),
      manobristas: this.equipe(),
      despesasAdicionais: this.despesasInformadas(),
    })
  );

  protected readonly divisao = computed(() => {
    const unidade = this.valores().unidade ?? '';
    return unidade ? dividirEntreSocios(this.saldoFinal(), this.sociosService.socios(), unidade) : [];
  });

  /* --------------------------------------------------------------------- */
  /* Navegação do stepper                                                   */
  /* --------------------------------------------------------------------- */

  /** Controles que precisam estar válidos para sair de cada etapa. */
  private camposDaEtapa(indice: number): AbstractControl[] {
    const c = this.form.controls;
    switch (indice) {
      case 0: return [c.unidade, c.data, c.turno];
      case 1: return [c.fichaInicio, c.fichaFim, c.fichasCanceladas];
      case 2: return [c.manobristas];
      case 3: return [c.valorDinheiro, c.valorCartao, c.taxaMaquininha, c.despesasAdicionais];
      default: return [];
    }
  }

  protected etapaValida(indice: number): boolean {
    const camposOk = this.camposDaEtapa(indice).every((campo) => campo.valid);
    // A etapa de carros também depende do validador cruzado do formulário.
    return indice === 1 ? camposOk && !this.form.errors?.['sequenciaInvalida'] : camposOk;
  }

  protected avancar(): void {
    if (!this.etapaValida(this.etapa())) {
      this.camposDaEtapa(this.etapa()).forEach((campo) => campo.markAllAsTouched());
      return;
    }
    this.etapa.update((atual) => Math.min(atual + 1, ETAPAS.length - 1));
  }

  protected voltar(): void {
    this.etapa.update((atual) => Math.max(atual - 1, 0));
  }

  protected irPara(indice: number): void {
    if (indice <= this.etapa() || this.etapaValida(this.etapa())) this.etapa.set(indice);
  }

  /* --------------------------------------------------------------------- */
  /* Envio                                                                  */
  /* --------------------------------------------------------------------- */

  protected readonly podeLancar = computed(() =>
    [0, 1, 2, 3].every((etapa) => this.etapaValida(etapa))
  );

  protected lancar(): void {
    this.enviado.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // Leva o usuário de volta à primeira etapa com pendência.
      const pendente = [0, 1, 2, 3].find((etapa) => !this.etapaValida(etapa));
      if (pendente !== undefined) this.etapa.set(pendente);
      return;
    }

    const v = this.form.getRawValue();

    this.fichasService.adicionar({
      data: v.data,
      unidade: v.unidade,
      turno: v.turno,
      fichaInicio: Number(v.fichaInicio),
      fichaFim: Number(v.fichaFim),
      fichasCanceladas: Number(v.fichasCanceladas),
      totalCarros: this.totalCarros(),
      valorDinheiro: Number(v.valorDinheiro),
      valorCartao: Number(v.valorCartao),
      taxaMaquininha: Number(v.taxaMaquininha),
      manobristas: this.equipe(),
      despesasAdicionais: this.despesasInformadas(),
      totalBruto: calcTotalBruto(Number(v.valorDinheiro), Number(v.valorCartao)),
      totalLiquido: this.saldoFinal(),
    });

    this.router.navigate(['/app/fichas']);
  }

  protected invalido(nome: string): boolean {
    const campo = this.form.get(nome);
    return !!campo && campo.invalid && (campo.touched || this.enviado());
  }

  protected get sequenciaInvalida(): boolean {
    return !!this.form.errors?.['sequenciaInvalida'] && (this.form.controls.fichaFim.touched || this.enviado());
  }
}
