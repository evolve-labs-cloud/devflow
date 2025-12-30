# Quick ADR: Architecture Decision Record

Vou te ajudar a criar um ADR (Architecture Decision Record).

## O que é um ADR?

Documento que registra uma decisão arquitetural importante, incluindo:
- Contexto e problema
- Decisão tomada
- Alternativas consideradas
- Consequências e trade-offs

---

## Template Guiado

### 1. Qual decisão técnica você precisa tomar?

Exemplos:
- Escolher banco de dados (PostgreSQL vs MongoDB)
- Framework frontend (React vs Vue)
- Arquitetura (Monolith vs Microservices)
- Autenticação (JWT vs Session)

**Sua decisão:** [descreva aqui]

---

### 2. Qual é o contexto?

- Qual problema você está resolvendo?
- Quais são os requisitos?
- Quais constraints existem?

**Contexto:** [descreva aqui]

---

### 3. Quais alternativas você considerou?

Liste pelo menos 2-3 opções:

**Opção A:** [nome]
- Pros: [lista]
- Cons: [lista]

**Opção B:** [nome]
- Pros: [lista]
- Cons: [lista]

---

### 4. Qual decisão você tomou e por quê?

**Decisão:** [escolha]

**Justificativa:** [por que esta opção é melhor?]

---

## Próximo Passo

Após preencher acima, vou invocar:

```
@architect

Por favor, criar ADR formal em docs/decisions/ com as seguintes informações:

Decisão: [decisão]
Contexto: [contexto]
Alternativas: [alternativas]
Escolha: [escolha]
Justificativa: [justificativa]

Use o template de docs/decisions/000-template.md
Ver exemplo em docs/decisions/example-001-database-choice.md
```

---

**Preencha as informações acima para eu gerar o ADR!**
