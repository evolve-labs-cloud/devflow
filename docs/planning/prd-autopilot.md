# PRD: Autopilot Mode

**Prioridade:** P1 (Alta) | **Complexidade:** 16 pontos | **Sprint:** Enhancement

## 1. Problema

Usuários precisam executar manualmente cada agente em sequência para completar uma feature. Isso é:
- Lento (precisa esperar cada resposta e iniciar próximo)
- Propenso a erros (pode esquecer uma fase)
- Repetitivo (mesmo fluxo para toda feature)

## 2. Solução

**Autopilot Mode**: Execução automática do pipeline DevFlow, onde agentes trabalham em sequência para transformar uma ideia em feature completa.

## 3. User Stories

| ID | Story | Pontos |
|----|-------|--------|
| US-040 | Iniciar Autopilot a partir de uma Spec | 3 |
| US-041 | Visualizar progresso em tempo real | 2 |
| US-042 | Pausar/Resumir execução | 2 |
| US-043 | Configurar checkpoints | 2 |
| US-044 | Ver histórico de execuções | 2 |
| US-045 | Cancelar e rollback | 3 |
| US-046 | Estimar tokens antes de executar | 2 |
| **TOTAL** | | **16** |

## 4. Fluxo do Autopilot

```
┌──────────────────────────────────────────────────────────────┐
│                      AUTOPILOT PIPELINE                       │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  INPUT: Spec/Story ou descrição de feature                   │
│  "Implementar autenticação JWT com refresh tokens"           │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   PHASE 1     │    │   PHASE 2     │    │   PHASE 3     │
│   PLANNING    │───▶│    DESIGN     │───▶│ IMPLEMENTATION│
│  @strategist  │    │  @architect   │    │   @builder    │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
   User Story            ADR criado           Código escrito
   refinada              Arquitetura          Arquivos criados
                         definida
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   PHASE 4     │    │   PHASE 5     │    │    OUTPUT     │
│  VALIDATION   │───▶│ DOCUMENTATION │───▶│   COMPLETE    │
│  @guardian    │    │  @chronicler  │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
   Code review           Docs updated          Feature pronta
   Sugestões             Changelog             Tasks fechadas
```

## 5. UI/UX

### 5.1 Botão de Início

No SpecsPanel, cada Spec terá botão "▶ Autopilot":

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 US-042: Autenticação JWT                          SHOULD │
│ Implementar sistema de autenticação com tokens              │
│                                                             │
│ ████████░░░░░░░░░░░░ 40%  (2/5 tasks)                      │
│                                                             │
│ [▶ Autopilot]  [Open]                                       │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Modal de Configuração

Antes de iniciar, usuário configura:

```
┌─────────────────────────────────────────────────────────────┐
│  🚀 Iniciar Autopilot                                   [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Spec: US-042 - Autenticação JWT                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Fases a executar:                                          │
│  [x] Planning (@strategist)                                 │
│  [x] Design (@architect)                                    │
│  [x] Implementation (@builder)                              │
│  [x] Validation (@guardian)                                 │
│  [x] Documentation (@chronicler)                            │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Checkpoints:                                               │
│  [ ] Pausar para aprovação entre fases                      │
│  [ ] Pausar antes de criar/modificar arquivos               │
│  [x] Pausar em erros ou conflitos                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Estimativa: ~20k tokens | ~3 min                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancelar]  [🚀 Iniciar]       │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Painel de Execução

Durante execução, painel lateral mostra progresso:

```
┌─────────────────────────────────────────────────────────────┐
│  AUTOPILOT                               [⏸ Pause] [⏹ Stop] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 US-042: Autenticação JWT                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ✅ Phase 1: Planning                           12s         │
│     └─ @strategist: Requisitos refinados                    │
│                                                             │
│  ✅ Phase 2: Design                             28s         │
│     └─ @architect: ADR-007 criado                          │
│                                                             │
│  🔄 Phase 3: Implementation                     ...         │
│     ├─ @builder: jwt.service.ts ✅                         │
│     ├─ @builder: auth.middleware.ts 🔄                     │
│     └─ @builder: auth.routes.ts ⏳                          │
│                                                             │
│  ⏳ Phase 4: Validation                                     │
│     └─ @guardian: Aguardando...                            │
│                                                             │
│  ⏳ Phase 5: Documentation                                  │
│     └─ @chronicler: Aguardando...                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ⏱ Tempo: 1m 42s                                           │
│  💰 Tokens: 8.2k / ~20k                                    │
│  🎯 Progresso: 45%                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Checkpoint Modal

Quando pausado em checkpoint:

```
┌─────────────────────────────────────────────────────────────┐
│  ⏸ Checkpoint: Aprovação Necessária                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 2 (Design) foi concluída.                           │
│                                                             │
│  @architect criou:                                          │
│  • docs/decisions/ADR-007-jwt-implementation.md            │
│                                                             │
│  Resumo:                                                    │
│  ─────────────────────────────────────────────────────────  │
│  Decisão de usar RS256 para assinatura de tokens,          │
│  com rotação de chaves a cada 24h. Refresh tokens          │
│  serão armazenados em Redis com TTL de 7 dias.             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Ver arquivo completo]                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [✏️ Editar antes]  [⏭ Pular fase]  [▶ Continuar]          │
└─────────────────────────────────────────────────────────────┘
```

## 6. Arquitetura Técnica

### 6.1 Novo Store: autopilotStore.ts

