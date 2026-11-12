import { Despesa, Ficha, Manobrista, Socio, Unidade, Usuario, Turno, CategoriaDespesa } from '../models';

/**
 * Dados de demonstração.
 *
 * Tudo que as telas exibem é derivado destas fichas — nenhum KPI é fixo em
 * tela. As fichas de junho/2026 são as do briefing; janeiro a maio são
 * geradas para bater exatamente com a tabela de "Carros por Mês".
 */

const OPTUM = 1;
const MANIFESTO = 2;

export const UNIDADES_SEED: Unidade[] = [
  { id: 1, nome: 'Optum', endereco: 'Rua Quata, 1016', telefone: '' },
  { id: 2, nome: 'Manifesto', endereco: 'Rua Ramos Batista', telefone: '' },
  { id: 3, nome: 'Beef', endereco: 'Rua Casa do Ator', telefone: '' },
];

export const MANOBRISTAS_SEED: Manobrista[] = [
  { id: 1, nome: 'Dario', telefone: '(11) 98765-4321', cpf: '412.336.789-57' },
  { id: 2, nome: 'Jamaica', telefone: '(11) 99123-8890', cpf: '305.221.447-05' },
  { id: 3, nome: 'Marcelo', telefone: '(11) 97456-2201', cpf: '128.909.556-64' },
  { id: 4, nome: 'Ricardo', telefone: '(11) 98890-7734', cpf: '674.113.208-20' },
  { id: 5, nome: 'Caue', telefone: '(11) 96678-1120', cpf: '890.554.312-06' },
  { id: 6, nome: 'Adriano', telefone: '(11) 99001-4567', cpf: '553.887.019-72' },
];

export const SOCIOS_SEED: Socio[] = [
  {
    id: 1,
    nome: 'Francisco',
    percentuais: [
      { unidadeId: OPTUM, percentual: 40 },
      { unidadeId: MANIFESTO, percentual: 50 },
    ],
  },
  {
    id: 2,
    nome: 'Lucas',
    percentuais: [{ unidadeId: OPTUM, percentual: 20 }],
  },
  {
    id: 3,
    nome: 'Henrique',
    percentuais: [
      { unidadeId: OPTUM, percentual: 40 },
      { unidadeId: MANIFESTO, percentual: 50 },
    ],
  },
];

/** Senha de todos os usuários de demonstração. */
export const SENHA_DEMO = '123456';

export const USUARIOS_SEED: Usuario[] = [
  { id: 1, nome: 'Lucas', email: 'lucasrodrigues.10@icloud.com', nivel: 'Proprietário', senha: SENHA_DEMO },
  { id: 2, nome: 'Pedro Henrique', email: 'pedro@email.com', nivel: 'Gerente', senha: SENHA_DEMO },
  { id: 3, nome: 'Dario', email: 'dario@email.com', nivel: 'Operador', senha: SENHA_DEMO },
];

/** Preço praticado por carro em cada unidade. */
const PRECO_POR_CARRO: Record<number, number> = { [OPTUM]: 60, [MANIFESTO]: 40, 3: 50 };

const DIARIA = 80;
const TAXA_MAQUININHA = 2;

const round2 = (n: number) => Math.round(n * 100) / 100;

interface FichaSpec {
  data: string;
  unidadeId: number;
  turno: Turno;
  carros: number;
  liquido: number;
}

/**
 * Reconstrói uma ficha completa e coerente a partir do resultado desejado:
 * 60% do bruto entra no cartão, 40% em dinheiro, duas diárias de R$80 e o
 * restante vira despesa adicional para fechar exatamente no líquido alvo.
 */
