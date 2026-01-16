import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import './TaskComponents.css';

interface VideoTaskProps {
  taskId: string;
  onComplete?: () => void;
}

export function VideoTask({ taskId, onComplete }: VideoTaskProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);

  const { data: task, isLoading } = useQuery(
    ['task', taskId],
    () => api.getTask(taskId),
    { enabled: !!taskId }
  );

  const completeMutation = useMutation(
    (data: { quiz_answers: any }) => api.completeTask(taskId, data),
    {
      onSuccess: async () => {
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
        
        showToast({
          type: 'success',
          title: t('tasks.toast.completedTitle'),
          message: t('tasks.toast.completedMessage', { points: task?.points ?? 0, trees: TREES_PER_TASK }),
        });
        onComplete?.();
      },
    }
  );

  if (isLoading) return <div>{t('tasksComponents.loading')}</div>;
  if (!task) return <div>{t('tasksComponents.notFound')}</div>;

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoTask.tsx:66',message:'VideoTask task loaded',data:{taskId,taskTitle:task.title,videoUrl:task.video_url,hasVideoUrl:!!task.video_url,isYouTubeUrl:task.video_url?.includes('youtube.com')||task.video_url?.includes('youtu.be')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const questions = task.quiz_questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = questions.every((_: any, index: number) => answers[index]);

  const handleAnswer = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = () => {
    if (allAnswered) {
      completeMutation.mutate({
        quiz_answers: Object.entries(answers).map(([index, answer]) => ({
          questionIndex: parseInt(index),
          answer,
        })),
      });
    }
  };

  return (
    <div className="task-container">
      <div className="task-header">
        <h2>{task.title}</h2>
        <span className="task-points">
          {t('tasksComponents.points', { points: task.points })}
        </span>
      </div>

      {task.video_url && (
        <div className="video-container">
          {/* #region agent log */}
          {(()=>{fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoTask.tsx:95',message:'VideoTask rendering video',data:{videoUrl:task.video_url,isYouTube:task.video_url?.includes('youtube.com')||task.video_url?.includes('youtu.be')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});return null;})()}
          {/* #endregion */}
          {(() => {
            const videoUrl = task.video_url;
            const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
            
            if (isYouTube) {
              // Convert YouTube URL to embed format
              let embedUrl = '';
              if (videoUrl.includes('/shorts/')) {
                const videoId = videoUrl.split('/shorts/')[1]?.split('?')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
              } else if (videoUrl.includes('youtube.com/watch?v=')) {
                const videoId = videoUrl.split('v=')[1]?.split('&')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
              } else if (videoUrl.includes('youtu.be/')) {
                const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
              } else {
                embedUrl = videoUrl;
              }
              
              // #region agent log
              fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoTask.tsx:108',message:'VideoTask using YouTube iframe',data:{originalUrl:videoUrl,embedUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              
              return (
                <iframe
                  src={embedUrl}
                  className="task-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
                />
              );
            }
            
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoTask.tsx:120',message:'VideoTask using HTML5 video element',data:{videoUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            return (
              <video
                controls
                src={videoUrl}
                className="task-video"
                onError={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoTask.tsx:128',message:'VideoTask video error',data:{videoUrl,error:((e.target as HTMLVideoElement).error?.message||'unknown')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                  // #endregion
                }}
                onLoadStart={() => {
                  // #region agent log
                  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoTask.tsx:133',message:'VideoTask video load start',data:{videoUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                  // #endregion
                }}
                onEnded={() => {
                  // Video ended, show quiz questions
                }}
              >
                {t('tasksComponents.video.notSupported')}
              </video>
            );
          })()}
        </div>
      )}

      <div className="quiz-container">
        <h3>{t('tasksComponents.video.quizTitle')}</h3>
        <div className="question-progress">
          {t('tasksComponents.video.questionProgress', {
            current: currentQuestionIndex + 1,
            total: questions.length,
          })}
        </div>

        {currentQuestion && (
          <div className="question-card">
            <p className="question-text">{currentQuestion.question}</p>
            <div className="answer-options">
              {currentQuestion.options.map((option: string, optionIndex: number) => (
                <button
                  key={optionIndex}
                  className={`answer-button ${
                    answers[currentQuestionIndex] === option ? 'selected' : ''
                  }`}
                  onClick={() => handleAnswer(currentQuestionIndex, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="quiz-navigation">
          <button
            onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
          >
            {t('tasksComponents.video.previous')}
          </button>
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={!answers[currentQuestionIndex]}
            >
              {t('tasksComponents.video.next')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || completeMutation.isLoading}
              className="submit-button"
            >
              {completeMutation.isLoading
                ? t('tasksComponents.video.submitting')
                : t('tasksComponents.video.complete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
