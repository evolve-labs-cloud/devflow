# Expected: Notifications System Design

## Artefatos obrigatórios

- `docs/system-design/sdd/notifications.md` com todas as seções

## Seções obrigatórias no SDD

**Back-of-the-envelope:**
- DAU: 500k → ~50k concurrent
- Fanout: 10k followers × X eventos/dia = Y mensagens/s
- Storage: X GB/mês para histórico 90 dias

**High-Level Architecture deve incluir:**
- Message queue (Kafka/SQS) para fanout assíncrono
- WebSocket server ou SSE para in-app
- Push notification service (FCM/APNs)
- Email queue separado (async, não bloqueante)

**Data Model deve incluir:**
- Tabela `notifications` com `user_id`, `type`, `read_at`, `created_at`
- Tabela `notification_preferences` para opt-out
- Estratégia de particionamento por `user_id` ou `created_at`

**Scalability:**
- Fanout strategy documentada: push (write to each) vs pull (read on demand)
- Justificativa para a escolha com threshold de seguidores

## Critérios de falha (regressão)

- ❌ Back-of-the-envelope sem cálculos numéricos
- ❌ Fanout strategy não definida
- ❌ Sem distinção entre canais (push/in-app/email)
- ❌ Histórico sem estratégia de retenção/particionamento
- ❌ SDD sem trade-offs documentados
