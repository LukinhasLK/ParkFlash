import { Injectable, signal } from '@angular/core';
import { Ficha } from '../models';
import { despesasDaFicha, round2 } from './calc';
import { anoDe, diaDaSemana, DIAS_SEMANA, diaDe, Filtro, formatarData, mesDe, noPeriodo } from './periodo';
import { CARROS_ANO_ANTERIOR, FICHAS_SEED } from './seed';
import { carregar, salvar } from './storage';

const CHAVE = 'parkflash.fichas';

export interface ResumoFichas {
  fichas: number;
  carros: number;
  bruto: number;
  liquido: number;
  despesas: number;
}

export interface PontoDia {
  rotulo: string;
  valor: number;
}

export interface ResumoMes {
  mes: number;
  fichas: number;
  carros: number;
  bruto: number;
  liquido: number;
}

@Injectable({ providedIn: 'root' })
export class FichasService {
  private readonly _fichas = signal<Ficha[]>(carregar(CHAVE, FICHAS_SEED));

  readonly fichas = this._fichas.asReadonly();
  readonly carrosAnoAnterior = CARROS_ANO_ANTERIOR;

  porId(id: number): Ficha | undefined {
    return this._fichas().find((f) => f.id === id);
  }

  /** Fichas do período, já ordenadas da mais recente para a mais antiga. */
  filtrar(filtro: Filtro): Ficha[] {
    const busca = filtro.busca?.trim().toLowerCase() ?? '';

    return this._fichas()
      .filter((ficha) => noPeriodo(ficha, filtro))
      .filter((ficha) => {
        if (!busca) return true;
        return (
          ficha.unidade.toLowerCase().includes(busca) ||
          formatarData(ficha.data).includes(busca) ||
          ficha.data.includes(busca)
        );
      })
      .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
  }

  resumir(fichas: Ficha[]): ResumoFichas {
    return fichas.reduce<ResumoFichas>(
      (total, ficha) => ({
        fichas: total.fichas + 1,
        carros: total.carros + ficha.totalCarros,
        bruto: round2(total.bruto + ficha.totalBruto),
        liquido: round2(total.liquido + ficha.totalLiquido),
        despesas: round2(total.despesas + despesasDaFicha(ficha)),
      }),
      { fichas: 0, carros: 0, bruto: 0, liquido: 0, despesas: 0 }
    );
  }

  /** Série de valor líquido por dia, do início ao fim do período. */
  liquidoPorDia(fichas: Ficha[], limite = 9): PontoDia[] {
    const porDia = new Map<string, number>();

    for (const ficha of fichas) {
      porDia.set(ficha.data, round2((porDia.get(ficha.data) ?? 0) + ficha.totalLiquido));
    }

    return [...porDia.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limite)
      .reverse()
      .map(([data, valor]) => ({ rotulo: String(diaDe(data)).padStart(2, '0'), valor }));
  }

  /** Resumo de cada mês de um ano — base dos gráficos de evolução. */
  resumoMensal(ano: number, unidade: string): ResumoMes[] {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const doMes = this.filtrar({ mes, ano, unidade });
      const resumo = this.resumir(doMes);
      return { mes, fichas: resumo.fichas, carros: resumo.carros, bruto: resumo.bruto, liquido: resumo.liquido };
    });
  }

  /** Dia da semana com maior faturamento bruto no período. */
  melhorDiaDaSemana(fichas: Ficha[]): { dia: string; total: number } | null {
    if (!fichas.length) return null;

    const totais = new Array(7).fill(0);
    for (const ficha of fichas) {
      const indice = DIAS_SEMANA.indexOf(diaDaSemana(ficha.data) as (typeof DIAS_SEMANA)[number]);
      totais[indice] = round2(totais[indice] + ficha.totalBruto);
    }

    const melhor = totais.indexOf(Math.max(...totais));
    return { dia: DIAS_SEMANA[melhor], total: totais[melhor] };
  }

  anosComRegistro(): number[] {
    const anos = new Set(this._fichas().map((f) => anoDe(f.data)));
    return [...anos].sort((a, b) => b - a);
  }

  adicionar(ficha: Omit<Ficha, 'id'>): Ficha {
    const nova: Ficha = { ...ficha, id: this._fichas().reduce((maior, f) => Math.max(maior, f.id), 0) + 1 };
    this._fichas.update((lista) => [nova, ...lista].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id));
    this.persistir();
    return nova;
  }

  excluir(id: number): void {
    this._fichas.update((lista) => lista.filter((f) => f.id !== id));
    this.persistir();
  }

  /** Quantos dias cada manobrista trabalhou no mês/ano e quanto recebeu. */
  diariasPorManobrista(mes: number, ano: number): Map<string, { dias: number; total: number }> {
    const mapa = new Map<string, { dias: number; total: number }>();

    for (const ficha of this._fichas()) {
      if (anoDe(ficha.data) !== ano || (mes !== 0 && mesDe(ficha.data) !== mes)) continue;

      for (const m of ficha.manobristas) {
        const atual = mapa.get(m.nome) ?? { dias: 0, total: 0 };
        mapa.set(m.nome, { dias: atual.dias + 1, total: round2(atual.total + m.diaria) });
      }
    }

    return mapa;
  }

  private persistir(): void {
    salvar(CHAVE, this._fichas());
  }
}
