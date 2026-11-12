import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Manobrista } from '../../core/models';
import { FichasService } from '../../core/services/fichas.service';
import { LayoutService } from '../../core/services/layout.service';
import { ManobristasService } from '../../core/services/manobristas.service';
import { ANO_ATUAL, MES_ATUAL, rotuloPeriodo } from '../../core/services/periodo';
import { corDoAvatar } from '../../shared/nav-items';
import { ConfirmComponent } from '../../shared/components/confirm/confirm.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';

interface LinhaManobrista extends Manobrista {
  inicial: string;
  cor: string;
}

@Component({
  selector: 'pf-manobristas',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, IconComponent, ModalComponent, ConfirmComponent, CurrencyBrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manobristas.component.html',
  styleUrl: './manobristas.component.scss',
})
export class ManobristasComponent {
  private readonly manobristasService = inject(ManobristasService);
  private readonly fichasService = inject(FichasService);
  private readonly fb = inject(FormBuilder);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly periodo = rotuloPeriodo(MES_ATUAL, ANO_ATUAL);

  /**
   * Dias e valores vêm das fichas do mês; o cadastro só guarda os dados
   * pessoais. Quem ainda não apareceu em nenhuma ficha cai no valor do cadastro.
   */
  protected readonly linhas = computed<LinhaManobrista[]>(() => {
    const lancamentos = this.fichasService.diariasPorManobrista(MES_ATUAL, ANO_ATUAL);

    return this.manobristasService.manobristas().map((m) => {
      const doMes = lancamentos.get(m.nome);
      return {
        ...m,
        diasNoMes: doMes?.dias ?? m.diasNoMes,
        totalRecebido: doMes?.total ?? m.totalRecebido,
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
    telefone: [''],
    cpf: [''],
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

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const atual = this.editando();

    this.manobristasService.salvarManobrista({
      ...this.form.getRawValue(),
      id: atual?.id,
      diasNoMes: atual?.diasNoMes ?? 0,
      totalRecebido: atual?.totalRecebido ?? 0,
    });

    this.formAberto.set(false);
  }

  protected confirmarExclusao(): void {
    const manobrista = this.paraExcluir();
    if (manobrista) this.manobristasService.excluir(manobrista.id);
    this.paraExcluir.set(null);
  }

  protected invalido(nome: string): boolean {
    const campo = this.form.get(nome);
    return !!campo && campo.invalid && campo.touched;
  }
}
