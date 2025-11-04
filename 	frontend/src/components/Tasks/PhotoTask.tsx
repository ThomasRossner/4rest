import { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
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
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);
        onComplete?.();
      },
    }
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
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
      completeMutation.mutate(photo_url);
    } catch (error) {
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div>Loading task...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div className="task-container">
      <div className="task-header">
        <h2>{task.title}</h2>
        <span className="task-points">+{task.points} points</span>
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
                Change Photo
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || completeMutation.isLoading}
                className="upload-button"
              >
                {uploading || completeMutation.isLoading
                  ? 'Uploading...'
                  : 'Upload & Complete'}
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
              <p>Click to select a photo</p>
              <p className="upload-hint">Max 5MB • JPG, PNG, WebP</p>
            </label>
          </div>
        )}

        {completeMutation.isSuccess && (
          <div className="task-success">
            <span className="success-icon">✅</span>
            <p>Photo uploaded and task completed successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
}
