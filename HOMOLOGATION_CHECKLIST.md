# Checklist Técnico de Homologação — Portal de Viagens

Este checklist formaliza os critérios de aceitação técnica para novas funcionalidades e correções.

## 1. Qualidade de Código & Arquitetura
- [ ] **Desacoplamento:** O código não possui dependências circulares entre camadas.
- [ ] **Tipagem:** Não há uso de `any` em novos códigos (exceto mocks de teste quando estritamente necessário).
- [ ] **Mappers:** Dados de infraestrutura/API são convertidos para objetos de domínio via Mappers.
- [ ] **Enums:** Status e Motivos utilizam exclusivamente enums do domínio.

## 2. Regras de Negócio & Política
- [ ] **Motor de Política:** Casos de Folga e Férias passam obrigatoriamente pelo `PolicyEngine`.
- [ ] **Status Inicial:** O status de abertura é calculado corretamente com base no motivo.
- [ ] **Transições:** Apenas transições permitidas no `travelRequest.rules.ts` são exibidas na UI.

## 3. Performance
- [ ] **Dashboards:** Agregações complexas utilizam `useMemo`.
- [ ] **Listas:** Renderização de listas utiliza chaves únicas e estáveis.
- [ ] **API:** Não há chamadas redundantes para o mesmo recurso no mesmo ciclo de vida do componente.

## 4. Testes & Cobertura
- [ ] **Suíte de Testes:** `npm test` executa sem falhas.
- [ ] **Regras Críticas:** Há testes unitários para o `PolicyEngine`.
- [ ] **Workflow:** Há testes de integração para o fluxo de status.

## 5. Próximos Passos (Prontidão para Auth)
- [ ] **Identidade:** `IdentityContext` utiliza a interface `IdentityProvider`.
- [ ] **Troca de Role:** A funcionalidade de troca de papel funciona sem persistência indevida.
