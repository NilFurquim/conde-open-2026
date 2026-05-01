# CONDE OPEN 2026 — Design Reference

## Visão Geral

App web **mobile-first** para gerenciar o Torneio de Tênis Conde Open 2026.
Deployado via **Google AI Studio** (React + Vite + Firebase Firestore).
Sem backend próprio — tudo roda no cliente com Firestore como persistence layer.

## Objetivos do App

1. Jogadores agendam seus jogos e veem até quando devem fazê-lo
2. Jogadores veem quando outros jogos acontecerão
3. Jogadores registram resultados das partidas
4. Jogadores acompanham evolução própria e dos demais no torneio

## Decisões Técnicas Críticas

- **Stack**: React + TypeScript + Vite + Tailwind CSS + Firebase Firestore
- **Deploy**: Google AI Studio (sem backend customizado)
- **Auth**: Estático — usuário pesquisa e seleciona seu nome. Sem Google OAuth, sem senha
- **Persistência**: Firebase Firestore (já configurado via `firebase-blueprint.json`)
- **Histórico**: Todas as versões de resultados e agendamentos devem ser salvas (audit trail)

## Modelo de Usuário / Perfis

| Perfil | Acesso |
|--------|--------|
| **guest** | Visualizar apenas (sem login) |
| **player** | Visualiza tudo + edita apenas seus próprios jogos |
| **admin** | Visualiza e edita tudo (horários, resultados, deadlines) — nome: `Organizador` |

**Login**: Usuário escolhe seu nome na lista. Se nome = `"Organizador"` → role `admin`. Dados salvos em `localStorage`.

**Restrição de edição de resultados**: Só é possível até o final da rodada (deadline definido pelo admin). Admin pode editar a qualquer momento.

**Contato com adversário**: Sempre via link para WhatsApp (não email, não chat interno).

---

## Estrutura de Rotas

```
/login       → Seleção de perfil
/            → Home (dashboard pessoal)
/agenda      → Agendamento de jogos
/chaves      → Chaves / brackets por categoria
/regras      → Regras do torneio
/match/:id   → Detalhe e edição de partida
```

---

## Categorias e Regras Completas

### CATEGORIA A — Simples Masculino/Misto (16 jogadores)

**Formato**: 4 grupos × 4 jogadores → mata-mata (Quartas, Semi, Final)
**Classificação**: 2 primeiros de cada grupo

#### Grupos

| Grupo 1 (Verde) | Grupo 2 (Azul) | Grupo 3 (Amarelo) | Grupo 4 (Roxo) |
|-----------------|----------------|-------------------|----------------|
| Pedro | Alex | Thales | Allan |
| Fernando | Osvaldo | Ícaro | Carol |
| Amauri | Paulo | Solera | Lamega |
| Saito | Gustavo | Jeff | Adriano |

#### Chave Mata-Mata

**Quartas de Final**
- Jogo 1: 1º G1 vs 2º G2
- Jogo 2: 1º G2 vs 2º G1
- Jogo 3: 1º G3 vs 2º G4
- Jogo 4: 1º G4 vs 2º G3

**Semifinais**
- Jogo 5: Vencedor J1 vs Vencedor J2
- Jogo 6: Vencedor J3 vs Vencedor J4

**Final**
- Jogo 7: Vencedor J5 vs Vencedor J6

> **Lógica**: 1º de um grupo enfrenta 2º do grupo "parceiro" (G1↔G2, G3↔G4) para que os melhores do mesmo grupo só se reencontrem na semifinal.

---

### CATEGORIA B — Simples (24 jogadores, 6 grupos)

**Formato**: 6 grupos × 4 jogadores → Oitavas, Quartas, Semi, Final
**Classificação**: 2 primeiros de cada grupo + 4 melhores 3º colocados (ranking geral de terceiros)
**Total na fase mata-mata**: 16 jogadores

#### Grupos

| Grupo 1 (Verde) | Grupo 2 (Azul) | Grupo 3 (Amarelo) | Grupo 4 (Roxo) | Grupo 5 (Rosa) | Grupo 6 (Ciano) |
|-----------------|----------------|-------------------|----------------|----------------|-----------------|
| Adriano | Lamega | Fernando | Saito | Osvaldo | Paulo |
| Alexandre | Marcos | Xico | Wilder | João Pedro | Matera |
| Evandro | Renato | Fortes | Roberto | Silvio | Flavia |
| Cesar | Aninha | JC | Guto | Carla | Nil |

