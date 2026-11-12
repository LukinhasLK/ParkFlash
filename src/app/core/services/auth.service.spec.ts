import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SENHA_DEMO } from './seed';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
  });

  it('recusa senha errada', () => {
    expect(auth.login('pedro@email.com', 'errada')).toBeFalse();
    expect(auth.autenticado()).toBeFalse();
  });

  it('entra com e-mail e senha corretos e não expõe a senha', () => {
    expect(auth.login('Pedro@Email.com', SENHA_DEMO)).toBeTrue();
    expect(auth.nivel()).toBe('Gerente');
    expect(auth.usuario()?.senha).toBeUndefined();
  });

  it('troca a senha só com a senha atual correta', () => {
    auth.login('dario@email.com', SENHA_DEMO);

    expect(auth.trocarSenha('errada', 'nova-senha')).toBeFalse();
    expect(auth.trocarSenha(SENHA_DEMO, 'nova-senha')).toBeTrue();

    auth.logout();
    expect(auth.login('dario@email.com', SENHA_DEMO)).toBeFalse();
    expect(auth.login('dario@email.com', 'nova-senha')).toBeTrue();
  });
});
