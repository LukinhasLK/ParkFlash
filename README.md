# ParkFlash

Sistema de gestão de estacionamento: front end Angular 19 (standalone components + signals),
com layout desktop (sidebar) e mobile (bottom navigation), e back end Java (Spring Boot 3)
em [`backend/`](backend).

## Rodando

Precisa de Java 17+ e Node 18+. Abra dois terminais:

```bash
# 1) back end — http://localhost:8080 (Swagger em /swagger-ui.html)
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run

# 2) front end — http://localhost:4200
npm install
npm start
```

O `npm start` usa o `proxy.conf.json`, que encaminha `/api` para a porta 8080 (sem problema de CORS).

```bash
npm run build                 # build de produção do front
npm test                      # testes do front (Karma + Jasmine)
cd backend && ./mvnw test     # testes do back end (JUnit + MockMvc)
```

### Login de demonstração

Todos os usuários de demonstração usam a senha `123456` (troque em **Meu perfil**):

| Usuário | Nível | Acesso |
|---|---|---|
| `lucasrodrigues.10@icloud.com` | Proprietário | tudo |
| `pedro@email.com` | Gerente | tudo, menos Sócios, Usuários e Divisão de Lucro |
| `dario@email.com` | Operador | Fichas (lançar), Manobristas e Meu perfil |

As permissões valem **no servidor** (Spring Security, por nível). No front, `core/services/permissoes.ts`
e o `roleGuard` só escondem do menu e das rotas o que o nível não pode abrir.

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
│   ├── guards/       authGuard, guestGuard, roleGuard
│   ├── interceptors/ authInterceptor (envia o JWT; 401 encerra a sessão)
│   ├── models/       Ficha, Manobrista, Socio, Despesa, Unidade, Usuario
│   └── services/     stores em signals que falam com a API + cálculos puros (calc.ts)
├── shared/
│   ├── charts/       wrapper do Chart.js e tema dos gráficos
│   ├── components/   sidebar, bottom-nav, kpi-card, page-header, modal, confirm, icon, logo
│   └── pipes/        currencyBr, numeroBr, dataBr
├── layouts/          AppLayout (alterna sidebar × bottom nav)
└── features/         uma pasta por tela

backend/src/main/java/com/parkflash/
├── dominio/          entidades JPA (Unidade, Manobrista, Usuario, Socio, Ficha, Despesa…)
├── repositorio/      Spring Data JPA
├── servico/          regras de negócio + CalculoFicha (BigDecimal)
├── seguranca/        JWT (JwtService, FiltroJwt)
├── config/           Spring Security, CORS, Swagger
├── erro/             respostas de erro padronizadas
└── web/              controllers REST + DTOs
```

## Dados

Os dados ficam no banco do back end. Por padrão é um H2 em arquivo (`backend/data/`), criado pelo
Flyway na primeira execução com os dados de demonstração (`db/demo/V2__dados_demonstracao.sql`).
Apagar a pasta `backend/data/` restaura a demonstração. O navegador guarda apenas o token
de sessão (`parkflash.v3.token`); nada de senhas ou dados no `localStorage`.

Fichas, despesas e sócios guardam `unidadeId`/`manobristaId` (não o nome), então renomear
uma unidade ou manobrista não quebra o histórico. Unidade ou manobrista com fichas/despesas
lançadas não pode ser excluído.

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

## Back end (Java)

| Item | Escolha |
|---|---|
| Framework | Spring Boot 3.5 (Java 17), Maven (wrapper `mvnw` incluído) |
| Banco | H2 em arquivo para desenvolvimento; PostgreSQL com o perfil `postgres` |
| Persistência | Spring Data JPA + migrações Flyway (`db/migration`) |
| Segurança | Spring Security, JWT assinado (JJWT), senhas com BCrypt, permissões por nível |
| Documentação | Swagger UI em `http://localhost:8080/swagger-ui.html` |
| Testes | JUnit 5 + MockMvc (cálculos, login, permissões e regras de negócio) |

**Segurança:** o login (`POST /api/auth/login`) devolve um JWT assinado. Em cada requisição o
servidor valida a assinatura e recarrega o usuário do banco, então editar o token ou o
`localStorage` não dá acesso a nada, e um usuário excluído perde o acesso na hora. As senhas são
guardadas só como hash BCrypt e nunca saem na API.

