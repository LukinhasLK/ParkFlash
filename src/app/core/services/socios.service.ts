import { computed, Injectable, inject, signal } from '@angular/core';
import { Socio } from '../models';
import { SOCIOS_SEED } from './seed';
import { carregar, salvar } from './storage';
import { UnidadesService } from './unidades.service';

const CHAVE = 'parkflash.socios';

export interface TotalUnidade {
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
  private readonly _socios = signal<Socio[]>(carregar(CHAVE, SOCIOS_SEED));

  readonly socios = this._socios.asReadonly();

  /** Soma dos percentuais por unidade — precisa fechar em 100%. */
  readonly totaisPorUnidade = computed<TotalUnidade[]>(() =>
    this.unidadesService.nomes().map((unidade) => {
      const total = this._socios().reduce(
        (soma, socio) => soma + (socio.percentuais.find((p) => p.unidade === unidade)?.percentual ?? 0),
        0
      );
      return { unidade, total, valido: total === 100, vazia: total === 0 };
    })
  );

  /** Apenas as unidades que já têm rateio configurado. */
  readonly unidadesConfiguradas = computed(() =>
    this.totaisPorUnidade().filter((t) => t.total > 0)
  );

  percentual(socio: Socio, unidade: string): number | null {
    return socio.percentuais.find((p) => p.unidade === unidade)?.percentual ?? null;
  }

  sociosDaUnidade(unidade: string): Socio[] {
    return this._socios().filter((s) => s.percentuais.some((p) => p.unidade === unidade && p.percentual > 0));
  }

  salvarSocio(socio: Omit<Socio, 'id'> & { id?: number }): void {
    const percentuais = socio.percentuais.filter((p) => p.percentual > 0);

    this._socios.update((lista) =>
      socio.id
        ? lista.map((s) => (s.id === socio.id ? { ...s, nome: socio.nome, percentuais } : s))
        : [...lista, { nome: socio.nome, percentuais, id: lista.reduce((maior, s) => Math.max(maior, s.id), 0) + 1 }]
    );
    this.persistir();
  }

  excluir(id: number): void {
    this._socios.update((lista) => lista.filter((s) => s.id !== id));
    this.persistir();
  }

  private persistir(): void {
    salvar(CHAVE, this._socios());
  }
}
