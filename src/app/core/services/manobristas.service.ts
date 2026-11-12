import { computed, Injectable, signal } from '@angular/core';
import { Manobrista } from '../models';
import { MANOBRISTAS_SEED } from './seed';
import { carregar, salvar } from './storage';

const CHAVE = 'parkflash.manobristas';

@Injectable({ providedIn: 'root' })
export class ManobristasService {
  private readonly _manobristas = signal<Manobrista[]>(carregar(CHAVE, MANOBRISTAS_SEED));

  readonly manobristas = this._manobristas.asReadonly();
  readonly nomes = computed(() => this._manobristas().map((m) => m.nome));

  nome(id: number): string {
    return this._manobristas().find((m) => m.id === id)?.nome ?? '—';
  }

  salvarManobrista(manobrista: Omit<Manobrista, 'id'> & { id?: number }): Manobrista {
    let resultado!: Manobrista;

    this._manobristas.update((lista) => {
      if (manobrista.id) {
        resultado = { ...lista.find((m) => m.id === manobrista.id)!, ...manobrista, id: manobrista.id };
        return lista.map((m) => (m.id === manobrista.id ? resultado : m));
      }
      resultado = { ...manobrista, id: lista.reduce((maior, m) => Math.max(maior, m.id), 0) + 1 };
      return [...lista, resultado];
    });

    this.persistir();
    return resultado;
  }

  excluir(id: number): void {
    this._manobristas.update((lista) => lista.filter((m) => m.id !== id));
    this.persistir();
  }

  private persistir(): void {
    salvar(CHAVE, this._manobristas());
  }
}
