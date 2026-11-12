export type NivelAcesso = 'Proprietário' | 'Gerente' | 'Operador';

export const NIVEIS_ACESSO: NivelAcesso[] = ['Proprietário', 'Gerente', 'Operador'];

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  nivel: NivelAcesso;
}
