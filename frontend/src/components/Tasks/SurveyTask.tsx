import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import './TaskComponents.css';

interface SurveyTaskProps {
  taskId: string;
  onComplete?: () => void;
}

type SurveyQuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'rating';

interface SurveyQuestion {
  id: string;
  question: string;
  type: SurveyQuestionType;
  options?: string[];
  required?: boolean;
  minRating?: number;
  maxRating?: number;
}

export function SurveyTask({ taskId, onComplete }: SurveyTaskProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
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
    (data: { survey_responses: any }) => api.completeTask(taskId, data),
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

  const questions: SurveyQuestion[] = task.survey_questions || [];
  
  if (questions.length === 0) {
    return (
      <div className="task-container">
        <div className="task-header">
          <h2>{task.title}</h2>
          <span className="task-points">
            {t('tasksComponents.points', { points: task.points })}
          </span>
        </div>
        <div className="task-error">
          <p>{t('tasksComponents.survey.noQuestions')}</p>
        </div>
      </div>
    );
  }

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleChoice = (questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, option] };
      } else {
        return { ...prev, [questionId]: current.filter((v: string) => v !== option) };
      }
    });
  };

  const handleSubmit = () => {
    // Check required questions
    const requiredQuestions = questions.filter((q) => q.required !== false);
    const allRequiredAnswered = requiredQuestions.every((q) => {
      const answer = answers[q.id];
      if (q.type === 'multiple_choice') {
        return Array.isArray(answer) && answer.length > 0;
      }
      return answer !== undefined && answer !== null && answer !== '';
    });

    if (!allRequiredAnswered) {
      showToast({
        type: 'error',
        title: t('tasksComponents.survey.required'),
        message: t('tasksComponents.survey.requiredQuestions'),
      });
      return;
    }

    completeMutation.mutate({
      survey_responses: Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    });
  };

  const allRequiredAnswered = questions
    .filter((q) => q.required !== false)
    .every((q) => {
      const answer = answers[q.id];
      if (q.type === 'multiple_choice') {
        return Array.isArray(answer) && answer.length > 0;
      }
      return answer !== undefined && answer !== null && answer !== '';
    });

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

      <div className="survey-container">
        <h3>{t('tasksComponents.survey.title')}</h3>
        <p className="survey-instruction">
          {t('tasksComponents.survey.instruction')}
        </p>

        <div className="survey-questions">
          {questions.map((question, index) => (
            <div key={question.id} className="survey-question-card">
              <div className="survey-question-header">
                <span className="question-number">{index + 1}.</span>
                <p className="question-text">{question.question}</p>
                {question.required !== false && (
                  <span className="required-badge">{t('tasksComponents.survey.required')}</span>
                )}
              </div>

              <div className="survey-answer-area">
                {question.type === 'single_choice' && question.options && (
                  <div className="answer-options">
                    {question.options.map((option, optionIndex) => {
                      const isChecked = answers[question.id] === option;
                      return (
                        <label
                          key={optionIndex}
                          className={`radio-option ${isChecked ? 'checked' : ''}`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={isChecked}
                            onChange={(e) => handleAnswer(question.id, e.target.value)}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {question.type === 'multiple_choice' && question.options && (
                  <div className="answer-options">
                    {question.options.map((option, optionIndex) => {
                      const selected = Array.isArray(answers[question.id])
                        ? answers[question.id].includes(option)
                        : false;
                      return (
                        <label
                          key={optionIndex}
                          className={`checkbox-option ${selected ? 'checked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) =>
                              handleMultipleChoice(question.id, option, e.target.checked)
                            }
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {question.type === 'text' && (
                  <textarea
                    className="survey-text-input"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder={t('tasksComponents.survey.textPlaceholder')}
                    rows={4}
                  />
                )}

                {question.type === 'rating' && (
                  <div className="rating-options">
                    {Array.from(
                      { length: (question.maxRating || 5) - (question.minRating || 1) + 1 },
                      (_, i) => (question.minRating || 1) + i
                    ).map((rating) => (
                      <button
                        key={rating}
                        className={`rating-button ${answers[question.id] === rating ? 'selected' : ''}`}
                        onClick={() => handleAnswer(question.id, rating)}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="survey-submit">
          <button
            onClick={handleSubmit}
            disabled={!allRequiredAnswered || completeMutation.isLoading}
            className="submit-button"
          >
            {completeMutation.isLoading
              ? t('tasksComponents.survey.submitting')
              : t('tasksComponents.survey.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

