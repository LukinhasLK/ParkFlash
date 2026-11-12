import { TestBed } from '@angular/core/testing';
import { Ficha } from '../models';
import { FichasService } from './fichas.service';

const base: Omit<Ficha, 'id'> = {
  data: '2030-03-10',
  unidadeId: 1,
  turno: 'noite',
  fichaInicio: 1,
  fichaFim: 41,
  fichasCanceladas: 0,
  totalCarros: 40,
  valorDinheiro: 400,
  valorCartao: 600,
  taxaMaquininha: 2,
  manobristas: [{ manobristaId: 1, diaria: 80 }, { manobristaId: 2, diaria: 80 }],
  despesasAdicionais: [],
  totalBruto: 1000,
  totalLiquido: 828,
};

describe('FichasService', () => {
  let service: FichasService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FichasService);
  });

  it('detecta ficha duplicada (mesma data, unidade e turno)', () => {
    const criada = service.adicionar(base);

    expect(service.existeDuplicada(base)).toBeTrue();
    expect(service.existeDuplicada({ ...base, turno: 'dia' })).toBeFalse();
    expect(service.existeDuplicada({ ...base, unidadeId: 2 })).toBeFalse();
    // Na edição, a própria ficha não conta como duplicada.
    expect(service.existeDuplicada(base, criada.id)).toBeFalse();
  });

  it('atualiza uma ficha existente', () => {
    const criada = service.adicionar(base);
    service.atualizar({ ...criada, valorDinheiro: 999 });

    expect(service.porId(criada.id)?.valorDinheiro).toBe(999);
  });

  it('soma diárias por manobrista no mês', () => {
    service.adicionar(base);
    service.adicionar({ ...base, data: '2030-03-11', manobristas: [{ manobristaId: 1, diaria: 90 }] });

    const mapa = service.diariasPorManobrista(3, 2030);
    expect(mapa.get(1)).toEqual({ dias: 2, total: 170 });
    expect(mapa.get(2)).toEqual({ dias: 1, total: 80 });
  });

  it('informa se unidade ou manobrista têm histórico', () => {
    service.adicionar({ ...base, unidadeId: 99, manobristas: [{ manobristaId: 77, diaria: 80 }] });

    expect(service.usaUnidade(99)).toBeTrue();
    expect(service.usaManobrista(77)).toBeTrue();
    expect(service.usaUnidade(12345)).toBeFalse();
  });

  it('filtra pelo período e resume os totais', () => {
    service.adicionar(base);
    const fichas = service.filtrar({ mes: 3, ano: 2030, unidadeId: 1 });

    expect(fichas.length).toBe(1);
    expect(service.resumir(fichas).liquido).toBe(828);
  });
});
