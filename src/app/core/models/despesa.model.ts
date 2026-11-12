export type CategoriaDespesa = 'Seguro' | 'Manutenção' | 'Aluguel' | 'Outros';

export const CATEGORIAS_DESPESA: CategoriaDespesa[] = ['Seguro', 'Manutenção', 'Aluguel', 'Outros'];

export interface Despesa {
  id: number;
  data: string;
  unidade: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
}
