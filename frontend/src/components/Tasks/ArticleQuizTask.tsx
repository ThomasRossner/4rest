import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import { normalizeQuizQuestionsForDisplay } from '../../utils/taskQuestionI18n';
import './TaskComponents.css';

interface ArticleQuizTaskProps {
  taskId: string;
  onComplete?: () => void;
  /** Ohne Login: Daten von /tasks/public/… */
  variant?: 'default' | 'public';
}

export function ArticleQuizTask({ taskId, onComplete, variant = 'default' }: ArticleQuizTaskProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<Record<number, boolean>>({});
  const [lockedUntilByQuestion, setLockedUntilByQuestion] = useState<Record<number, string>>({});
  const [tick, setTick] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { t, i18n } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const publicLang = i18n.language?.startsWith('en') ? 'en' : 'de';

  const { data: task, isLoading } = useQuery(
    variant === 'public' ? ['publicTask', taskId, publicLang] : ['task', taskId],
    () =>
      variant === 'public'
        ? api.getPublicTask(taskId, publicLang)
        : api.getTask(taskId),
    { enabled: !!taskId }
  );

  const { data: quizLockPayload } = useQuery(
    ['quizLocks', taskId],
    () => api.getQuizQuestionLocks(taskId),
    { enabled: variant === 'default' && !!taskId }
  );

  useEffect(() => {
    setLockedUntilByQuestion({});
  }, [taskId]);

  useEffect(() => {
    if (variant !== 'default' || !quizLockPayload?.locks) return;
    const next: Record<number, string> = {};
    for (const row of quizLockPayload.locks) {
      next[row.questionIndex] = row.lockedUntil;
    }
    setLockedUntilByQuestion(next);
  }, [quizLockPayload, variant]);

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

  const checkMutation = useMutation(
    (params: { questionIndex: number; answerId: string }) =>
      api.submitQuizAnswer(taskId, params.questionIndex, params.answerId),
    {
      onSuccess: (data, variables) => {
        if (data.status === 'correct') {
          setVerified((v) => ({ ...v, [variables.questionIndex]: true }));
          setLockedUntilByQuestion((prev) => {
            const n = { ...prev };
            delete n[variables.questionIndex];
            return n;
          });
          return;
        }
        if (data.lockedUntil) {
          setLockedUntilByQuestion((prev) => ({
            ...prev,
            [variables.questionIndex]: data.lockedUntil!,
          }));
        }
        const until = data.lockedUntil ? new Date(data.lockedUntil) : null;
        const minutes = until
          ? Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000))
          : 1;
        if (data.status === 'locked' || data.status === 'wrong') {
          showToast({
            type: 'error',
            title: t('tasksComponents.quiz.wrongTitle'),
            message:
              data.status === 'locked'
                ? t('tasksComponents.quiz.lockedBody', { minutes })
                : t('tasksComponents.quiz.wrongBody', { minutes }),
          });
        }
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || '';
        showToast({
          type: 'error',
          title: t('tasksComponents.quiz.errorTitle'),
          message: String(msg),
        });
      },
    }
  );

  if (isLoading) return <div>{t('tasksComponents.loading')}</div>;
  if (!task) return <div>{t('tasksComponents.notFound')}</div>;

  const questions = normalizeQuizQuestionsForDisplay(task.quiz_questions || []);
  const currentQuestion = questions[currentQuestionIndex];
  const selectedId = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCurrentVerified = verified[currentQuestionIndex] === true;
  const allVerified = questions.every((_, i) => verified[i]);
  const allAnswered = questions.every((question) => answers[question.id]);
  const lockUntil = lockedUntilByQuestion[currentQuestionIndex];

  useEffect(() => {
    if (!lockUntil || new Date(lockUntil).getTime() <= Date.now()) return;
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [lockUntil]);

  const minutesLeft = useMemo(() => {
    if (!lockUntil) return 0;
    const ms = new Date(lockUntil).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 60000));
  }, [lockUntil, tick]);

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx >= 0) {
      setVerified((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion || !selectedId) return;
    checkMutation.mutate({ questionIndex: currentQuestionIndex, answerId: selectedId });
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

  const lockActive =
    lockUntil && new Date(lockUntil).getTime() > Date.now() && !isCurrentVerified;

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

        {lockActive && (
          <p className="quiz-lock-hint" role="status">
            {t('tasksComponents.quiz.lockCountdown', { minutes: minutesLeft })}
          </p>
        )}

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
                  disabled={isCurrentVerified || !!lockActive}
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
            {t('tasksComponents.article_quiz.previous')}
          </button>

          {!isCurrentVerified && (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedId || !!lockActive || checkMutation.isLoading}
              className="submit-button"
            >
              {checkMutation.isLoading
                ? t('tasksComponents.quiz.checking')
                : t('tasksComponents.quiz.checkAnswer')}
            </button>
          )}

          {isCurrentVerified && currentQuestionIndex < questions.length - 1 && (
            <button
              onClick={() =>
                setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
              }
            >
              {t('tasksComponents.article_quiz.next')}
            </button>
          )}

          {isCurrentVerified && currentQuestionIndex === questions.length - 1 && (
            <button
              onClick={handleSubmit}
              disabled={!allVerified || !allAnswered || completeMutation.isLoading}
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

