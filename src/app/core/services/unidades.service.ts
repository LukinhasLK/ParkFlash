import { computed, Injectable, signal } from '@angular/core';
import { Unidade } from '../models';
import { UNIDADES_SEED } from './seed';
import { carregar, salvar } from './storage';

const CHAVE = 'parkflash.unidades';

@Injectable({ providedIn: 'root' })
export class UnidadesService {
  private readonly _unidades = signal<Unidade[]>(carregar(CHAVE, UNIDADES_SEED));

  readonly unidades = this._unidades.asReadonly();
  readonly nomes = computed(() => this._unidades().map((u) => u.nome));

  salvarUnidade(unidade: Omit<Unidade, 'id'> & { id?: number }): void {
    this._unidades.update((lista) =>
      unidade.id
        ? lista.map((u) => (u.id === unidade.id ? { ...u, ...unidade, id: u.id } : u))
        : [...lista, { ...unidade, id: this.proximoId(lista) }]
    );
    this.persistir();
  }

  excluir(id: number): void {
    this._unidades.update((lista) => lista.filter((u) => u.id !== id));
    this.persistir();
  }

  private proximoId(lista: Unidade[]): number {
    return lista.reduce((maior, u) => Math.max(maior, u.id), 0) + 1;
  }

  private persistir(): void {
    salvar(CHAVE, this._unidades());
  }
}
