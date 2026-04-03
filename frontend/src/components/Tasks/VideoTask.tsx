import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import { normalizeQuizQuestionsForDisplay } from '../../utils/taskQuestionI18n';
import './TaskComponents.css';

interface VideoTaskProps {
  taskId: string;
  onComplete?: () => void;
  variant?: 'default' | 'public';
}

export function VideoTask({ taskId, onComplete, variant = 'default' }: VideoTaskProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { t, i18n } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const publicLang = i18n.language?.startsWith('en') ? 'en' : 'de';

  const { data: task, isLoading } = useQuery(
    variant === 'public' ? ['publicTask', taskId, publicLang] : ['task', taskId],
    () =>
      variant === 'public' ? api.getPublicTask(taskId, publicLang) : api.getTask(taskId),
    { enabled: !!taskId }
  );

  const completeMutation = useMutation(
    (data: { quiz_answers: unknown }) =>
      variant === 'public' ? api.completePublicTask(taskId, data) : api.completeTask(taskId, data),
    {
      onSuccess: async () => {
        if (variant === 'public') {
          showToast({
            type: 'success',
            title: t('publicTask.toast.title'),
            message: t('publicTask.toast.body', { points: task?.points ?? 0 }),
          });
          onComplete?.();
          return;
        }
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);

        if (userId) {
          await Promise.all([
            queryClient.invalidateQueries(['userActiveTeam', userId]),
            queryClient.invalidateQueries(['userTeams', userId]),
          ]);
        }
        queryClient.invalidateQueries(['userActiveTeam']);
        queryClient.invalidateQueries(['userTeams']);

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


  const questions = normalizeQuizQuestionsForDisplay(task.quiz_questions || []);
  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = questions.every((question) => answers[question.id]);

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = () => {
    if (allAnswered) {
      completeMutation.mutate({
        quiz_answers: Object.entries(answers).map(([index, answer]) => ({
          questionIndex: questions.findIndex((q) => q.id === index),
          answerId: answer,
          answer:
            questions.find((q) => q.id === index)?.options.find((opt) => opt.id === answer)?.label ??
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
            
            
            return (
              <video
                controls
                src={videoUrl}
                className="task-video"
                onError={(e) => {
                }}
                onLoadStart={() => {
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
              {currentQuestion.options.map((option, optionIndex: number) => (
                <button
                  key={option.id}
                  className={`answer-button ${
                    answers[currentQuestion.id] === option.id ? 'selected' : ''
                  }`}
                  onClick={() => handleAnswer(currentQuestion.id, option.id)}
                >
                  {option.label}
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
              disabled={!answers[currentQuestion.id]}
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
