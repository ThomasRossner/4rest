import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import './PhotoValidation.css';

interface PendingPhotoTask {
  user_task_id: string;
  user_id: string;
  task_id: string;
  photo_url: string;
  completed_at: string;
  user_name: string;
  user_email: string;
  task_title: string;
  points: number;
  task_description?: string;
}

interface PhotoValidationProps {
  onBack?: () => void;
  cssPrefix?: string;
  filterUserTaskId?: string; // Optional: filter to show only a specific user_task
}

export function PhotoValidation({ onBack, cssPrefix = 'admin', filterUserTaskId }: PhotoValidationProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);

  const { data: pendingTasks = [], isLoading, refetch, error } = useQuery<PendingPhotoTask[]>(
    ['pendingPhotoTasks'],
    () => api.getPendingPhotoTasks(),
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (data) => {
        console.log('[PhotoValidation] Received pending tasks:', data?.length || 0, data);
      },
      onError: (err) => {
        console.error('[PhotoValidation] Error fetching pending tasks:', err);
      },
    }
  );

  // Listen for WebSocket photo task updates
  React.useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'photo:task:update') {
        queryClient.invalidateQueries(['pendingPhotoTasks']);
        refetch();
      }
    };

    window.addEventListener('data:update', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('data:update', handleUpdate as EventListener);
    };
  }, [queryClient, refetch]);

  // Filter tasks if filterUserTaskId is provided
  const filteredTasks = filterUserTaskId
    ? pendingTasks.filter(task => task.user_task_id === filterUserTaskId)
    : pendingTasks;

  const approveMutation = useMutation(
    (userTaskId: string) => api.approvePhotoTask(userTaskId),
    {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: t('photoValidation.approvedTitle', 'Foto freigegeben'),
          message: t('photoValidation.approvedMessage', 'Das Foto wurde freigegeben und die Punkte wurden vergeben.'),
        });
        // Invalidate both pending photos and tasks queries so the guest sees the update
        queryClient.invalidateQueries(['pendingPhotoTasks']);
        queryClient.invalidateQueries(['tasks']);
        refetch();
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          title: t('photoValidation.approveErrorTitle', 'Fehler'),
          message: error?.message || t('photoValidation.approveErrorMessage', 'Fehler beim Freigeben des Fotos.'),
        });
      },
    }
  );

  const rejectMutation = useMutation(
    ({ userTaskId, reason }: { userTaskId: string; reason?: string }) =>
      api.rejectPhotoTask(userTaskId, reason),
    {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: t('photoValidation.rejectedTitle', 'Foto abgelehnt'),
          message: t('photoValidation.rejectedMessage', 'Das Foto wurde abgelehnt und der Benutzer wurde benachrichtigt.'),
        });
        setShowRejectDialog(null);
        setRejectionReason('');
        // Invalidate both pending photos and tasks queries so the guest sees the update
        queryClient.invalidateQueries(['pendingPhotoTasks']);
        queryClient.invalidateQueries(['tasks']);
        refetch();
      },
      onError: (error: any) => {
        showToast({
          type: 'error',
          title: t('photoValidation.rejectErrorTitle', 'Fehler'),
          message: error?.message || t('photoValidation.rejectErrorMessage', 'Fehler beim Ablehnen des Fotos.'),
        });
      },
    }
  );

  const handleApprove = (userTaskId: string) => {
    if (confirm(t('photoValidation.confirmApprove', 'Möchten Sie dieses Foto wirklich freigeben?'))) {
      approveMutation.mutate(userTaskId);
    }
  };

  const handleReject = (userTaskId: string) => {
    setRejectingTaskId(userTaskId);
    setShowRejectDialog(userTaskId);
  };

  const confirmReject = () => {
    if (rejectingTaskId) {
      rejectMutation.mutate({
        userTaskId: rejectingTaskId,
        reason: rejectionReason || undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`${cssPrefix}-section`}>
        <div className={`${cssPrefix}-loading`}>{t('photoValidation.loading', 'Lade ausstehende Fotos...')}</div>
      </div>
    );
  }

  return (
    <div className={`${cssPrefix}-section`}>
      {onBack && (
        <button onClick={onBack} className={`${cssPrefix}-back-button`}>
          ← {t('common.back', 'Zurück')}
        </button>
      )}

      <h2 className={`${cssPrefix}-section-title`}>
        {t('photoValidation.title', 'Foto-Aufgaben verifizieren')}
      </h2>

      {error && (
        <div className={`${cssPrefix}-error-state`}>
          <p>{t('photoValidation.error', 'Fehler beim Laden der Foto-Aufgaben:')} {error instanceof Error ? error.message : String(error)}</p>
        </div>
      )}

      {!error && (!filteredTasks || filteredTasks.length === 0) ? (
        <div className={`${cssPrefix}-empty-state`}>
          <p>{t('photoValidation.noPendingTasks', 'Keine ausstehenden Foto-Aufgaben.')}</p>
          {pendingTasks.length > 0 && filteredTasks.length === 0 && filterUserTaskId && (
            <p>Filter: {filterUserTaskId} - Keine passende Aufgabe gefunden</p>
          )}
        </div>
      ) : (
        <div className="photo-validation-list">
          {filteredTasks.map((task) => (
            <div key={task.user_task_id} className="photo-validation-item">
              <div className="photo-validation-photo">
                <img src={task.photo_url} alt={task.task_title} />
              </div>
              <div className="photo-validation-info">
                <h3>{task.task_title}</h3>
                <p className="photo-validation-user">
                  <strong>{t('photoValidation.user', 'Benutzer')}:</strong> {task.user_name} ({task.user_email})
                </p>
                <p className="photo-validation-points">
                  <strong>{t('photoValidation.points', 'Punkte')}:</strong> {task.points}
                </p>
                <p className="photo-validation-date">
                  <strong>{t('photoValidation.uploadedAt', 'Hochgeladen am')}:</strong>{' '}
                  {new Date(task.completed_at).toLocaleString('de-DE')}
                </p>
                {task.task_description && (
                  <p className="photo-validation-description">{task.task_description}</p>
                )}
                <div className="photo-validation-actions">
                  <button
                    onClick={() => handleApprove(task.user_task_id)}
                    disabled={approveMutation.isLoading}
                    className="photo-validation-approve-button"
                  >
                    {approveMutation.isLoading
                      ? t('photoValidation.approving', 'Freigeben...')
                      : t('photoValidation.approve', 'Freigeben')}
                  </button>
                  <button
                    onClick={() => handleReject(task.user_task_id)}
                    disabled={rejectMutation.isLoading}
                    className="photo-validation-reject-button"
                  >
                    {rejectMutation.isLoading
                      ? t('photoValidation.rejecting', 'Ablehnen...')
                      : t('photoValidation.reject', 'Ablehnen')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRejectDialog && (
        <div className="photo-validation-reject-dialog-overlay">
          <div className="photo-validation-reject-dialog">
            <h3>{t('photoValidation.rejectDialogTitle', 'Foto ablehnen')}</h3>
            <p>{t('photoValidation.rejectDialogMessage', 'Möchten Sie dieses Foto wirklich ablehnen? Optional können Sie eine Begründung angeben.')}</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('photoValidation.rejectionReasonPlaceholder', 'Begründung (optional)')}
              className="photo-validation-rejection-reason"
              rows={4}
            />
            <div className="photo-validation-reject-dialog-actions">
              <button
                onClick={() => {
                  setShowRejectDialog(null);
                  setRejectionReason('');
                }}
                className="photo-validation-cancel-button"
              >
                {t('common.cancel', 'Abbrechen')}
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectMutation.isLoading}
                className="photo-validation-confirm-reject-button"
              >
                {rejectMutation.isLoading
                  ? t('photoValidation.rejecting', 'Ablehnen...')
                  : t('photoValidation.confirmReject', 'Ablehnen')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
