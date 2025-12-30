# Guia Rápido: DevFlow no Claude Code

## 🚀 Setup Instantâneo

Você já está pronto! Os 5 agentes estão disponíveis:

```
@strategist  - Planejamento & Produto
@architect   - Design & Arquitetura
@builder     - Implementação
@guardian    - Qualidade & Segurança
@chronicler  - Documentação & Memória
```

---

## 📖 Como Usar

### 1. Mencione um Agente

No Claude Code, simplesmente mencione o agente:

```
@strategist Preciso criar um sistema de autenticação
```

O Strategist vai:
- Fazer perguntas para entender o requisito
- Criar especificação
- Quebrar em user stories se necessário

### 2. Workflows Comuns

#### 🐛 Bug Fix Rápido

```
@builder Fix: botão de login não funciona no mobile
```

**Fluxo automático:**
1. Builder investiga e corrige
2. Chronicler documenta no CHANGELOG

**Tempo**: 5-15 minutos

---

#### ✨ Nova Feature Simples

```
@strategist Adicionar filtro por categoria na lista de produtos
```

**Fluxo automático:**
1. Strategist cria spec rápida
2. Architect valida (se necessário)
3. Builder implementa
4. Guardian testa
5. Chronicler documenta

**Tempo**: 2-4 horas

---

#### 🏗️ Feature Complexa

```
@strategist Criar sistema de pagamentos com múltiplos providers
```

**Fluxo completo:**

**Sprint 1: Planning**
```
@strategist /prd Sistema de pagamentos
# Output: planning/prd-payments.md

@architect /design Sistema de pagamentos  
# Output: architecture/payments.md + ADRs

@guardian /test-plan planning/prd-payments.md
# Output: tests/payments-test-plan.md
```

**Sprint 2-4: Implementation**
```
@builder /implement planning/stories/payments/story-001.md
# Implementa cada story iterativamente

@chronicler documenta automaticamente após cada story
```

**Tempo**: 2-4 semanas

---

### 3. Comandos Úteis

#### Chronicler (Documentação)
```
@chronicler /document           # Documenta mudanças recentes
@chronicler /snapshot           # Cria snapshot do projeto
@chronicler /sync-check         # Verifica drift de docs
@chronicler /decision "Topic"   # Cria ADR manualmente
```

#### Strategist (Planejamento)
```
@strategist /analyze "Problema"     # Análise profunda
@strategist /prd "Feature"          # Cria PRD completo
@strategist /stories "Feature"      # Quebra em stories
@strategist /prioritize [lista]     # Prioriza features
```

#### Architect (Design)
```
@architect /design "Sistema"        # Design de solução
@architect /adr "Decisão"          # Cria ADR
@architect /diagram sequence       # Gera diagrama
@architect /review-arch "Doc"      # Revisa arquitetura
```

#### Builder (Implementação)
```
@builder /implement story.md       # Implementa story
@builder /review file.ts           # Code review
@builder /refactor file.ts         # Refatora código
@builder /debug "Problema"         # Investiga bug
```

#### Guardian (Qualidade)
```
@guardian /test-plan story.md      # Plano de testes
@guardian /security-check src/     # Security audit
@guardian /perf-review endpoint    # Análise de performance
@guardian /ci-setup                # Configura CI/CD
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Começando um Novo Projeto

```
Você: @strategist Quero criar uma API REST para gerenciar tarefas (to-do list)

Strategist: Vou fazer algumas perguntas para entender melhor:

1. Quem vai usar? (público geral, equipes, empresas?)
2. Principais features? (CRUD básico, colaboração, notificações?)
3. Requisitos especiais? (offline, real-time, integração?)
4. Prazo? (MVP rápido, produto completo?)

[Você responde...]

Strategist: Perfeito! Vou criar:
1. Quick spec (MVP)
2. PRD completo (roadmap)
3. Stories priorizadas

[Gera documentos...]

Próximo: Mencione @architect para design técnico
```

---

### Exemplo 2: Implementando Feature

```
Você: @builder Implementar autenticação JWT básica

Builder: Vou verificar se há spec/design...

[Busca em planning/ e architecture/]

Encontrei:
- planning/stories/auth/story-001-jwt-core.md
- architecture/auth-system.md
- docs/decisions/001-jwt-implementation.md

Implementando baseado no design do @architect...

[Cria código + testes]

