import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type ManagementMessage = {
  type: 'error' | 'success';
  text: string;
} | null;

export type BulkOperationCallbacks<T> = {
  bulkUpdateStatus: (ids: string[], active: boolean) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  refetch: () => Promise<void>;
  getSuccessMessage?: (action: 'activate' | 'deactivate' | 'delete', count: number) => string;
  getErrorMessage?: (action: 'activate' | 'deactivate' | 'delete', error: any) => string;
};

/**
 * Custom Hook für Bulk-Operationen
 * Verwaltet Bulk-Status-Änderungen und Bulk-Löschungen
 */
export function useBulkOperations<T>(
  selectedIds: string[],
  callbacks: BulkOperationCallbacks<T>
) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<ManagementMessage>(null);

  const handleBulkStatus = useCallback(async (active: boolean) => {
    if (!selectedIds.length) return;

    try {
      setMessage(null);
      await callbacks.bulkUpdateStatus(selectedIds, active);
      
      const successMessage = callbacks.getSuccessMessage
        ? callbacks.getSuccessMessage(active ? 'activate' : 'deactivate', selectedIds.length)
        : active
        ? t('admin.messages.selectedItemsActivated', { count: selectedIds.length })
        : t('admin.messages.selectedItemsDeactivated', { count: selectedIds.length });

      setMessage({
        type: 'success',
        text: successMessage,
      });

      await callbacks.refetch();
    } catch (error: any) {
      const errorMessage = callbacks.getErrorMessage
        ? callbacks.getErrorMessage(active ? 'activate' : 'deactivate', error)
        : error?.response?.data?.error || error?.message || t('admin.messages.failedToUpdateItems');

      setMessage({
        type: 'error',
        text: errorMessage,
      });
    }
  }, [selectedIds, callbacks, t]);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedIds.length) return;

    try {
      setMessage(null);
      await callbacks.bulkDelete(selectedIds);

      const successMessage = callbacks.getSuccessMessage
        ? callbacks.getSuccessMessage('delete', selectedIds.length)
        : t('admin.messages.selectedItemsDeleted', { count: selectedIds.length });

      setMessage({
        type: 'success',
        text: successMessage,
      });

      await callbacks.refetch();
    } catch (error: any) {
      const errorMessage = callbacks.getErrorMessage
        ? callbacks.getErrorMessage('delete', error)
        : error?.response?.data?.error || error?.message || t('admin.messages.failedToDeleteItems');

      setMessage({
        type: 'error',
        text: errorMessage,
      });
    }
  }, [selectedIds, callbacks, t]);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    message,
    handleBulkStatus,
    handleBulkDelete,
    clearMessage,
    setMessage,
  };
}
