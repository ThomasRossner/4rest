import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
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
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);
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
          <video
            controls
            src={task.video_url}
            className="task-video"
            onEnded={() => {
              // Video ended, show quiz questions
            }}
          >
            {t('tasksComponents.video.notSupported')}
          </video>
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