**Regras no servidor:** o back end recalcula total de carros, bruto, taxa da maquininha e líquido
de cada ficha (com `BigDecimal`, arredondando para 2 casas) e ignora os totais enviados pelo
front. Ele também bloqueia ficha duplicada (data + unidade + turno), manobrista repetido na
ficha, e-mail repetido e exclusão de unidade/manobrista com histórico.

### Endpoints

| Método e rota | Quem pode |
|---|---|
| `POST /api/auth/login` · `GET /api/auth/me` · `PUT /api/auth/senha` | público (login) / logado |
| `GET /api/fichas`, `/unidades`, `/manobristas`, `/socios` | todos os níveis |
| `POST /api/fichas`, `POST/PUT /api/manobristas` | todos os níveis |
| `PUT/DELETE /api/fichas/{id}`, CRUD `/api/unidades`, `/api/despesas`, `DELETE /api/manobristas/{id}` | Gerente e Proprietário |
| `GET /api/relatorios/resumo?ano=&mes=&unidadeId=` | Gerente e Proprietário |
| CRUD `/api/usuarios`, `POST/PUT/DELETE /api/socios`, `GET /api/relatorios/divisao-lucro?ano=&mes=&unidadeId=` | Proprietário |

Erros voltam como `{ "status", "mensagem", "campos" }` (400 validação, 401 sem login,
403 sem permissão, 404 não encontrado, 409 conflito); o front mostra a `mensagem` num aviso.

### Configuração

| Variável | Padrão | Uso |
|---|---|---|
| `JWT_SEGREDO` | segredo de desenvolvimento | **obrigatório no perfil `postgres`** (mínimo 32 caracteres) |
| `JWT_EXPIRACAO` | `8h` | validade do token |
| `CORS_ORIGENS` | `http://localhost:4200` | origens liberadas |
| `PORT` | `8080` | porta do servidor |
| `FLYWAY_LOCATIONS` | `classpath:db/migration,classpath:db/demo` | use só `classpath:db/migration` para começar sem dados de demonstração |
| `ADMIN_EMAIL` / `ADMIN_SENHA` / `ADMIN_NOME` | — | se o banco começar sem usuários, cria o primeiro Proprietário |
| `DB_URL` / `DB_USUARIO` / `DB_SENHA` | `jdbc:postgresql://localhost:5432/parkflash` | só no perfil `postgres` |

Para usar PostgreSQL:

```bash
createdb parkflash
cd backend
SPRING_PROFILES_ACTIVE=postgres JWT_SEGREDO=um-segredo-longo-com-32-caracteres-ou-mais \
  DB_USUARIO=postgres DB_SENHA=sua-senha ./mvnw spring-boot:run
```

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
lucroFichas     = Σ saldoFinal das fichas do período
resultado       = lucroFichas − despesas fixas (tela Despesas: aluguel, seguro...)
divisãoSócio    = resultado da unidade × (percentual / 100)
```

Dashboard, Relatórios e Divisão de Lucro mostram as três linhas (lucro das fichas,
despesas fixas e resultado). Os testes de `calc.ts`, `periodo.ts`, permissões, máscaras,
`FichasService` e `AuthService` ficam nos `*.spec.ts` ao lado de cada arquivo.

## Detalhes de implementação

- **Nova ficha**: no desktop é formulário único com resumo fixo na lateral; no mobile,
  stepper de 5 etapas com validação por etapa. Os dois usam o mesmo `FormGroup`.
- **Exportar PDF** (Relatórios) usa a caixa de impressão do navegador ("Salvar como PDF").
  `src/styles.scss` tem o bloco `@media print` que remove navegação e filtros.
- **Sócios** valida que o rateio de cada unidade some 100% e mostra a prévia do
  fechamento antes de salvar; unidade sem sócios aparece como "sem rateio", não como erro.
- **Manobristas**: dias trabalhados e total recebido vêm das fichas do mês, não do cadastro.
- O usuário logado não consegue excluir a própria conta.
- **Editar**: fichas (`/app/fichas/:id/editar`, Gerente/Proprietário) e despesas.
- **Validações da ficha**: bloqueia ficha duplicada (mesma data, unidade e turno) e
  manobrista repetido; ao enviar com erro, a tela rola até o primeiro campo inválido.
- **Datas** usam o fuso local (`hojeIso()`), não UTC.
- **CPF e telefone** têm máscara (`pfMascara`) e validação de dígitos.
- O sino do Dashboard lista alertas reais (rateio ≠ 100%, fichas ou mês no prejuízo).
# ParkFlash
