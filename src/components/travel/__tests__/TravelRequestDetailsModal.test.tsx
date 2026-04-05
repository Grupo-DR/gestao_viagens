import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TravelRequestDetailsModal } from '../TravelRequestDetailsModal';
import { RequestStatus, UserRole } from '../../../domain/enums';
import { TravelRequest } from '../../../domain/types';

// Mocks
vi.mock('../PolicyDecisionPanel.tsx', () => ({
  PolicyDecisionPanel: () => <div data-testid="policy-panel" />
}));

vi.mock('../AuditTimeline.tsx', () => ({
  AuditTimeline: () => <div data-testid="audit-timeline" />
}));

vi.mock('../PurchaseForm.tsx', () => ({
  PurchaseForm: () => <div data-testid="purchase-form" />
}));

const mockRequest = {
  requestId: 'req123',
  status: RequestStatus.EM_VALIDACAO_CH,
  employee: { chapa: '123', employeeName: 'João' },
  travel: { reason: 'CONCLUSAO_OBRA', origin: 'A', destination: 'B' },
  validation: { policyDecision: { result: 'APPROVED', summary: 'OK', evidence: {}, violations: [] } },
  audit: { history: [] }
} as unknown as TravelRequest;

describe('TravelRequestDetailsModal', () => {
  it('deve renderizar informações básicas corretamente', () => {
    render(
      <TravelRequestDetailsModal
        request={mockRequest}
        currentUserRole={UserRole.GESTOR}
        onClose={() => {}}
        onUpdateStatus={async () => true}
      />
    );

    expect(screen.getByText(/Ficha de Viagem/i)).toBeDefined();
    expect(screen.getByText(/João/i)).toBeDefined();
  });

  it('deve mostrar botões de aprovação apenas para RH/ADM quando em validação CH', () => {
    const { rerender } = render(
      <TravelRequestDetailsModal
        request={mockRequest}
        currentUserRole={UserRole.CAPITAL_HUMANO}
        onClose={() => {}}
        onUpdateStatus={async () => true}
      />
    );

    expect(screen.getByText(/Aprovar para Compra/i)).toBeDefined();

    rerender(
      <TravelRequestDetailsModal
        request={mockRequest}
        currentUserRole={UserRole.GESTOR}
        onClose={() => {}}
        onUpdateStatus={async () => true}
      />
    );

    expect(screen.queryByText(/Aprovar para Compra/i)).toBeNull();
  });

  it('deve disparar onClose ao clicar no botão fechar', () => {
    const onClose = vi.fn();
    render(
      <TravelRequestDetailsModal
        request={mockRequest}
        currentUserRole={UserRole.GESTOR}
        onClose={onClose}
        onUpdateStatus={async () => true}
      />
    );

    const closeButtons = screen.getAllByRole('button'); // O ícone X ou o botão Fechar
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
