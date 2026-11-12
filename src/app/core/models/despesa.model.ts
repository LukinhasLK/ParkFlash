export type CategoriaDespesa = 'Seguro' | 'Manutenção' | 'Aluguel' | 'Outros';

export const CATEGORIAS_DESPESA: CategoriaDespesa[] = ['Seguro', 'Manutenção', 'Aluguel', 'Outros'];

export interface Despesa {
  id: number;
  data: string;
  unidadeId: number;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
}
