import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { PhotoValidation } from '../Admin/PhotoValidation';
import './Mailbox.css';

interface Message {
  id: string;
  type: string;
  title: string;
  content?: string;
  metadata?: any;
  read: boolean;
  created_at: string;
  read_at?: string;
}

interface MailboxProps {
  onClose: () => void;
}

export function Mailbox({ onClose }: MailboxProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showPhotoValidation, setShowPhotoValidation] = useState(false);
  const [photoValidationUserTaskId, setPhotoValidationUserTaskId] = useState<string | null>(null);

  const { data: messages = [], isLoading, refetch } = useQuery<Message[]>(
    ['messages'],
    () => api.getMessages(true),
    { refetchInterval: 5000 }
  );

  const markAsReadMutation = useMutation(
    (messageId: string) => api.markMessageAsRead(messageId),
    {
      onSuccess: (_, messageId) => {
        queryClient.invalidateQueries(['messages']);
        queryClient.invalidateQueries(['unreadMessageCount']);
        // If this is a photo approval/rejection message, invalidate tasks and progress to update status
        const message = messages.find(m => m.id === messageId);
        if (message && (message.type === 'photo_rejection' || message.type === 'photo_approval')) {
          queryClient.invalidateQueries(['tasks']);
          queryClient.invalidateQueries(['userProgress']);
          queryClient.invalidateQueries(['userActiveTeam']);
          // Refresh user data to update points
          api.refreshMe().catch((error) => {
            console.debug('Failed to refresh user data:', error);
          });
        }
      },
    }
  );

  const deleteMutation = useMutation(
    (messageId: string) => api.deleteMessage(messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages']);
        queryClient.invalidateQueries(['unreadMessageCount']);
        setSelectedMessage(null);
      },
    }
  );

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsReadMutation.mutate(message.id);
      // If this is a photo approval/rejection message, invalidate tasks and progress to update status
      if (message.type === 'photo_rejection' || message.type === 'photo_approval') {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);
        queryClient.invalidateQueries(['userActiveTeam']);
        // Refresh user data to update points
        api.refreshMe().catch((error) => {
          console.debug('Failed to refresh user data:', error);
        });
      }
    }

    // If it's a photo_pending_review message, show photo validation
    if (message.type === 'photo_pending_review' && message.metadata?.user_task_id) {
      setPhotoValidationUserTaskId(message.metadata.user_task_id);
      setShowPhotoValidation(true);
    }
  };

  const handleDelete = () => {
    if (selectedMessage) {
      if (confirm(t('mailbox.confirmDelete'))) {
        deleteMutation.mutate(selectedMessage.id);
      }
    }
  };

  const handleBackFromValidation = () => {
    setShowPhotoValidation(false);
    setPhotoValidationUserTaskId(null);
    refetch();
  };

  if (showPhotoValidation && photoValidationUserTaskId) {
    return (
      <div className="mailbox-overlay">
        <div className="mailbox-container mailbox-fullscreen">
          <PhotoValidation
            cssPrefix="mailbox"
            onBack={handleBackFromValidation}
            filterUserTaskId={photoValidationUserTaskId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mailbox-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="mailbox-container">
        <div className="mailbox-header">
          <h2>{t('mailbox.title')}</h2>
          <button className="mailbox-close-button" onClick={onClose}>×</button>
        </div>

        {isLoading ? (
          <div className="mailbox-loading">{t('mailbox.loading')}</div>
        ) : messages.length === 0 ? (
          <div className="mailbox-empty">
            <p>{t('mailbox.noMessages')}</p>
          </div>
        ) : selectedMessage ? (
          <div className="mailbox-detail">
            <button className="mailbox-back-button" onClick={() => setSelectedMessage(null)}>
              ← {t('mailbox.back')}
            </button>
            <div className="mailbox-detail-header">
              <h3>{selectedMessage.title}</h3>
              <span className="mailbox-detail-date">
                {new Date(selectedMessage.created_at).toLocaleString(i18n.language === 'de' ? 'de-DE' : 'en-GB')}
              </span>
            </div>
            {selectedMessage.type === 'photo_rejection' && (
              <>
                {selectedMessage.metadata?.rejection_reason && (
                  <div className="mailbox-detail-content" style={{ marginTop: '1rem', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee', borderRadius: '8px', border: '1px solid #fcc' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#c00' }}>
                      {t('mailbox.rejectionReason')}
                    </strong>
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#333' }}>{selectedMessage.metadata.rejection_reason}</p>
                  </div>
                )}
                {selectedMessage.content && (
                  <div className="mailbox-detail-content">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.content}</p>
                  </div>
                )}
              </>
            )}
            {selectedMessage.type !== 'photo_rejection' && selectedMessage.content && (
              <div className="mailbox-detail-content">
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.content}</p>
              </div>
            )}
            {selectedMessage.type === 'photo_pending_review' && selectedMessage.metadata?.user_task_id && (
              <div className="mailbox-detail-actions">
                <button
                  className="mailbox-action-button"
                  onClick={() => {
                    setPhotoValidationUserTaskId(selectedMessage.metadata.user_task_id);
                    setShowPhotoValidation(true);
                  }}
                >
                  {t('mailbox.reviewPhoto')}
                </button>
              </div>
            )}
            <div className="mailbox-detail-footer">
              <button
                className="mailbox-delete-button"
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading
                  ? t('mailbox.deleting')
                  : t('mailbox.delete')}
              </button>
            </div>
          </div>
        ) : (
          <div className="mailbox-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mailbox-item ${!message.read ? 'unread' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="mailbox-item-header">
                  <h4>{message.title}</h4>
                  {!message.read && <span className="mailbox-item-unread-badge">●</span>}
                </div>
                <span className="mailbox-item-date">
                  {new Date(message.created_at).toLocaleString(i18n.language === 'de' ? 'de-DE' : 'en-GB')}
                </span>
                {message.content && (
                  <p className="mailbox-item-preview">
                    {message.content.substring(0, 100)}
                    {message.content.length > 100 ? '...' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
