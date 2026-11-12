import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { rotaInicial } from '../../../core/services/permissoes';
import { SENHA_DEMO } from '../../../core/services/seed';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'pf-login',
  standalone: true,
  imports: [ReactiveFormsModule, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  protected readonly isMobile = inject(LayoutService).isMobile;
  protected readonly erro = signal('');
  protected readonly ajudaSenha = signal(false);
  protected readonly senhaDemo = SENHA_DEMO;

  protected readonly form = this.fb.nonNullable.group({
    identificador: ['', [Validators.required]],
    senha: ['', [Validators.required, Validators.minLength(4)]],
  });

  protected entrar(): void {
    this.erro.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { identificador, senha } = this.form.getRawValue();

    if (!this.auth.login(identificador, senha)) {
      this.erro.set('E-mail/usuário ou senha incorretos.');
      return;
    }

    const destino = this.rota.snapshot.queryParamMap.get('redirectTo') ?? rotaInicial(this.auth.nivel());
    this.router.navigateByUrl(destino);
  }

  protected campoInvalido(nome: 'identificador' | 'senha'): boolean {
    const campo = this.form.controls[nome];
    return campo.invalid && campo.touched;
  }
}