```typescript
interface AutopilotPhase {
  id: string;
  name: string;
  agent: AgentId;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  output?: string;
  artifacts?: string[];  // arquivos criados
  error?: string;
}

interface AutopilotRun {
  id: string;
  specId: string;
  specTitle: string;
  status: 'configuring' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  phases: AutopilotPhase[];
  config: AutopilotConfig;
  startedAt: Date;
  completedAt?: Date;
  tokensUsed: number;
  currentPhaseIndex: number;
}

interface AutopilotConfig {
  phases: AgentId[];
  checkpoints: {
    betweenPhases: boolean;
    beforeFileWrite: boolean;
    onError: boolean;
  };
}

interface AutopilotState {
  currentRun: AutopilotRun | null;
  history: AutopilotRun[];
  isConfigModalOpen: boolean;

  // Actions
  startRun: (specId: string, config: AutopilotConfig) => Promise<void>;
  pauseRun: () => void;
  resumeRun: () => void;
  cancelRun: () => void;
  skipPhase: () => void;
  openConfigModal: (specId: string) => void;
  closeConfigModal: () => void;
}
```

### 6.2 API Route: /api/autopilot

```typescript
// POST /api/autopilot/start
// Body: { specId, specContent, config }
// Response: SSE stream com eventos de progresso

// POST /api/autopilot/pause
// POST /api/autopilot/resume
// POST /api/autopilot/cancel

// Eventos SSE:
// data: { type: 'phase_start', phase: 'planning', agent: 'strategist' }
// data: { type: 'phase_progress', content: '...' }
// data: { type: 'phase_complete', artifacts: ['file1.ts'] }
// data: { type: 'checkpoint', reason: 'between_phases' }
// data: { type: 'error', message: '...' }
// data: { type: 'complete', summary: {...} }
```

### 6.3 Componentes

```
components/autopilot/
├── AutopilotButton.tsx      # Botão "▶ Autopilot" nos cards
├── AutopilotConfigModal.tsx # Modal de configuração
├── AutopilotPanel.tsx       # Painel lateral de progresso
├── AutopilotPhaseItem.tsx   # Item de fase na lista
├── AutopilotCheckpoint.tsx  # Modal de checkpoint
└── AutopilotHistory.tsx     # Histórico de execuções
```

## 7. Fluxo de Execução (Engine)

```typescript
async function executeAutopilot(run: AutopilotRun) {
  for (const phase of run.phases) {
    if (run.status === 'cancelled') break;
    if (run.status === 'paused') await waitForResume();

    // 1. Iniciar fase
    updatePhase(phase.id, { status: 'running', startedAt: new Date() });
    emit({ type: 'phase_start', phase: phase.name, agent: phase.agent });

    // 2. Construir prompt com contexto
    const prompt = buildPhasePrompt(phase, run);

    // 3. Executar agente
    const result = await executeAgent(phase.agent, prompt, {
      onToken: (token) => emit({ type: 'phase_progress', content: token }),
      onArtifact: (file) => {
        if (run.config.checkpoints.beforeFileWrite) {
          pauseForCheckpoint('before_file_write', file);
        }
      }
    });

    // 4. Completar fase
    updatePhase(phase.id, {
      status: 'completed',
      completedAt: new Date(),
      output: result.content,
      artifacts: result.artifacts
    });
    emit({ type: 'phase_complete', artifacts: result.artifacts });

    // 5. Checkpoint entre fases
    if (run.config.checkpoints.betweenPhases) {
      await pauseForCheckpoint('between_phases');
    }
  }

  // 6. Finalizar
  completeRun(run.id);
  emit({ type: 'complete', summary: buildSummary(run) });
}
```

## 8. Prompts por Fase

### Phase 1: Planning (@strategist)
```
Analise a spec abaixo e refine os requisitos:

{spec_content}

Tarefas:
1. Identificar requisitos implícitos
2. Listar acceptance criteria claros
3. Identificar dependências e riscos
4. Estimar complexidade

Output esperado: Spec atualizada com requisitos claros.
```

### Phase 2: Design (@architect)
```
Com base na spec refinada, crie o design técnico:

{spec_content}
{phase1_output}

Tarefas:
1. Definir arquitetura da solução
2. Escolher tecnologias e padrões
3. Identificar componentes necessários
4. Criar ADR documentando decisões

Output esperado: ADR em docs/decisions/
```

### Phase 3: Implementation (@builder)
```
Implemente a solução conforme design:

{spec_content}
{phase2_output}

Tarefas:
1. Criar arquivos necessários
2. Implementar lógica principal
3. Adicionar tratamento de erros
4. Escrever testes unitários básicos

Output esperado: Código funcional com testes.
```

### Phase 4: Validation (@guardian)
```
Revise o código implementado:

{phase3_output}
{files_created}

Tarefas:
1. Verificar segurança
2. Verificar performance
3. Verificar edge cases
4. Sugerir melhorias

Output esperado: Lista de issues e sugestões.
```

### Phase 5: Documentation (@chronicler)
```
Documente as mudanças:

{spec_content}
{all_outputs}
{files_created}

Tarefas:
1. Atualizar README se necessário
2. Atualizar CHANGELOG
3. Marcar tasks como completas
4. Criar resumo da implementação

Output esperado: Docs atualizados.
```

## 9. MVP (Versão Inicial)

Para primeira versão, implementar apenas:

1. ✅ Botão Autopilot nas Specs
2. ✅ Modal simples de configuração
3. ✅ Execução sequencial das 5 fases
4. ✅ Painel de progresso
5. ✅ Pause/Resume básico

**Deixar para v2:**
- Checkpoints granulares
- Estimativa de tokens
- Histórico de execuções
- Rollback

## 10. Definition of Done

- [ ] AutopilotStore implementado
- [ ] AutopilotPanel renderiza progresso
- [ ] Execução sequencial funciona
- [ ] Pause/Resume funciona
- [ ] Cancel funciona
- [ ] Integrado no SpecsPanel
- [ ] Testado com spec real

---

*Criado por @strategist | Revisado por @architect*
