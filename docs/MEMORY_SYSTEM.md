# DevFlow Memory System - Contexto Organizado

## Problema: Perda de Contexto

À medida que o projeto cresce, surgem problemas:
- ❌ Snapshots muito grandes (difícil de carregar)
- ❌ Contexto espalhado em múltiplos arquivos
- ❌ IA não sabe o que é importante agora
- ❌ Decisões antigas são esquecidas
- ❌ Histórico poluído com informações irrelevantes

---

## Solução: Sistema de Memória em Camadas

### Arquitetura de 3 Camadas

```
┌─────────────────────────────────────┐
│   ACTIVE MEMORY (Quente)           │  ← Carregado SEMPRE
│   - Último snapshot                 │
│   - ADRs ativos (não superseded)    │
│   - Stories em progresso            │
│   - Decisões recentes (30 dias)     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   WORKING MEMORY (Morno)            │  ← Carregado quando relevante
│   - Snapshots últimos 3 meses       │
│   - ADRs superseded com context     │
│   - Stories concluídas recentes     │
│   - Features implementadas          │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   ARCHIVE MEMORY (Frio)             │  ← Indexado, busca sob demanda
│   - Snapshots antigos (>3 meses)    │
│   - ADRs deprecated                 │
│   - Stories antigas                 │
│   - Logs históricos                 │
└─────────────────────────────────────┘
```

---

## Implementação

### 1. Active Memory (Sempre Carregado)

**Arquivo**: `.devflow/memory/active.json`

```json
{
  "version": "1.0.0",
  "updated_at": "2025-12-17T10:00:00Z",
  "project": {
    "name": "meu-projeto",
    "version": "1.2.0",
    "phase": "development"
  },

  "current_focus": {
    "sprint": "Sprint 12",
    "goals": [
      "Implementar autenticação",
      "Otimizar performance"
    ],
    "active_stories": ["STORY-042", "STORY-043"]
  },

  "recent_decisions": [
    {
      "id": "ADR-015",
      "title": "Escolha PostgreSQL",
      "date": "2025-12-10",
      "status": "accepted",
      "impact": "high"
    }
  ],

  "active_features": [
    {
      "name": "authentication",
      "status": "in_progress",
      "agent": "@builder",
      "last_update": "2025-12-15"
    }
  ],

  "tech_stack": {
    "backend": "Node.js + Express",
    "frontend": "React",
    "database": "PostgreSQL",
    "hosting": "AWS"
  },

  "critical_constraints": [
    "LGPD compliance obrigatório",
    "Response time < 200ms",
    "99.9% uptime SLA"
  ]
}
```

**Tamanho**: ~10-20KB (carrega em <100ms)

---

### 2. Context Index (Busca Rápida)

**Arquivo**: `.devflow/memory/index.json`

```json
{
  "adrs": {
    "ADR-001": {
      "title": "Database Choice",
      "status": "accepted",
      "date": "2025-01-15",
      "tags": ["database", "infrastructure"],
      "file": "docs/decisions/001-database-choice.md"
    },
    "ADR-015": {
      "title": "JWT Authentication",
      "status": "accepted",
      "date": "2025-12-10",
      "tags": ["auth", "security"],
      "file": "docs/decisions/015-jwt-auth.md"
    }
  },

  "stories": {
    "STORY-042": {
      "title": "Login Flow",
      "status": "in_progress",
      "agent": "@builder",
      "file": "docs/planning/stories/042-login-flow.md"
    }
  },

  "snapshots": {
    "2025-12-15": {
      "version": "1.2.0",
      "features_count": 15,
      "file": ".devflow/snapshots/2025-12-15.json"
    }
  }
}
```

**Uso**: Busca O(1) por ID, filtro por tags/status

---

### 3. Session Log (Rastreamento de Decisões)

**Arquivo**: `.devflow/sessions/session-{timestamp}.md`

Cada sessão de trabalho gera um log:

```markdown
# Session: 2025-12-17 10:00-12:00

## Contexto
- Agent: @builder
- Focus: Implementar login JWT
- Related: ADR-015, STORY-042

## Decisões Tomadas
1. Usar bcrypt para hash de senha (10 rounds)
2. Access token: 15min, Refresh token: 7 dias
3. Cookie httpOnly para refresh token

## Código Modificado
- src/auth/login.ts
- src/middleware/auth.ts
- tests/auth.test.ts

## Pendências
- [ ] Implementar rate limiting
- [ ] Adicionar testes E2E
- [ ] Atualizar documentação API

## Próximos Passos
1. @guardian revisar segurança
2. @chronicler documentar em CHANGELOG
```

**Benefício**: Rastreabilidade completa de decisões

---

### 4. Smart Loading Strategy

```typescript
// Pseudocódigo de loading strategy

function loadContext(query: string) {
  // 1. SEMPRE carrega active memory
  const active = loadActiveMemory();

  // 2. Analisa query para decidir contexto adicional
  const relevantTags = extractTags(query);

  // 3. Carrega working memory APENAS se relevante
  let working = null;
  if (needsHistoricalContext(query, relevantTags)) {
    working = loadWorkingMemory(relevantTags);
  }

  // 4. Busca archive APENAS se explicitamente solicitado
  let archive = null;
  if (query.includes("histórico") || query.includes("quando")) {
    archive = searchArchive(query);
  }

  return { active, working, archive };
}
```

---

## Regras de Organização

### 1. Snapshot Rotation

