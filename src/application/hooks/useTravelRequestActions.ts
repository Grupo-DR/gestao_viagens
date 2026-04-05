import { useState, useCallback } from 'react';
import { RequestStatus, PurchaseInfo } from '../../domain/enums.ts';
import { TravelRequest } from '../../domain/types.ts';
import { useIdentity } from '../identity/IdentityContext.tsx';
import { useToast } from './useToast.ts'; // Agora centralizado em src/application/hooks/
import { changeRequestStatus, deleteTravelRequest } from '../services/travelRequestService.ts';
import { getErrorMessage } from '../../lib/errorUtils.ts';

/**
 * Hook de Ações — useTravelRequestActions (Sprint 3)
 * Encapsula a lógica operacional da TravelList.
 */

export function useTravelRequestActions() {
  const { currentUser } = useIdentity();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Atualização de Status com Feedback e Erro Tipado
   */
  const handleStatusUpdate = useCallback(
    async (
      request: TravelRequest,
      newStatus: RequestStatus,
      comment: string,
      purchaseInfo?: Partial<PurchaseInfo>
    ): Promise<boolean> => {
      
      // Validação Básica
      if (!comment && (newStatus === RequestStatus.PENDENTE_CORRECAO || newStatus === RequestStatus.REPROVADA)) {
        showToast('Ação Requerida', 'warning', 'Por favor, insira um comentário justificando a alteração.');
        return false;
      }

      setIsUpdating(true);
      try {
        await changeRequestStatus(
          request.requestId,
          request.status,
          newStatus,
          request.audit.history,
          currentUser,
          comment,
          purchaseInfo
        );
        
        showToast('Status Atualizado', 'success', `Solicitação movida para: ${newStatus}`);
        return true;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Não foi possível atualizar o status.');
        showToast('Erro na Operação', 'error', errorMsg);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [currentUser, showToast]
  );

  /**
   * Exclusão com Feedback
   */
  const handleDelete = useCallback(
    async (requestId: string): Promise<boolean> => {
      // Nota: O confirm() ainda é usado, mas em uma futura sprint 
      // poderá ser substituído por um Modal de Confirmação customizado.
      if (!window.confirm('Tem certeza que deseja excluir permanentemente esta solicitação?')) {
        return false;
      }

      setIsUpdating(true);
      try {
        await deleteTravelRequest(requestId);
        showToast('Solicitação Excluída', 'success', 'O registro foi removido com sucesso.');
        return true;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Erro ao tentar excluir a solicitação.');
        showToast('Erro Crítico', 'error', errorMsg);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [showToast]
  );

  return {
    handleStatusUpdate,
    handleDelete,
    isUpdating
  };
}
