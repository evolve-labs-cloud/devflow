# Spec: Sistema de Notificações em Tempo Real

## Objetivo
Projetar sistema de notificações em tempo real para 500k usuários ativos.

## Requisitos
- Entrega em < 500ms (p99) para usuários online
- Suporte a notificações push (mobile), in-app (WebSocket) e email (async)
- Fanout para até 10k seguidores por evento
- Histórico de notificações com paginação (últimos 90 dias)
- Preferências por usuário (opt-out por tipo de notificação)

## Escopo
**IN:** System Design Document completo
**OUT:** implementação de código

## Estimativa
**Complexidade**: COMPLEX
**Agentes**: system-designer
