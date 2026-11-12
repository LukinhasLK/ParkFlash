import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Manobrista } from '../../core/models';
import { FichasService } from '../../core/services/fichas.service';
import { LayoutService } from '../../core/services/layout.service';
import { ManobristasService } from '../../core/services/manobristas.service';
import { AuthService } from '../../core/services/auth.service';
import { MESES, rotuloPeriodo } from '../../core/services/periodo';
import { podeAcessar } from '../../core/services/permissoes';
import { cpfValido, MascaraDirective, telefoneValido } from '../../shared/directives/mascara.directive';
import { corDoAvatar } from '../../shared/nav-items';
import { ConfirmComponent } from '../../shared/components/confirm/confirm.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';
import { AvisoService } from '../../core/services/aviso.service';

interface LinhaManobrista extends Manobrista {
  diasNoMes: number;
  totalRecebido: number;
  inicial: string;
  cor: string;
}

@Component({
  selector: 'pf-manobristas',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MascaraDirective, PageHeaderComponent, IconComponent, ModalComponent, ConfirmComponent, CurrencyBrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manobristas.component.html',
  styleUrl: './manobristas.component.scss',
})
export class ManobristasComponent {
  private readonly manobristasService = inject(ManobristasService);
  private readonly aviso = inject(AvisoService);
  private readonly fichasService = inject(FichasService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly meses = MESES;
  protected readonly anos = this.fichasService.anosDisponiveis;
  protected readonly mes = signal(this.fichasService.periodoReferencia().mes);
  protected readonly ano = signal(this.fichasService.periodoReferencia().ano);
  protected readonly periodo = computed(() => rotuloPeriodo(this.mes(), this.ano()));
  protected readonly podeExcluir = computed(() => podeAcessar(this.auth.nivel(), 'unidades'));
  protected readonly bloqueado = signal<Manobrista | null>(null);

  /** Dias e diárias vêm das fichas do período escolhido; o cadastro só guarda dados pessoais. */
  protected readonly linhas = computed<LinhaManobrista[]>(() => {
    const lancamentos = this.fichasService.diariasPorManobrista(this.mes(), this.ano());

    return this.manobristasService.manobristas().map((m) => {
      const doMes = lancamentos.get(m.id);
      return {
        ...m,
        diasNoMes: doMes?.dias ?? 0,
        totalRecebido: doMes?.total ?? 0,
        inicial: m.nome.charAt(0).toUpperCase(),
        cor: corDoAvatar(m.nome),
      };
    });
  });

  protected readonly formAberto = signal(false);
  protected readonly editando = signal<Manobrista | null>(null);
  protected readonly paraExcluir = signal<Manobrista | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    telefone: ['', telefoneValido],
    cpf: ['', cpfValido],
  });

  protected abrir(manobrista?: Manobrista): void {
    this.editando.set(manobrista ?? null);
    this.form.reset({
      nome: manobrista?.nome ?? '',
      telefone: manobrista?.telefone ?? '',
      cpf: manobrista?.cpf ?? '',
    });
    this.formAberto.set(true);
  }

  protected async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const atual = this.editando();

    try {
      await this.manobristasService.salvarManobrista({
        ...this.form.getRawValue(),
        id: atual?.id,
      });
      this.formAberto.set(false);
      this.aviso.sucesso('Manobrista salvo.');
    } catch (erro) {
      this.aviso.erro(erro);
    }
  }

  /** Quem já aparece em fichas não pode sair do cadastro (o histórico perderia o nome). */
  protected pedirExclusao(manobrista: Manobrista): void {
    if (this.fichasService.usaManobrista(manobrista.id)) {
      this.bloqueado.set(manobrista);
    } else {
      this.paraExcluir.set(manobrista);
    }
  }

  protected async confirmarExclusao(): Promise<void> {
    const manobrista = this.paraExcluir();
    this.paraExcluir.set(null);
    if (!manobrista) return;
    try {
      await this.manobristasService.excluir(manobrista.id);
      this.aviso.sucesso('Manobrista excluído.');
    } catch (erro) {
      this.aviso.erro(erro);
    }
  }

  protected invalido(nome: string): boolean {
    const campo = this.form.get(nome);
    return !!campo && campo.invalid && campo.touched;
  }
}
