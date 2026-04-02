---
trigger: "system design|design de sistema|arquitetura de sistema|projetar sistema|sdd|back-of-the-envelope"
category: architecture
priority: high
---

# System Design

Cria um System Design Document (SDD) para o sistema descrito em `$ARGUMENTS`.

## O que fazer

1. Leia `$ARGUMENTS` como a descrição do sistema a projetar.
2. Se `$ARGUMENTS` estiver vazio, peça: "Descreva o sistema e a escala esperada."
3. Invoque imediatamente o `@system-designer` com as instruções abaixo.

## Instruções para o @system-designer

Crie um SDD completo para: **$ARGUMENTS**

O documento deve cobrir obrigatoriamente:

**Back-of-the-envelope estimation**
- DAU/MAU estimado, requests/s (read vs write), storage (atual + crescimento), bandwidth

**High-Level Architecture**
- Componentes principais, como se comunicam, diagrama textual/Mermaid

**Data Model**
- Entidades, schema, escolha de storage (SQL/NoSQL/cache) com justificativa

**API Design**
- Endpoints principais: método, parâmetros, response shape, error codes

**Scalability & Reliability**
- Estratégia de horizontal scaling, caching (onde e como), SLO (availability %, latência p99)
- Failure modes e como lidar

**Trade-offs**
- Decisões de design com alternativas consideradas e justificativa da escolha

Salve em `docs/system-design/sdd/{sistema}.md`.

## Uso direto

```
/quick:system-design Sistema de notificações em tempo real para 500k usuários
/quick:system-design Feed de eventos com fanout para rede social
```

**Sistema:** $ARGUMENTS