function montarFicha(id: number, spec: FichaSpec): Ficha {
  const preco = PRECO_POR_CARRO[spec.unidadeId] ?? 50;
  const totalBruto = round2(spec.carros * preco);

  const valorCartao = round2(totalBruto * 0.6);
  const valorDinheiro = round2(totalBruto - valorCartao);
  const liquidoCartao = round2(valorCartao - valorCartao * (TAXA_MAQUININHA / 100));

  const equipe = [MANOBRISTAS_SEED[id % 6], MANOBRISTAS_SEED[(id + 3) % 6]];
  const manobristas = equipe.map((m) => ({ manobristaId: m.id, diaria: DIARIA }));
  const totalDiarias = manobristas.length * DIARIA;

  const despesaFechamento = round2(valorDinheiro + liquidoCartao - totalDiarias - spec.liquido);
  const despesasAdicionais = despesaFechamento > 0
    ? [{ descricao: 'Custos operacionais do dia', valor: despesaFechamento }]
    : [];

  const fichasCanceladas = id % 5 === 0 ? 2 : 0;
  const fichaInicio = 0;
  const fichaFim = spec.carros + fichasCanceladas;

  return {
    id,
    data: spec.data,
    unidadeId: spec.unidadeId,
    turno: spec.turno,
    fichaInicio,
    fichaFim,
    fichasCanceladas,
    totalCarros: spec.carros,
    valorDinheiro,
    valorCartao,
    taxaMaquininha: TAXA_MAQUININHA,
    manobristas,
    despesasAdicionais,
    totalBruto,
    totalLiquido: round2(despesaFechamento > 0 ? spec.liquido : valorDinheiro + liquidoCartao - totalDiarias),
  };
}

/** Fichas de junho/2026 — exatamente as do briefing. */
const JUNHO: FichaSpec[] = [
  { data: '2026-06-07', unidadeId: MANIFESTO, turno: 'dia', carros: 21, liquido: -842 },
  { data: '2026-06-06', unidadeId: OPTUM, turno: 'dia', carros: 92, liquido: 1636.75 },
  { data: '2026-06-06', unidadeId: MANIFESTO, turno: 'noite', carros: 30, liquido: 660 },
  { data: '2026-06-05', unidadeId: OPTUM, turno: 'dia', carros: 164, liquido: 1413 },
  { data: '2026-06-05', unidadeId: MANIFESTO, turno: 'dia', carros: 22, liquido: 356 },
  { data: '2026-06-04', unidadeId: OPTUM, turno: 'dia', carros: 37, liquido: 711.5 },
  { data: '2026-06-03', unidadeId: OPTUM, turno: 'dia', carros: 59, liquido: 1600 },
  { data: '2026-06-02', unidadeId: MANIFESTO, turno: 'dia', carros: 39, liquido: -158 },
];

/** Metas mensais de janeiro a maio (tabela "Carros por Mês"). */
interface MetaMensal { mes: number; fichas: number; carros: number; liquido: number }

const METAS_MENSAIS: MetaMensal[] = [
  { mes: 1, fichas: 6, carros: 320, liquido: 4800 },
  { mes: 2, fichas: 5, carros: 280, liquido: 3920 },
  { mes: 3, fichas: 8, carros: 460, liquido: 7130 },
  { mes: 4, fichas: 7, carros: 390, liquido: 5860 },
  { mes: 5, fichas: 14, carros: 2246, liquido: 23860 },
];

/** Distribui um total em `n` partes com variação determinística; o resto cai na última. */
function distribuir(total: number, n: number, casas: 0 | 2): number[] {
  const fator = Math.pow(10, casas);
  const pesos = Array.from({ length: n }, (_, i) => 1 + 0.35 * Math.sin(i * 1.7));
  const somaPesos = pesos.reduce((a, b) => a + b, 0);

  const partes: number[] = [];
  let acumulado = 0;
  for (let i = 0; i < n - 1; i++) {
    const parte = Math.round((total * pesos[i]) / somaPesos * fator) / fator;
    partes.push(parte);
    acumulado = Math.round((acumulado + parte) * fator) / fator;
  }
  partes.push(Math.round((total - acumulado) * fator) / fator);
  return partes;
}

/** 2025 completo (3.355 carros) — base do comparativo com o ano anterior. */
const METAS_2025: MetaMensal[] = [
  { mes: 1, fichas: 4, carros: 210, liquido: 3150 },
  { mes: 2, fichas: 4, carros: 190, liquido: 2850 },
  { mes: 3, fichas: 5, carros: 260, liquido: 3900 },
  { mes: 4, fichas: 5, carros: 250, liquido: 3750 },
  { mes: 5, fichas: 6, carros: 330, liquido: 4950 },
  { mes: 6, fichas: 5, carros: 280, liquido: 4200 },
  { mes: 7, fichas: 5, carros: 270, liquido: 4050 },
  { mes: 8, fichas: 5, carros: 285, liquido: 4275 },
  { mes: 9, fichas: 5, carros: 275, liquido: 4125 },
  { mes: 10, fichas: 6, carros: 300, liquido: 4500 },
  { mes: 11, fichas: 6, carros: 320, liquido: 4800 },
  { mes: 12, fichas: 7, carros: 385, liquido: 5775 },
];

