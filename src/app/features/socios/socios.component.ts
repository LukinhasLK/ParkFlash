import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Socio } from '../../core/models';
import { LayoutService } from '../../core/services/layout.service';
import { SociosService } from '../../core/services/socios.service';
import { UnidadesService } from '../../core/services/unidades.service';
import { ConfirmComponent } from '../../shared/components/confirm/confirm.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AvisoService } from '../../core/services/aviso.service';

@Component({
  selector: 'pf-socios',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, IconComponent, ModalComponent, ConfirmComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './socios.component.html',
  styleUrl: './socios.component.scss',
})
export class SociosComponent {
  private readonly sociosService = inject(SociosService);
  private readonly aviso = inject(AvisoService);
  private readonly unidadesService = inject(UnidadesService);
  private readonly fb = inject(FormBuilder);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly socios = this.sociosService.socios;
  protected readonly unidades = this.unidadesService.unidades;
  protected readonly totais = this.sociosService.totaisPorUnidade;

  protected readonly formAberto = signal(false);
  protected readonly editando = signal<Socio | null>(null);
  protected readonly paraExcluir = signal<Socio | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    percentuais: this.fb.array<FormGroup>([]),
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  get percentuais() {
    return this.form.controls.percentuais;
  }

  /**
   * Como ficaria o total de cada unidade se este formulário fosse salvo —
   * mostra ao usuário se o rateio vai fechar em 100% antes de confirmar.
   */
  protected readonly previa = computed(() => {
    const editando = this.editando();
    const informados = this.valores().percentuais ?? [];

    return this.unidades().map(({ id, nome: unidade }, i) => {
      const outros = this.socios()
        .filter((s) => s.id !== editando?.id)
        .reduce((soma, s) => soma + (s.percentuais.find((p) => p.unidadeId === id)?.percentual ?? 0), 0);

      const meu = Number(informados[i]?.['percentual'] ?? 0);
      const total = outros + meu;

      return { unidade, total, valido: total === 100 || total === 0 };
    });
  });

  protected percentual(socio: Socio, unidadeId: number): number | null {
    return this.sociosService.percentual(socio, unidadeId);
  }

  protected nomeUnidade(id: number): string {
    return this.unidadesService.nome(id);
  }

  protected participacoes(socio: Socio) {
    return socio.percentuais.filter((p) => p.percentual > 0);
  }

  protected abrir(socio?: Socio): void {
    this.editando.set(socio ?? null);

    this.percentuais.clear();
    for (const { id, nome: unidade } of this.unidades()) {
      this.percentuais.push(
        this.fb.nonNullable.group({
          unidadeId: [id],
          unidade: [unidade],
          percentual: [
            socio?.percentuais.find((p) => p.unidadeId === id)?.percentual ?? 0,
            [Validators.min(0), Validators.max(100)],
          ],
        })
      );
    }

    this.form.controls.nome.setValue(socio?.nome ?? '');
    this.form.markAsUntouched();
    this.formAberto.set(true);
  }

  protected async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const bruto = this.form.getRawValue();

    try {
      await this.sociosService.salvarSocio({
        id: this.editando()?.id,
        nome: bruto.nome,
        percentuais: bruto.percentuais.map((p) => ({
          unidadeId: Number(p['unidadeId']),
          percentual: Number(p['percentual']),
        })),
      });
      this.formAberto.set(false);
      this.aviso.sucesso('Sócio salvo.');
    } catch (erro) {
      this.aviso.erro(erro);
    }
  }

  protected async confirmarExclusao(): Promise<void> {
    const socio = this.paraExcluir();
    this.paraExcluir.set(null);
    if (!socio) return;
    try {
      await this.sociosService.excluir(socio.id);
      this.aviso.sucesso('Sócio excluído.');
    } catch (erro) {
      this.aviso.erro(erro);
    }
  }

  protected invalido(nome: string): boolean {
    const campo = this.form.get(nome);
    return !!campo && campo.invalid && campo.touched;
  }
}
