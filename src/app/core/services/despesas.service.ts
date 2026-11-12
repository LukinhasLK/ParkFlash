import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CategoriaDespesa, Despesa } from '../models';
import { round2 } from './calc';
import { Filtro, noPeriodo } from './periodo';
import { API_URL } from './api';

const URL = `${API_URL}/despesas`;

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
  private readonly http = inject(HttpClient);
  private readonly _despesas = signal<Despesa[]>([]);

  readonly despesas = this._despesas.asReadonly();

  async carregar(): Promise<void> {
    this._despesas.set(await firstValueFrom(this.http.get<Despesa[]>(URL)));
  }

  limpar(): void {
    this._despesas.set([]);
  }

  filtrar(filtro: Filtro & { categoria?: string }): Despesa[] {
    return this._despesas()
      .filter((despesa) => noPeriodo(despesa, filtro))
      .filter((despesa) => !filtro.categoria || filtro.categoria === TODAS_CATEGORIAS || despesa.categoria === filtro.categoria)
      .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
  }

  total(despesas: Despesa[]): number {
    return round2(despesas.reduce((soma, d) => soma + d.valor, 0));
  }

  async adicionar(despesa: Omit<Despesa, 'id'>): Promise<Despesa> {
    const salva = await firstValueFrom(this.http.post<Despesa>(URL, despesa));
    this._despesas.update((lista) => [salva, ...lista]);
    return salva;
  }

  async atualizar(despesa: Despesa): Promise<Despesa> {
    const salva = await firstValueFrom(this.http.put<Despesa>(`${URL}/${despesa.id}`, despesa));
    this._despesas.update((lista) => lista.map((d) => (d.id === salva.id ? salva : d)));
    return salva;
  }

  usaUnidade(unidadeId: number): boolean {
    return this._despesas().some((d) => d.unidadeId === unidadeId);
  }

  async excluir(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${URL}/${id}`));
    this._despesas.update((lista) => lista.filter((d) => d.id !== id));
  }
}
