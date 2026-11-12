import { computed, inject, Injectable, signal } from '@angular/core';
import { Usuario } from '../models';
import { carregar, remover, salvar } from './storage';
import { UsuariosService } from './usuarios.service';

const CHAVE = 'parkflash.sessao';

/**
 * Autenticação de demonstração: confere e-mail/nome e senha no cadastro de usuários
 * (localStorage). Com o back end, `login` passa a chamar POST /auth/login e guardar o JWT.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuariosService = inject(UsuariosService);
  private readonly _usuarioId = signal<number | null>(carregar<number | null>(CHAVE, null));

  readonly usuario = computed<Usuario | null>(() => {
    const id = this._usuarioId();
    const encontrado = this.usuariosService.usuarios().find((u) => u.id === id);
    if (!encontrado) return null;
    const { senha: _senha, ...semSenha } = encontrado;
    return semSenha;
  });
  readonly autenticado = computed(() => this.usuario() !== null);
  readonly nivel = computed(() => this.usuario()?.nivel ?? null);
  readonly inicial = computed(() => this.usuario()?.nome.charAt(0).toUpperCase() ?? '?');

  login(identificador: string, senha: string): boolean {
    const busca = identificador.trim().toLowerCase();
    if (!busca || !senha) return false;

    const encontrado = this.usuariosService
      .usuarios()
      .find((u) => (u.email.toLowerCase() === busca || u.nome.toLowerCase() === busca) && u.senha === senha);
    if (!encontrado) return false;

    this._usuarioId.set(encontrado.id);
    salvar(CHAVE, encontrado.id);
    return true;
  }

  trocarSenha(senhaAtual: string, novaSenha: string): boolean {
    const id = this._usuarioId();
    const atual = this.usuariosService.usuarios().find((u) => u.id === id);
    if (!atual || atual.senha !== senhaAtual) return false;
    this.usuariosService.salvarUsuario({ ...atual, senha: novaSenha });
    return true;
  }

  logout(): void {
    this._usuarioId.set(null);
    remover(CHAVE);
  }
}
