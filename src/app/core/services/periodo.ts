export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

export const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

export const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado',
] as const;

/** Período de referência da demo. */
export const MES_ATUAL = 6;
export const ANO_ATUAL = 2026;

export const ANOS_DISPONIVEIS = [2026, 2025, 2024];

export const TODAS_UNIDADES = 'Todas';

export interface Filtro {
  /** 0 = todos os meses. */
  mes: number;
  ano: number;
  unidade: string;
  busca?: string;
}

/** Datas são ISO (`YYYY-MM-DD`) para ordenar e filtrar sem fuso horário. */
export function mesDe(dataIso: string): number {
  return Number(dataIso.slice(5, 7));
}

export function anoDe(dataIso: string): number {
  return Number(dataIso.slice(0, 4));
}

export function diaDe(dataIso: string): number {
  return Number(dataIso.slice(8, 10));
}

/** `2026-06-07` → `07/06/2026`. */
export function formatarData(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** `07/06/2026` → `2026-06-07`. */
export function paraIso(dataBr: string): string {
  const [dia, mes, ano] = dataBr.split('/');
  return `${ano}-${mes}-${dia}`;
}

export function diaDaSemana(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  return DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()];
}

export function rotuloPeriodo(mes: number, ano: number): string {
  return mes === 0 ? `Ano de ${ano}` : `${MESES[mes - 1]} de ${ano}`;
}

/** Aplica mês/ano/unidade a qualquer registro datado. */
export function noPeriodo(registro: { data: string; unidade: string }, filtro: Filtro): boolean {
  if (anoDe(registro.data) !== filtro.ano) return false;
  if (filtro.mes !== 0 && mesDe(registro.data) !== filtro.mes) return false;
  if (filtro.unidade !== TODAS_UNIDADES && registro.unidade !== filtro.unidade) return false;
  return true;
}