#### Chave Mata-Mata

**Oitavas de Final** *(cruzamentos pré-definidos)*
- J1: 1º G1 vs **Melhor 3º #2**
- J2: 1º G2 vs 2º G5
- J3: 1º G3 vs **Melhor 3º #3**
- J4: 1º G4 vs 2º G1
- J5: 1º G5 vs 2º G6
- J6: 1º G6 vs **Melhor 3º #1**
- J7: 2º G3 vs 2º G2
- J8: 2º G4 vs **Melhor 3º #4**

**Quartas de Final**
- J9: Venc J1 vs Venc J8
- J10: Venc J2 vs Venc J7
- J11: Venc J3 vs Venc J6
- J12: Venc J4 vs Venc J5

**Semifinais**
- J13: Venc J9 vs Venc J12
- J14: Venc J10 vs Venc J11

**Final**
- J15: Venc J13 vs Venc J14

> **Lógica dos melhores 3ºs**: Ranquear todos os 3º colocados dos 6 grupos pelo sistema de pontos (vitórias, saldo de games). Os 4 melhores entram nas oitavas nos slots #1, #2, #3, #4.

---

### CATEGORIA C — Simples (8 jogadores, 2 grupos)

**Formato**: 2 grupos × 4 jogadores → Semi, Final (sem quartas)
**Classificação**: 2 primeiros de cada grupo

#### Grupos

| Grupo 1 (Verde) | Grupo 2 (Azul) |
|-----------------|----------------|
| João Pedro | Marcos |
| Eduardo | Rodrigo |
| Nil | Dudu |
| Junior | Alexandre |

#### Chave Mata-Mata

**Semifinais** *(cruzamento cruzado)*
- J1: 1º G1 vs 2º G2
- J2: 1º G2 vs 2º G1

**Final**
- J3: Vencedor J1 vs Vencedor J2

> **Estrutura mais simples**: fase de grupos direto para semi/final.

---

### CATEGORIA DUPLAS — 13 duplas (eliminatória direta com Play-in)

**Formato**: Play-in (10 duplas) → Quartas (8 duplas, 3 com BYE) → Semi → Final
**Sem fase de grupos**

#### Duplas Participantes

| ID | Dupla | Status |
|----|-------|--------|
| t1 | Pedro / Carla | Play-in |
| t2 | Igor / Fortes | Play-in |
| t3 | Paulo / Osvaldo | Play-in |
| t4 | Thales / Marcos | Play-in |
| t5 | Adriano / Matera | Play-in |
| t6 | Matheus / Xico | Play-in |
| t7 | Icaro / Rodrigo | Play-in |
| t8 | Allan / Aninha | Play-in |
| t9 | Gustavo / Joao Pedro | Play-in |
| t10 | Lamega / Alexandre | Play-in |
| t11 | Amauri / Guto | **BYE** → direto Quartas (Chave Verde) |
| t12 | Alex / Evandro | **BYE** → direto Quartas (Chave Amarela) |
| t13 | Saito / Fernando | **BYE** → direto Quartas (Chave Rosa) |

#### Play-in (Rodada 1)

- J1: Pedro/Carla vs Igor/Fortes
- J2: Paulo/Osvaldo vs Thales/Marcos
- J3: Adriano/Matera vs Matheus/Xico
- J4: Icaro/Rodrigo vs Allan/Aninha
- J5: Gustavo/Joao Pedro vs Lamega/Alexandre

#### Quartas de Final

- J6: Amauri/Guto vs Venc J1
- J7: Venc J2 vs Venc J3
- J8: Alex/Evandro vs Venc J4
- J9: Saito/Fernando vs Venc J5

#### Semifinais

- J10: Venc J6 vs Venc J7
- J11: Venc J8 vs Venc J9

#### Final

- J12: Venc J10 vs Venc J11

---

## Regras de Negócio

### Agendamento de Jogos

- Cada jogo tem um **prazo (deadline)** definido pelo admin
- Qualquer um dos dois jogadores/duplas pode agendar o horário
- O jogador oposto vê o agendamento e pode contatar via **WhatsApp**
- Admin pode editar qualquer agendamento

### Registro de Resultados

- Apenas os participantes do jogo podem registrar resultado (ou admin)
- Edição permitida somente até o **final da rodada** (deadline definido pelo admin)
- Admin pode editar resultado mesmo após o deadline
- Todas as versões do resultado são salvas (histórico/audit trail)

