import { computed, Injectable, signal } from '@angular/core';
import { Usuario } from '../models';
import { USUARIOS_SEED } from './seed';
import { carregar, remover, salvar } from './storage';

const CHAVE = 'parkflash.usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuario = signal<Usuario | null>(carregar<Usuario | null>(CHAVE, null));

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly inicial = computed(() => this._usuario()?.nome.charAt(0).toUpperCase() ?? '?');

  /** Demo: qualquer senha entra; o e-mail apenas escolhe o usuário da sessão. */
  login(identificador: string, senha: string): boolean {
    if (!identificador.trim() || !senha) return false;

    const busca = identificador.trim().toLowerCase();
    const encontrado =
      USUARIOS_SEED.find((u) => u.email.toLowerCase() === busca || u.nome.toLowerCase() === busca) ??
      USUARIOS_SEED[0];

    this._usuario.set(encontrado);
    salvar(CHAVE, encontrado);
    return true;
  }

  logout(): void {
    this._usuario.set(null);
    remover(CHAVE);
  }
}
