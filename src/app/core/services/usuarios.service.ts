import { Injectable, signal } from '@angular/core';
import { Usuario } from '../models';
import { USUARIOS_SEED } from './seed';
import { carregar, salvar } from './storage';

const CHAVE = 'parkflash.usuarios';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly _usuarios = signal<Usuario[]>(carregar(CHAVE, USUARIOS_SEED));

  readonly usuarios = this._usuarios.asReadonly();

  /** Na edição, senha vazia mantém a senha atual. */
  salvarUsuario(usuario: Omit<Usuario, 'id'> & { id?: number }): void {
    const { senha, ...dados } = usuario;
    const comSenha = senha ? { senha } : {};
    this._usuarios.update((lista) =>
      usuario.id
        ? lista.map((u) => (u.id === usuario.id ? { ...u, ...dados, ...comSenha, id: u.id } : u))
        : [...lista, { ...dados, ...comSenha, id: lista.reduce((maior, u) => Math.max(maior, u.id), 0) + 1 }]
    );
    this.persistir();
  }

  emailEmUso(email: string, ignorarId?: number): boolean {
    const busca = email.trim().toLowerCase();
    return this._usuarios().some((u) => u.id !== ignorarId && u.email.toLowerCase() === busca);
  }

  excluir(id: number): void {
    this._usuarios.update((lista) => lista.filter((u) => u.id !== id));
    this.persistir();
  }

  private persistir(): void {
    salvar(CHAVE, this._usuarios());
  }
}