### Pontuação (fase de grupos)

Sistema padrão de torneio:
- Vitória: 2 pontos
- Derrota: 0 pontos
- W.O.: registrado como derrota do ausente

**Critérios de desempate** (em ordem):
1. Pontos
2. Confronto direto
3. Saldo de sets
4. Saldo de games

---

## Estrutura de Dados (Firestore)

```
/matches/{matchId}
  category: "A" | "B" | "C" | "Duplas"
  round: "group" | "playin" | "quarters" | "semis" | "final"
  group?: "1" | "2" | "3" | "4" | "5" | "6"
  p1: string          // nome do jogador/dupla
  p2: string
  participants: string[]  // todos os nomes envolvidos (para queries)
  score1?: number[]   // ex: [6, 4, 6]
  score2?: number[]   // ex: [3, 6, 3]
  tiebreak1?: number
  tiebreak2?: number
  winner?: string
  status: "pending" | "scheduled" | "completed"
  scheduledAt?: Timestamp
  court?: string
  deadline?: Timestamp
  updatedAt: Timestamp
  updatedBy: string   // nome do player ou "admin"
  history?: MatchEdit[]  // array com versões anteriores

/settings/global
  currentRoundDeadline: Timestamp
  adminEmails: string[]   // não usado, admin é "Organizador"
```

---

## UI / UX Guidelines

- **Mobile-first**: layout máx 480px, sem sidebar
- **Bottom navigation** com 4 tabs: Home, Agenda, Chaves, Regras
- **Cores por categoria**:
  - Cat A: azul (`blue-600`)
  - Cat B: verde (`green-600`)
  - Cat C: roxo (`purple-600`)
  - Duplas: laranja (`orange-600`)
- **Cores por grupo** (dentro de cada categoria): verde, azul, amarelo, roxo, rosa, ciano
- Cards de jogo mostram: jogadores, data/hora agendada, placar (se concluído), deadline
- Botão de WhatsApp: `https://wa.me/55{numero}` — deve aparecer no detalhe do jogo

---

## Estado Atual do Código

| Arquivo | Status |
|---------|--------|
| `src/App.tsx` | ✅ Rotas configuradas |
| `src/contexts/AuthContext.tsx` | ✅ Login estático por nome + localStorage |
| `src/constants/tournamentData.ts` | ✅ Todos os jogadores e duplas cadastrados |
| `src/types.ts` | ✅ Tipos base definidos |
| `src/pages/Login.tsx` | ✅ Busca por nome, entrada como convidado |
| `src/pages/Home.tsx` | 🔧 Implementado parcialmente |
| `src/pages/Agenda.tsx` | 🔧 Implementado parcialmente |
| `src/pages/Brackets.tsx` | 🔧 Implementado parcialmente |
| `src/pages/MatchDetail.tsx` | 🔧 Implementado parcialmente |
| `src/pages/Rules.tsx` | 🔧 Implementado parcialmente |
| `src/components/MatchCard.tsx` | 🔧 Existe |
| `src/components/Layout.tsx` | 🔧 Existe |
| `src/lib/firebase.ts` | ✅ Firebase configurado |

### Jogadores Cadastrados Completos

**Cat A (16)**: Pedro, Fernando, Amauri, Saito, Alex, Osvaldo, Paulo, Gustavo, Thales, Ícaro, Solera, Jeff, Allan, Carol, Lamega, Adriano

**Cat B (24)**: Adriano, Alexandre, Evandro, Cesar, Lamega, Marcos, Renato, Aninha, Fernando, Xico, Fortes, JC, Saito, Wilder, Roberto, Guto, Osvaldo, João Pedro, Silvio, Carla, Paulo, Matera, Flavia, Nil

**Cat C (8)**: João Pedro, Eduardo, Nil, Junior, Marcos, Rodrigo, Dudu, Alexandre

**Duplas (26 jogadores)**: Pedro, Carla, Igor, Fortes, Paulo, Osvaldo, Thales, Marcos, Adriano, Matera, Matheus, Xico, Icaro, Rodrigo, Allan, Aninha, Gustavo, Joao Pedro, Lamega, Alexandre, Amauri, Guto, Alex, Evandro, Saito, Fernando

> Vários jogadores participam de **múltiplas categorias** (ex: Adriano está em Cat A, Cat B e Duplas). O login é por nome e o app mostra os jogos de todas as categorias em que o jogador está inscrito.
