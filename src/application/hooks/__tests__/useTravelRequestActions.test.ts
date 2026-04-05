import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTravelRequestActions } from '../useTravelRequestActions';
import * as travelService from '../../services/travelRequestService';
import { RequestStatus } from '../../../domain/enums';
import { TravelRequest } from '../../../domain/types';

// Mocks
vi.mock('../../identity/IdentityContext', () => ({
  useIdentity: () => ({
    currentUser: { uid: 'user123', email: 'test@example.com', role: 'ADMINISTRATIVO' }
  })
}));

vi.mock('../useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

vi.mock('../../services/travelRequestService', () => ({
  changeRequestStatus: vi.fn(),
  deleteTravelRequest: vi.fn()
}));

const mockRequest = {
  requestId: 'req123',
  status: RequestStatus.PENDENTE_CORRECAO,
  audit: { history: [] }
} as unknown as TravelRequest;

describe('useTravelRequestActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar changeRequestStatus corretamente ao atualizar status', async () => {
    const { result } = renderHook(() => useTravelRequestActions());
    
    vi.mocked(travelService.changeRequestStatus).mockResolvedValue(undefined);

    await act(async () => {
      const success = await result.current.handleStatusUpdate(
        mockRequest,
        RequestStatus.EM_VALIDACAO_CH,
        'Comentário de teste'
      );
      expect(success).toBe(true);
    });

    expect(travelService.changeRequestStatus).toHaveBeenCalled();
  });

  it('deve falhar se comentário obrigatório estiver ausente na reprovação', async () => {
    const { result } = renderHook(() => useTravelRequestActions());

    await act(async () => {
      const success = await result.current.handleStatusUpdate(
        mockRequest,
        RequestStatus.REPROVADA,
        '' // Comentário vazio
      );
      expect(success).toBe(false);
    });

    expect(travelService.changeRequestStatus).not.toHaveBeenCalled();
  });

  it('deve chamar deleteTravelRequest ao confirmar exclusão', async () => {
    const { result } = renderHook(() => useTravelRequestActions());
    window.confirm = vi.fn().mockReturnValue(true);
    vi.mocked(travelService.deleteTravelRequest).mockResolvedValue(undefined);

    await act(async () => {
      const success = await result.current.handleDelete('req123');
      expect(success).toBe(true);
    });

    expect(travelService.deleteTravelRequest).toHaveBeenCalledWith('req123');
  });

  it('não deve excluir se o usuário cancelar a confirmação', async () => {
    const { result } = renderHook(() => useTravelRequestActions());
    window.confirm = vi.fn().mockReturnValue(false);

    await act(async () => {
      const success = await result.current.handleDelete('req123');
      expect(success).toBe(false);
    });

    expect(travelService.deleteTravelRequest).not.toHaveBeenCalled();
  });
});
