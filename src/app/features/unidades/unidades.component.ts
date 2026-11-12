import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Unidade } from '../../core/models';
import { LayoutService } from '../../core/services/layout.service';
import { UnidadesService } from '../../core/services/unidades.service';
import { ConfirmComponent } from '../../shared/components/confirm/confirm.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'pf-unidades',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, IconComponent, ModalComponent, ConfirmComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unidades.component.html',
  styleUrl: './unidades.component.scss',
})
export class UnidadesComponent {
  private readonly unidadesService = inject(UnidadesService);
  private readonly fb = inject(FormBuilder);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly unidades = this.unidadesService.unidades;

  protected readonly formAberto = signal(false);
  protected readonly editando = signal<Unidade | null>(null);
  protected readonly paraExcluir = signal<Unidade | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    endereco: ['', Validators.required],
    telefone: [''],
  });

  protected abrir(unidade?: Unidade): void {
    this.editando.set(unidade ?? null);
    this.form.reset({
      nome: unidade?.nome ?? '',
      endereco: unidade?.endereco ?? '',
      telefone: unidade?.telefone ?? '',
    });
    this.formAberto.set(true);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.unidadesService.salvarUnidade({ ...this.form.getRawValue(), id: this.editando()?.id });
    this.formAberto.set(false);
  }

  protected confirmarExclusao(): void {
    const unidade = this.paraExcluir();
    if (unidade) this.unidadesService.excluir(unidade.id);
    this.paraExcluir.set(null);
  }

  protected invalido(nome: string): boolean {
    const campo = this.form.get(nome);
    return !!campo && campo.invalid && campo.touched;
  }
}