```bash
# Estrutura de snapshots
.devflow/snapshots/
├── active/
│   └── latest.json              # Snapshot atual (sempre carregado)
├── recent/
│   ├── 2025-12-15.json         # Últimos 3 meses
│   ├── 2025-12-10.json
│   └── 2025-12-01.json
└── archive/
    └── 2025/
        └── Q1/
            ├── 2025-01-15.json  # Arquivados por trimestre
            └── 2025-02-28.json
```

**Regra**:
- Snapshot novo → `active/latest.json`
- Snapshot >7 dias → move para `recent/`
- Snapshot >90 dias → move para `archive/YYYY/QN/`

---

### 2. ADR Lifecycle

```yaml
# Em cada ADR
status: "proposed"    # Initial
  ↓
status: "accepted"    # Implementado → vai para active.json
  ↓
status: "superseded"  # Substituído → remove de active, add link
  ↓
status: "deprecated"  # Não mais usado → vai para archive
```

**Regra**: Active memory só carrega ADRs com `status: "accepted"`

---

### 3. Context Compression

Para snapshots antigos, comprimir informação:

```json
// Snapshot completo (recent)
{
  "features": [
    {
      "name": "authentication",
      "description": "Sistema completo de autenticação...",
      "implementation": "JWT com refresh tokens...",
      "files": ["src/auth/login.ts", "src/auth/refresh.ts"],
      "tests": ["tests/auth.test.ts"],
      "decisions": ["ADR-015"],
      "status": "completed"
    }
  ]
}

// Snapshot comprimido (archive)
{
  "features": [
    {
      "name": "authentication",
      "status": "completed",
      "decision": "ADR-015",
      "completed_at": "2025-11-15"
    }
  ]
}
```

**Redução**: ~70-80% de tamanho

---

## Comandos para Gerenciar Memória

### 1. Snapshot Strategy

```bash
# Criar snapshot (automático via @chronicler)
@chronicler criar snapshot

# Compactar snapshots antigos
./devflow-compress-snapshots.sh
```

### 2. Context Queries

```bash
# Ver contexto ativo
/devflow-status

# Buscar decisão antiga
/devflow-search ADR autenticação

# Ver histórico de feature
/devflow-history authentication
```

---

## Metadata para Busca Rápida

**Arquivo**: `.devflow/memory/metadata.yaml`

```yaml
# Metadata estruturado para busca O(1)

by_tag:
  authentication:
    - ADR-015
    - STORY-042
    - STORY-043

  database:
    - ADR-001
    - STORY-010

by_agent:
  builder:
    last_active: "2025-12-17"
    current_tasks: ["STORY-042"]

  architect:
    last_active: "2025-12-15"
    recent_decisions: ["ADR-015"]

by_status:
  in_progress:
    - STORY-042
    - STORY-043

  completed:
    - STORY-001 ... STORY-041

recent_changes:
  - date: "2025-12-17"
    type: "code"
    agent: "@builder"
    files: ["src/auth/login.ts"]

  - date: "2025-12-15"
    type: "decision"
    agent: "@architect"
    ref: "ADR-015"
```

---

## Implementação Prática

### Fase 1: Active Memory (Essencial)
1. Criar `.devflow/memory/active.json`
2. @chronicler atualiza a cada mudança significativa
3. Carregar active.json em `.claude_project`

### Fase 2: Indexação (Importante)
1. Criar `.devflow/memory/index.json`
2. Script para rebuild index
3. Busca rápida por tags/status

### Fase 3: Session Logs (Rastreabilidade)
1. Criar `.devflow/sessions/`
2. Log automático de decisões
3. Link sessions ↔ ADRs ↔ Stories

### Fase 4: Archive & Compression (Escala)
1. Script de rotação de snapshots
2. Compressão de contexto antigo
3. Busca semântica em archive

---

## Benefícios

| Antes | Depois |
|-------|--------|
| Snapshot gigante (500KB+) | Active memory: 10-20KB |
| Carrega tudo sempre | Smart loading por relevância |
| Contexto espalhado | Centralizado em active.json |
| Decisões esquecidas | Index + tags |
| Sem rastreabilidade | Session logs completos |
| Lento para buscar | Busca O(1) por metadata |

---

## Exemplo Prático

### Query: "Como funciona autenticação?"

**Loading Strategy**:
```
1. Load active.json
   → Vê "authentication" em active_features
   → Vê ADR-015 em recent_decisions

2. Load ADR-015 (working memory)
   → Decisão completa sobre JWT

3. Busca stories relacionadas (index)
   → STORY-042, STORY-043

4. NÃO carrega archive
   → Não é necessário histórico antigo
```

**Contexto carregado**: ~30KB (rápido e relevante)

---

## Scripts de Manutenção

### 1. Rebuild Index
```bash
#!/bin/bash
# devflow-rebuild-index.sh

# Scan ADRs
# Scan Stories
# Scan Snapshots
# Generate index.json
```

### 2. Compress Old Snapshots
```bash
#!/bin/bash
# devflow-compress.sh

# Move snapshots >90 dias para archive/
# Comprimir informação (keep only essentials)
# Update index
```

### 3. Clean Sessions
```bash
#!/bin/bash
# devflow-clean-sessions.sh

# Remove session logs >6 meses
# Merge insights importantes para snapshots
```

---

## Integração com .claude_project

```json
{
  "context": {
    "always_load": [
      ".devflow/memory/active.json",
      ".devflow/memory/index.json"
    ],
    "load_on_demand": [
      ".devflow/memory/metadata.yaml"
    ]
  }
}
```

---

**Resultado**: Contexto sempre relevante, organizado e escalável! 🎯
