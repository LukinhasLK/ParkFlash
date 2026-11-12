import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BOTTOM_NAV_ITEMS, MAIS_ITEMS } from '../../nav-items';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pf-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly itens = BOTTOM_NAV_ITEMS;
  protected readonly maisItens = MAIS_ITEMS;
  protected readonly maisAberto = signal(false);

  protected alternarMais(): void {
    this.maisAberto.update((aberto) => !aberto);
  }

  protected fecharMais(): void {
    this.maisAberto.set(false);
  }

  protected sair(): void {
    this.fecharMais();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
