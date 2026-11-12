import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
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

  protected readonly form = this.fb.nonNullable.group({
    identificador: ['lucasrodrigues.10@icloud.com', [Validators.required]],
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
      this.erro.set('Não foi possível entrar. Confira os dados e tente novamente.');
      return;
    }

    const destino = this.rota.snapshot.queryParamMap.get('redirectTo') ?? '/app/dashboard';
    this.router.navigateByUrl(destino);
  }

  protected campoInvalido(nome: 'identificador' | 'senha'): boolean {
    const campo = this.form.controls[nome];
    return campo.invalid && campo.touched;
  }
}
