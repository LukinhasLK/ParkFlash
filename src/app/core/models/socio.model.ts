export interface PercentualUnidade {
  unidade: string;
  percentual: number;
}

export interface Socio {
  id: number;
  nome: string;
  percentuais: PercentualUnidade[];
}
