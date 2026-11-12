export type Turno = 'dia' | 'noite';

export interface ManobristaFicha {
  manobristaId: number;
  diaria: number;
}

export interface DespesaAdicional {
  descricao: string;
  valor: number;
}

export interface Ficha {
  id: number;
  data: string;
  unidadeId: number;
  turno: Turno;
  fichaInicio: number;
  fichaFim: number;
  fichasCanceladas: number;
  totalCarros: number;
  valorDinheiro: number;
  valorCartao: number;
  taxaMaquininha: number;
  manobristas: ManobristaFicha[];
  despesasAdicionais: DespesaAdicional[];
  totalBruto: number;
  totalLiquido: number;
}
