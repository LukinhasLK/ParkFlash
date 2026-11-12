import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Socio } from '../models';
import { API_URL } from './api';
import { UnidadesService } from './unidades.service';

const URL = `${API_URL}/socios`;

export interface TotalUnidade {
  unidadeId: number;
  unidade: string;
  total: number;
  /** Fecha em 100% — pronto para dividir lucro. */
  valido: boolean;
  /** Ainda sem nenhum sócio: pendente, não é erro. */
  vazia: boolean;
}

@Injectable({ providedIn: 'root' })
export class SociosService {
  private readonly unidadesService = inject(UnidadesService);
  private readonly http = inject(HttpClient);
  private readonly _socios = signal<Socio[]>([]);

  readonly socios = this._socios.asReadonly();

  async carregar(): Promise<void> {
    this._socios.set(await firstValueFrom(this.http.get<Socio[]>(URL)));
  }

  limpar(): void {
    this._socios.set([]);
  }

  /** Soma dos percentuais por unidade — precisa fechar em 100%. */
  readonly totaisPorUnidade = computed<TotalUnidade[]>(() =>
    this.unidadesService.unidades().map(({ id, nome }) => {
      const total = this._socios().reduce(
        (soma, socio) => soma + (socio.percentuais.find((p) => p.unidadeId === id)?.percentual ?? 0),
        0
      );
      return { unidadeId: id, unidade: nome, total, valido: total === 100, vazia: total === 0 };
    })
  );

  /** Apenas as unidades que já têm rateio configurado. */
  readonly unidadesConfiguradas = computed(() =>
    this.totaisPorUnidade().filter((t) => t.total > 0)
  );

  percentual(socio: Socio, unidadeId: number): number | null {
    return socio.percentuais.find((p) => p.unidadeId === unidadeId)?.percentual ?? null;
  }

  sociosDaUnidade(unidadeId: number): Socio[] {
    return this._socios().filter((s) => s.percentuais.some((p) => p.unidadeId === unidadeId && p.percentual > 0));
  }

  async salvarSocio(socio: Omit<Socio, 'id'> & { id?: number }): Promise<Socio> {
    const corpo = { nome: socio.nome, percentuais: socio.percentuais.filter((p) => p.percentual > 0) };
    const salvo = await firstValueFrom(
      socio.id ? this.http.put<Socio>(`${URL}/${socio.id}`, corpo) : this.http.post<Socio>(URL, corpo)
    );
    this._socios.update((lista) => (socio.id ? lista.map((s) => (s.id === salvo.id ? salvo : s)) : [...lista, salvo]));
    return salvo;
  }

  /** Reflete localmente a exclusão de uma unidade (o servidor já removeu a participação). */
  removerUnidade(unidadeId: number): void {
    this._socios.update((lista) =>
      lista.map((s) => ({ ...s, percentuais: s.percentuais.filter((p) => p.unidadeId !== unidadeId) }))
    );
  }

  async excluir(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${URL}/${id}`));
    this._socios.update((lista) => lista.filter((s) => s.id !== id));
  }
}
