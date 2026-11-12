import { Injectable, signal } from '@angular/core';
import { CategoriaDespesa, Despesa } from '../models';
import { round2 } from './calc';
import { Filtro, noPeriodo } from './periodo';
import { DESPESAS_SEED } from './seed';
import { carregar, salvar } from './storage';

const CHAVE = 'parkflash.despesas';

export const TODAS_CATEGORIAS = 'Todas';

/** Cor do badge de cada categoria. */
export const CLASSE_CATEGORIA: Record<CategoriaDespesa, string> = {
  Seguro: 'pf-badge--blue',
  'Manutenção': 'pf-badge--orange',
  Aluguel: 'pf-badge--purple',
  Outros: 'pf-badge--gray',
};

@Injectable({ providedIn: 'root' })
export class DespesasService {
  private readonly _despesas = signal<Despesa[]>(carregar(CHAVE, DESPESAS_SEED));

  readonly despesas = this._despesas.asReadonly();

  filtrar(filtro: Filtro & { categoria?: string }): Despesa[] {
    return this._despesas()
      .filter((despesa) => noPeriodo(despesa, filtro))
      .filter((despesa) => !filtro.categoria || filtro.categoria === TODAS_CATEGORIAS || despesa.categoria === filtro.categoria)
      .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
  }

  total(despesas: Despesa[]): number {
    return round2(despesas.reduce((soma, d) => soma + d.valor, 0));
  }

  adicionar(despesa: Omit<Despesa, 'id'>): void {
    this._despesas.update((lista) => [
      { ...despesa, id: lista.reduce((maior, d) => Math.max(maior, d.id), 0) + 1 },
      ...lista,
    ]);
    this.persistir();
  }

  atualizar(despesa: Despesa): void {
    this._despesas.update((lista) => lista.map((d) => (d.id === despesa.id ? despesa : d)));
    this.persistir();
  }

  usaUnidade(unidadeId: number): boolean {
    return this._despesas().some((d) => d.unidadeId === unidadeId);
  }

  excluir(id: number): void {
    this._despesas.update((lista) => lista.filter((d) => d.id !== id));
    this.persistir();
  }

  private persistir(): void {
    salvar(CHAVE, this._despesas());
  }
}
