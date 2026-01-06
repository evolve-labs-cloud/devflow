# US-010: Seletor de Agente no Chat

**Epic**: Chat com Agentes
**Prioridade**: P0 (Blocker)
**Complexidade**: 3 pontos
**Status**: Implemented

---

## User Story

**Como** desenvolvedor
**Quero** selecionar qual agente usar na conversa
**Para** direcionar minhas perguntas ao especialista correto

---

## Acceptance Criteria

### AC1: Dropdown de Seleção
```gherkin
Given que estou no painel de chat
When vejo o header do chat
Then existe um dropdown mostrando o agente atual
And o default é "@strategist" (ou último usado)
```

### AC2: Lista de Agentes
```gherkin
Given que clico no dropdown de agentes
Then vejo lista com todos os agentes:
  | Agente      | Ícone | Descrição curta          |
  | @strategist | 📊    | Planejamento & Produto   |
  | @architect  | 🏗️    | Design & Arquitetura     |
  | @builder    | 🔨    | Implementação            |
  | @guardian   | 🛡️    | Qualidade & Testes       |
  | @chronicler | 📝    | Documentação             |
```

### AC3: Seleção de Agente
```gherkin
Given que vejo a lista de agentes
When clico em um agente
Then o dropdown fecha
And o agente selecionado aparece no header
And as próximas mensagens usam este agente
```

### AC4: Prefixo Automático
```gherkin
Given que selecionei @architect
When envio mensagem "revisar arquitetura"
Then a mensagem enviada ao CLI é "@architect revisar arquitetura"
And no histórico vejo minha mensagem original sem prefixo
```

### AC5: Indicador Visual no Chat
```gherkin
Given que recebi resposta de um agente
Then a resposta mostra qual agente respondeu
And usa o ícone e cor do agente
```

### AC6: Persistência de Seleção
```gherkin
Given que selecionei @builder
When fecho e reabro a IDE
Then @builder ainda está selecionado
```

### AC7: Keyboard Navigation
```gherkin
Given que o dropdown está aberto
When uso setas ↑↓ do teclado
Then posso navegar entre agentes
When pressiono Enter
Then o agente focado é selecionado
When pressiono Esc
Then o dropdown fecha sem mudar seleção
```

---

## Technical Notes

### Dados dos Agentes

```typescript
interface Agent {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  description: string;
  shortDescription: string;
}

const AGENTS: Agent[] = [
  {
    id: 'strategist',
    name: '@strategist',
    displayName: 'Strategist',
    icon: '📊',
    color: '#3B82F6', // blue
    description: 'Product Manager & Analista - Transforma problemas em planos',
    shortDescription: 'Planejamento & Produto',
  },
  {
    id: 'architect',
    name: '@architect',
    displayName: 'Architect',
    icon: '🏗️',
    color: '#8B5CF6', // purple
    description: 'Solutions Architect - Design técnico e decisões',
    shortDescription: 'Design & Arquitetura',
  },
  {
    id: 'builder',
    name: '@builder',
    displayName: 'Builder',
    icon: '🔨',
    color: '#F59E0B', // amber
    description: 'Senior Developer - Implementação de código',
    shortDescription: 'Implementação',
  },
  {
    id: 'guardian',
    name: '@guardian',
    displayName: 'Guardian',
    icon: '🛡️',
    color: '#10B981', // green
    description: 'QA Engineer - Qualidade e segurança',
    shortDescription: 'Qualidade & Testes',
  },
  {
    id: 'chronicler',
    name: '@chronicler',
    displayName: 'Chronicler',
    icon: '📝',
    color: '#EC4899', // pink
    description: 'Technical Writer - Documentação',
    shortDescription: 'Documentação',
  },
];
```

### Componente de Seleção

```typescript
// components/AgentSelector.tsx
interface AgentSelectorProps {
  selectedAgent: Agent;
  onSelect: (agent: Agent) => void;
}

function AgentSelector({ selectedAgent, onSelect }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Keyboard handling
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setFocusedIndex(i => Math.min(i + 1, AGENTS.length - 1));
        break;
      case 'ArrowUp':
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        onSelect(AGENTS[focusedIndex]);
        setIsOpen(false);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <span>{selectedAgent.icon}</span>
        <span>{selectedAgent.name}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-1 w-64 bg-white rounded-lg shadow-lg border">
          {AGENTS.map((agent, index) => (
            <button
              key={agent.id}
              onClick={() => {
                onSelect(agent);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50",
                index === focusedIndex && "bg-gray-100",
                agent.id === selectedAgent.id && "bg-blue-50"
              )}
            >
              <span className="text-xl">{agent.icon}</span>
              <div className="text-left">
                <div className="font-medium">{agent.name}</div>
                <div className="text-sm text-gray-500">
                  {agent.shortDescription}
                </div>
              </div>
              {agent.id === selectedAgent.id && (
                <CheckIcon className="w-4 h-4 ml-auto text-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Persistência

```typescript
// hooks/useAgentSelection.ts
function useAgentSelection() {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('devflow:selectedAgent');
    if (saved) {
      const agent = AGENTS.find(a => a.id === saved);
      if (agent) return agent;
    }
    return AGENTS[0]; // default to strategist
  });

  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    localStorage.setItem('devflow:selectedAgent', agent.id);
  };

  return { selectedAgent, selectAgent };
}
```

---

## UI/UX Notes

### Layout do Header do Chat

```
┌─────────────────────────────────────────────────────────────┐
│ CHAT                                                        │
│ ┌───────────────────────┐                                  │
│ │ 📊 @strategist      ▼ │    [Clear] [Sessions] [⚙️]       │
│ └───────────────────────┘                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  (área de mensagens)                                       │
│                                                             │
```

### Dropdown Aberto

```
┌───────────────────────┐
│ 📊 @strategist      ▼ │
└───────────────────────┘
┌───────────────────────────────────────┐
│ 📊 @strategist         ✓              │
│    Planejamento & Produto             │
├───────────────────────────────────────┤
│ 🏗️ @architect                         │
│    Design & Arquitetura               │
├───────────────────────────────────────┤
│ 🔨 @builder                           │
│    Implementação                      │
├───────────────────────────────────────┤
│ 🛡️ @guardian                          │
│    Qualidade & Testes                 │
├───────────────────────────────────────┤
│ 📝 @chronicler                        │
│    Documentação                       │
└───────────────────────────────────────┘
```

### Mensagem com Indicador de Agente

```
┌─────────────────────────────────────────────────────────────┐
│ 🏗️ @architect                                   10:45 AM   │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Analisando a arquitetura proposta, recomendo:              │
│                                                             │
│ 1. Separar a camada de API em módulos                      │
│ 2. Usar padrão Repository para data access                 │
│ ...                                                        │
│                                                     [Copy]  │
└─────────────────────────────────────────────────────────────┘
```

**Cor da borda/accent** muda baseado no agente selecionado.

---

## Definition of Done

- [x] Dropdown renderiza lista de agentes
- [x] Seleção muda agente ativo
- [x] Prefixo @ é adicionado automaticamente
- [x] Respostas mostram qual agente respondeu
- [x] Keyboard navigation funciona
- [x] Seleção persiste entre sessões
- [x] Visual feedback (cores, ícones) correto
- [x] Testes unitários do componente
- [x] Code review aprovado

---

## Dependencies

- US-008 (interface de chat base)

---

*Story criada por @strategist*
