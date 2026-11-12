# ParkFlash

Frontend Angular 19 (standalone components + signals) para gestão de estacionamento,
com layout desktop (sidebar) e mobile (bottom navigation).

## Rodando

```bash
npm install
npm start          # http://localhost:4200
npm run build      # build de produção
```

Na tela de login, qualquer senha com 4+ caracteres entra. O e-mail escolhe o usuário
da sessão — use `lucasrodrigues.10@icloud.com` para entrar como Proprietário.

## Stack

| Item | Escolha |
|---|---|
| Framework | Angular 19, standalone components, `signal` / `computed`, controle de fluxo `@if`/`@for` |
| Estilo | SCSS próprio com design tokens em `src/styles.scss` |
| Gráficos | Chart.js 4 via `<pf-chart>` |
| Responsivo | `BreakpointObserver` do `@angular/cdk` (`LayoutService`) |
| Formulários | Reactive Forms com `FormArray` e validador cruzado |
| Rotas | Lazy loading por tela + `authGuard` / `guestGuard` |

Não foram usados Angular Material, Tailwind nem `@angular/flex-layout`: o briefing
especifica medidas e cores exatas, que saem mais diretas com tokens CSS próprios,
sem sobrescrever um tema de terceiros. `@angular/flex-layout` está descontinuado —
o mesmo resultado sai de CSS Grid/Flexbox.

## Estrutura

```
src/app/
├── core/
│   ├── guards/       authGuard, guestGuard
│   ├── models/       Ficha, Manobrista, Socio, Despesa, Unidade, Usuario
│   └── services/     stores em signals + cálculos puros (calc.ts) + seed
├── shared/
│   ├── charts/       wrapper do Chart.js e tema dos gráficos
│   ├── components/   sidebar, bottom-nav, kpi-card, page-header, modal, confirm, icon, logo
│   └── pipes/        currencyBr, numeroBr, dataBr
├── layouts/          AppLayout (alterna sidebar × bottom nav)
└── features/         uma pasta por tela
```

## Dados

Os dados são de demonstração e ficam em `core/services/seed.ts`, persistidos em
`localStorage` conforme você edita (excluir a chave `parkflash.*` restaura o seed).

**Nenhum indicador é fixo em tela.** Todo KPI, gráfico e total é derivado das mesmas
fichas, então filtrar uma tela recalcula tudo e as telas nunca se contradizem. As
fichas de junho/2026 são exatamente as do briefing; janeiro a maio são geradas para
reproduzir a tabela de "Carros por Mês". Cada ficha fecha na fórmula
`dinheiro + cartão líquido − diárias − despesas`.

Com isso, estes números do briefing aparecem idênticos em tela:

- Dashboard: R$ 25.600,00 bruto · 8 fichas · 464 carros · R$ 5.377,25 líquido ·
  despesas R$ 8.420,00 · melhor dia "Sexta-feira"
- Divisão de Lucro (Junho/Optum): R$ 5.361,25 · 3 sócios · 4 fichas ·
  R$ 2.144,50 / R$ 1.072,25 / R$ 2.144,50
- Fichas e Relatórios: todas as linhas de junho, com a coluna de despesas
  (R$ 1.682,00, R$ 3.883,25, R$ 540,00, R$ 8.427,00, R$ 1.508,50)
- Carros por Mês: a tabela de janeiro a maio, linha a linha

Alguns totais do briefing eram incompatíveis entre si (por exemplo, "2.246 carros"
aparece como total geral na tela de Fichas e como total só de maio em Carros por Mês;
e a soma da tabela mensal dá 4.160, não 8.420). Nesses casos vale o valor calculado,
para que as telas fechem entre si. Os cards de resumo refletem sempre o filtro ativo.

## Cores dos gráficos

A paleta categórica (`shared/charts/chart-theme.ts`) foi validada para daltonismo
— separação mínima ΔE 9.2 em deutan/protan/tritan considerando todos os pares.
Séries únicas usam uma única matiz azul, com o passo mais escuro destacando o
mês recorde. Toda identidade também aparece em texto (legenda e detalhamento),
nunca só na cor.

## Cálculos

Centralizados em `core/services/calc.ts`:

```
totalCarros     = fichaFim − fichaInício − canceladas
taxaDescontada  = valorCartão × (taxa / 100)
líquidoCartão   = valorCartão − taxaDescontada
saldoFinal      = dinheiro + líquidoCartão − totalDiárias − totalDespesas
divisãoSócio    = saldoFinal × (percentual / 100)
```

## Detalhes de implementação

- **Nova ficha**: no desktop é formulário único com resumo fixo na lateral; no mobile,
  stepper de 5 etapas com validação por etapa. Os dois usam o mesmo `FormGroup`.
- **Exportar PDF** (Relatórios) usa a caixa de impressão do navegador ("Salvar como PDF").
  `src/styles.scss` tem o bloco `@media print` que remove navegação e filtros.
- **Sócios** valida que o rateio de cada unidade some 100% e mostra a prévia do
  fechamento antes de salvar; unidade sem sócios aparece como "sem rateio", não como erro.
- **Manobristas**: dias trabalhados e total recebido vêm das fichas do mês, não do cadastro.
- O usuário logado não consegue excluir a própria conta.
# ParkFlash
