import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NIVEIS_ACESSO, NivelAcesso, Usuario } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { corDoAvatar } from '../../shared/nav-items';
import { ConfirmComponent } from '../../shared/components/confirm/confirm.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

/** Cor do badge por nível de acesso. */
const CLASSE_NIVEL: Record<NivelAcesso, string> = {
  'Proprietário': 'pf-badge--purple',
  Gerente: 'pf-badge--blue',
  Operador: 'pf-badge--gray',
};

@Component({
  selector: 'pf-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, IconComponent, ModalComponent, ConfirmComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly usuarios = this.usuariosService.usuarios;
  protected readonly niveis = NIVEIS_ACESSO;

  protected readonly formAberto = signal(false);
  protected readonly editando = signal<Usuario | null>(null);
  protected readonly paraExcluir = signal<Usuario | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    nivel: ['Operador' as NivelAcesso, Validators.required],
    senha: [''],
  });
  protected readonly emailDuplicado = signal(false);

  protected classe(nivel: NivelAcesso): string {
    return CLASSE_NIVEL[nivel];
  }

  protected cor(nome: string): string {
    return corDoAvatar(nome);
  }

  /** O usuário da sessão não pode se excluir. */
  protected ehVoce(usuario: Usuario): boolean {
    return this.auth.usuario()?.id === usuario.id;
  }

  protected abrir(usuario?: Usuario): void {
    this.editando.set(usuario ?? null);
    this.form.reset({
      nome: usuario?.nome ?? '',
      email: usuario?.email ?? '',
      nivel: usuario?.nivel ?? 'Operador',
      senha: '',
    });
    // Senha obrigatória só no cadastro; na edição, vazio mantém a atual.
    this.form.controls.senha.setValidators(usuario ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]);
    this.form.controls.senha.updateValueAndValidity();
    this.emailDuplicado.set(false);
    this.formAberto.set(true);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dados = this.form.getRawValue();
    if (this.usuariosService.emailEmUso(dados.email, this.editando()?.id)) {
      this.emailDuplicado.set(true);
      return;
    }

    this.usuariosService.salvarUsuario({ ...dados, id: this.editando()?.id });
    this.formAberto.set(false);
  }

  protected confirmarExclusao(): void {
    const usuario = this.paraExcluir();
    if (usuario && !this.ehVoce(usuario)) this.usuariosService.excluir(usuario.id);
    this.paraExcluir.set(null);
  }

  protected invalido(nome: string): boolean {
    const campo = this.form.get(nome);
    return !!campo && campo.invalid && campo.touched;
  }
}