✅ Implementação completa:
- src/auth/jwt.service.ts
- src/auth/auth.middleware.ts  
- src/auth/auth.routes.ts
- Tests (95% coverage)

@chronicler vai documentar automaticamente.

Próximo: @guardian para security review
```

---

### Exemplo 3: Review de Segurança

```
Você: @guardian Security review do sistema de auth

Guardian: Analisando src/auth/...

🔴 CRITICAL Issues:
1. Hardcoded JWT secret (linha 12)
2. SQL injection vulnerability (user.repository.ts:45)

🟡 Warnings:
3. Missing rate limiting on /login
4. Weak password requirements (<8 chars)

[Detalhes completos...]

Recomendação: ❌ NOT production-ready
Deve corrigir Critical antes do deploy.

[Você corrige os problemas...]

Guardian: ✅ Re-scan passed! Production-ready.

@chronicler documentou security audit no CHANGELOG
```

---

## 💡 Dicas de Uso

### ✅ Faça

1. **Comece pelo Strategist** em features novas
   ```
   @strategist antes de @builder
   ```

2. **Use Architect para decisões técnicas**
   ```
   @architect quando houver dúvidas de design
   ```

3. **Deixe Chronicler rodar automático**
   ```
   Não precisa chamar, ele documenta sozinho
   ```

4. **Consulte snapshots entre sessões**
   ```
   .devflow/snapshots/ tem histórico completo
   ```

### ❌ Evite

1. **Pular planejamento em features complexas**
   ```
   ❌ @builder implementa feature complexa (sem spec)
   ✅ @strategist primeiro → @builder depois
   ```

2. **Ignorar avisos do Guardian**
   ```
   ❌ Deployer com security warnings
   ✅ Corrigir Critical/High antes de production
   ```

3. **Editar CHANGELOG.md manualmente**
   ```
   ❌ Editar CHANGELOG.md direto
   ✅ Usar @chronicler /document
   ```

---

## 🔄 Workflow Recomendado

### Para Features Novas

```mermaid
graph TD
    A[Idea] --> B[@strategist Analisa]
    B --> C{Complexo?}
    C -->|Sim| D[@strategist PRD]
    C -->|Não| E[@strategist Quick Spec]
    D --> F[@architect Design]
    E --> F
    F --> G[@builder Implementa]
    G --> H[@guardian Testa]
    H --> I[@chronicler Documenta]
    I --> J[Done ✅]
```

### Para Bug Fixes

```
Problema → @builder Debug → Fix → @chronicler Documenta → Done
```

### Para Refactors

```
@architect Revisa → @builder Refatora → @guardian Testa → Done
```

---

## 📚 Estrutura de Arquivos

Após usar o sistema, você terá:

```
dexter devflow/
├── .devflow/
│   ├── agents/                # Os 5 agentes
│   └── snapshots/             # Histórico do projeto
│
├── docs/
│   ├── decisions/             # ADRs (Chronicler cria)
│   ├── api/                   # API docs
│   └── migration/             # Migration guides
│
├── planning/
│   ├── prd.md                 # Strategist cria
│   └── stories/               # Strategist quebra
│
├── architecture/
│   ├── overview.md            # Architect cria
│   └── diagrams/              # Architect gera
│
├── CHANGELOG.md               # Chronicler mantém
└── README.md
```

---

## 🎓 Próximos Passos

1. **Teste um workflow simples**
   ```
   @strategist Criar feature X
   ```

2. **Implemente algo**
   ```
   @builder Implementar story Y
   ```

3. **Verifique a documentação**
   ```
   @chronicler /sync-check
   ```

4. **Revise o snapshot**
   ```
   cat .devflow/snapshots/2025-11-15.md
   ```

---

## 🆘 Troubleshooting

### Agente não responde como esperado?

1. Verifique se está mencionando corretamente: `@agente`
2. Leia a documentação do agente em `.devflow/agents/`
3. Use comandos específicos quando disponível: `@agente /comando`

### Documentação desatualizada?

```
@chronicler /sync-check
@chronicler /update-docs
```

### Perdeu contexto entre sessões?

```
# Leia o snapshot mais recente
cat .devflow/snapshots/$(ls -t .devflow/snapshots/ | head -1)

# Ou crie novo snapshot
@chronicler /snapshot
```

---

**Pronto para começar!** 🚀

Comece mencionando qualquer agente e deixe o sistema guiar você.
