import { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import './TaskComponents.css';

interface PhotoTaskProps {
  taskId: string;
  onComplete?: () => void;
}

export function PhotoTask({ taskId, onComplete }: PhotoTaskProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);

  const { data: task, isLoading } = useQuery(
    ['task', taskId],
    () => api.getTask(taskId),
    { enabled: !!taskId }
  );

  const completeMutation = useMutation(
    async (photoUrl: string) => {
      return api.completeTask(taskId, { photo_url: photoUrl });
    },
    {
      onSuccess: async (data) => {
        // Invalidate task and progress queries
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);
        
        // Invalidate team-related queries to update team points and forest
        if (userId) {
          await Promise.all([
            queryClient.invalidateQueries(['userActiveTeam', userId]),
            queryClient.invalidateQueries(['userTeams', userId]),
          ]);
        }
        queryClient.invalidateQueries(['userActiveTeam']);
        queryClient.invalidateQueries(['userTeams']);
        
        // Refresh user data to update points
        try {
          await api.refreshMe();
        } catch (userError) {
          console.debug('Failed to refresh user data:', userError);
        }
        
        // Check if task requires verification
        if (data?.requiresVerification) {
          showToast({
            type: 'info',
            title: t('tasks.toast.verificationPendingTitle', 'Warte auf Validierung'),
            message: t('tasks.toast.verificationPendingMessage', 'Ihr Foto wurde hochgeladen und wartet auf die Validierung durch einen Administrator. Sie erhalten die Punkte nach der Freigabe.'),
          });
        } else {
          showToast({
            type: 'success',
            title: t('tasks.toast.completedTitle'),
            message: t('tasks.toast.completedMessage', { points: task?.points ?? 0, trees: TREES_PER_TASK }),
          });
        }
        onComplete?.();
      },
      onError: (error: any) => {
        console.error('Task completion error:', error);
        showToast({
          type: 'error',
          title: t('tasks.toast.errorTitle', 'Fehler'),
          message: error?.message || t('tasks.toast.errorMessage', 'Fehler beim Abschließen der Aufgabe.'),
        });
      },
    }
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('tasksComponents.photo.fileTooLarge'));
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert(t('tasksComponents.photo.invalidFile'));
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!photo) return;

    setUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', photo);

      // Upload photo to backend
      const uploadResponse = await fetch('/api/tasks/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { photo_url } = await uploadResponse.json();
      if (!photo_url) {
        throw new Error('No photo URL returned from server');
      }
      await completeMutation.mutateAsync(photo_url);
      setUploading(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploading(false);
      showToast({
        type: 'error',
        title: t('tasksComponents.photo.uploadFailed', 'Upload fehlgeschlagen'),
        message: error?.message || t('tasksComponents.photo.uploadFailedMessage', 'Das Foto konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.'),
      });
    }
  };

  if (isLoading) return <div>{t('tasksComponents.loading')}</div>;
  if (!task) return <div>{t('tasksComponents.notFound')}</div>;

  return (
    <div className="task-container">
      <div className="task-header">
        <h2>{task.title}</h2>
        <span className="task-points">
          {t('tasksComponents.points', { points: task.points })}
        </span>
      </div>
      {task.description && (
        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-light)' }}>
          {task.description}
        </p>
      )}

      <div className="photo-upload-container">
        {preview ? (
          <div className="photo-preview">
            <img src={preview} alt="Preview" className="preview-image" />
            <div className="photo-actions">
              <button
                onClick={() => {
                  setPhoto(null);
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="change-photo-button"
              >
                {t('tasksComponents.photo.change')}
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || completeMutation.isLoading}
                className="upload-button"
              >
                {uploading || completeMutation.isLoading
                  ? t('tasksComponents.photo.uploading')
                  : t('tasksComponents.photo.upload')}
              </button>
            </div>
          </div>
        ) : (
          <div className="photo-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="photo-input"
              id="photo-input"
            />
            <label htmlFor="photo-input" className="upload-label">
              <span className="upload-icon">📷</span>
              <p>{t('tasksComponents.photo.clickToSelect')}</p>
              <p className="upload-hint">{t('tasksComponents.photo.hint')}</p>
            </label>
          </div>
        )}

        {completeMutation.isSuccess && (
          <div className="task-success">
            {completeMutation.data?.requiresVerification ? (
              <>
                <span className="success-icon">⏳</span>
                <p>{t('tasksComponents.photo.verificationPending', 'Foto hochgeladen. Warte auf Validierung...')}</p>
              </>
            ) : (
              <>
                <span className="success-icon">✅</span>
                <p>{t('tasksComponents.photo.success')}</p>
              </>
            )}
          </div>
        )}
        {completeMutation.isError && (
          <div className="task-error">
            <span className="error-icon">❌</span>
            <p>{t('tasksComponents.photo.error', 'Fehler beim Hochladen. Bitte versuchen Sie es erneut.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
