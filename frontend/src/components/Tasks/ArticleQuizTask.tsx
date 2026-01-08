import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import './TaskComponents.css';

interface ArticleQuizTaskProps {
  taskId: string;
  onComplete?: () => void;
}

export function ArticleQuizTask({ taskId, onComplete }: ArticleQuizTaskProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showQuiz, setShowQuiz] = useState(false);
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

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  // Show article first, then quiz
  if (!showQuiz) {
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

        <div className="article-container">
          {task.article_url ? (
            <div className="article-url-container">
              <h3>{t('tasksComponents.article_quiz.readArticle')}</h3>
              <p className="article-instruction">
                {t('tasksComponents.article_quiz.readInstruction')}
              </p>
              <a
                href={task.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="article-link"
              >
                {task.article_url}
              </a>
            </div>
          ) : task.article_content ? (
            <div className="article-content-container">
              <h3>{t('tasksComponents.article_quiz.readArticle')}</h3>
              <div className="article-content">
                {task.article_content.split('\n').map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="task-error">
              <p>{t('tasksComponents.article_quiz.noArticle')}</p>
            </div>
          )}

          {questions.length > 0 && (
            <div className="article-quiz-prompt">
              <p>{t('tasksComponents.article_quiz.quizPrompt')}</p>
              <button onClick={handleStartQuiz} className="start-quiz-button">
                {t('tasksComponents.article_quiz.startQuiz')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show quiz questions
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
          <p>{t('tasksComponents.article_quiz.noQuestions')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-container">
      <div className="task-header">
        <h2>{task.title}</h2>
        <span className="task-points">
          {t('tasksComponents.points', { points: task.points })}
        </span>
      </div>

      <div className="quiz-container">
        <h3>{t('tasksComponents.article_quiz.quizTitle')}</h3>
        <div className="question-progress">
          {t('tasksComponents.article_quiz.questionProgress', {
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
            {t('tasksComponents.article_quiz.previous')}
          </button>
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={!answers[currentQuestionIndex]}
            >
              {t('tasksComponents.article_quiz.next')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || completeMutation.isLoading}
              className="submit-button"
            >
              {completeMutation.isLoading
                ? t('tasksComponents.article_quiz.submitting')
                : t('tasksComponents.article_quiz.complete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