function gerarMeses(ano: number, metas: MetaMensal[]): FichaSpec[] {
  const specs: FichaSpec[] = [];

  for (const meta of metas) {
    const carros = distribuir(meta.carros, meta.fichas, 0);
    const liquidos = distribuir(meta.liquido, meta.fichas, 2);
    const diasNoMes = new Date(ano, meta.mes, 0).getDate();

    for (let i = 0; i < meta.fichas; i++) {
      const dia = Math.max(1, diasNoMes - i * 2);
      specs.push({
        data: `${ano}-${String(meta.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
        unidadeId: OPTUM,
        turno: i % 4 === 3 ? 'noite' : 'dia',
        carros: carros[i],
        liquido: liquidos[i],
      });
    }
  }

  return specs;
}

export const FICHAS_SEED: Ficha[] = [...JUNHO, ...gerarMeses(2026, METAS_MENSAIS), ...gerarMeses(2025, METAS_2025)]
  .map((spec, i) => montarFicha(i + 1, spec))
  .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);


/* -------------------------------------------------------------------------
   Despesas registradas
   ------------------------------------------------------------------------- */

const DESPESAS_DESTAQUE: Omit<Despesa, 'id'>[] = [
  { data: '2026-06-07', unidadeId: MANIFESTO, categoria: 'Seguro', descricao: 'Seguro veicular mensal', valor: 1000 },
  { data: '2026-06-06', unidadeId: OPTUM, categoria: 'Seguro', descricao: 'Seguro do estabelecimento', valor: 1000 },
  { data: '2026-06-06', unidadeId: OPTUM, categoria: 'Manutenção', descricao: 'Conserto casa de máquinas', valor: 920 },
  { data: '2026-06-05', unidadeId: OPTUM, categoria: 'Aluguel', descricao: 'Aluguel do terreno', valor: 4000 },
  { data: '2026-06-05', unidadeId: OPTUM, categoria: 'Outros', descricao: 'Honorários da contadora', valor: 280 },
];

const MODELOS_DESPESA: { categoria: CategoriaDespesa; descricao: string; valor: number }[] = [
  { categoria: 'Aluguel', descricao: 'Aluguel do terreno', valor: 4000 },
  { categoria: 'Seguro', descricao: 'Seguro do estabelecimento', valor: 1000 },
  { categoria: 'Manutenção', descricao: 'Manutenção elétrica', valor: 640 },
  { categoria: 'Outros', descricao: 'Material de limpeza', valor: 180 },
  { categoria: 'Manutenção', descricao: 'Troca de cancela automática', valor: 1250 },
  { categoria: 'Outros', descricao: 'Honorários da contadora', valor: 280 },
  { categoria: 'Seguro', descricao: 'Seguro veicular mensal', valor: 1000 },
  { categoria: 'Outros', descricao: 'Uniformes da equipe', valor: 420 },
  { categoria: 'Outros', descricao: 'Água e energia', valor: 300 },
];

/** Lançamentos que completam junho: 7.200 em destaque + 1.220 = 8.420. */
const DESPESAS_JUNHO: { categoria: CategoriaDespesa; descricao: string; valor: number }[] = [
  { categoria: 'Manutenção', descricao: 'Reparo no portão de entrada', valor: 920 },
  { categoria: 'Outros', descricao: 'Água e energia', valor: 300 },
];

function gerarDespesas(): Despesa[] {
  const lista: Despesa[] = DESPESAS_DESTAQUE.map((d, i) => ({ ...d, id: i + 1 }));
  let id = lista.length + 1;

  for (let mes = 1; mes <= 6; mes++) {
    const modelos = mes === 6 ? DESPESAS_JUNHO : null;
    const quantidade = modelos ? modelos.length : 7;

    for (let i = 0; i < quantidade; i++) {
      const modelo = modelos ? modelos[i] : MODELOS_DESPESA[(mes + i) % MODELOS_DESPESA.length];
      const dia = Math.min(28, 3 + i * 4);
      lista.push({
        id: id++,
        data: `2026-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
        unidadeId: i % 3 === 0 ? MANIFESTO : OPTUM,
        categoria: modelo.categoria,
        descricao: modelo.descricao,
        valor: modelo.valor,
      });
    }
  }

  return lista.sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

export const DESPESAS_SEED: Despesa[] = gerarDespesas();
