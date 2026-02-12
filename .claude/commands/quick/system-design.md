# Quick Start: System Design

Vou te guiar para criar um **System Design Document (SDD)** usando DevFlow.

---

## Passo 1: Coleta de Informações

Por favor, me forneça as seguintes informações:

1. **Sistema/Feature**: O que você quer projetar?
2. **Escala esperada**: Quantos usuários? Requests/sec? Volume de dados?
3. **Requisitos de latência**: Qual p99 é aceitável? Real-time ou batch?
4. **Disponibilidade**: Qual SLA? (99.9%? 99.99%?)
5. **Constraints**: Budget, cloud provider, compliance (LGPD, PCI)?
6. **Contexto**: É um sistema novo ou evolução de existente?

---

## Passo 2: Geração Automática

Com base nas suas respostas, vou:

1. Gerar SDD completo com **back-of-the-envelope estimation**
2. Incluir **diagramas de infraestrutura** (Mermaid)
3. Definir **SLOs e estratégia de monitoring**
4. Projetar **reliability patterns** (circuit breakers, retry, fallback)
5. Identificar **trade-offs e alternativas**
6. Estimar **custos de cloud/infra**

---

## Passo 3: Invocação do @system-designer

Após coletar as informações, vou invocar o System Designer Agent:

```
@system-designer /system-design [seu sistema]
```

O SDD será salvo em `docs/system-design/sdd/`.

---

## Outros Comandos Disponíveis

- `/rfc <proposta>` — RFC para proposta que precisa de discussão
- `/capacity-planning <sistema>` — Estimativa de capacidade e custos
- `/trade-off-analysis <opções>` — Comparação estruturada entre opções
- `/data-model <domínio>` — Design de dados em escala
- `/infra-design <sistema>` — Arquitetura cloud/infra
- `/reliability-review <sistema>` — Análise de SLOs e confiabilidade

---

**Pronto!** Após o @system-designer projetar, o fluxo continua com @builder para implementação.

**Agora, me forneça as informações acima para começarmos!**
