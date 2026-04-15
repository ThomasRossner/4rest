import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import { normalizeQuizQuestionsForDisplay } from '../../utils/taskQuestionI18n';
import './TaskComponents.css';

interface QuizTaskProps {
  taskId: string;
  onComplete?: () => void;
  /** Ohne Login: einmaliger Abschluss ohne Einzelantwort-API (Sperrlogik). */
  variant?: 'default' | 'public';
}

export function QuizTask({ taskId, onComplete, variant = 'default' }: QuizTaskProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<Record<number, boolean>>({});
  /** Pro Fragenindex: ISO-Zeitpunkt bis wann gesperrt (kommt von API + lokale Updates). */
  const [lockedUntilByQuestion, setLockedUntilByQuestion] = useState<Record<number, string>>({});
  const [tick, setTick] = useState(0);
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
      onSuccess: () => {
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
          queryClient.invalidateQueries(['userActiveTeam', userId]);
          queryClient.invalidateQueries(['userTeams', userId]);
        }
        queryClient.invalidateQueries(['userActiveTeam']);
        queryClient.invalidateQueries(['userTeams']);

        api.refreshMe().catch((userError) => {
          console.debug('Failed to refresh user data:', userError);
        });

        showToast({
          type: 'success',
          title: t('tasks.toast.completedTitle'),
          message: t('tasks.toast.completedMessage', { points: task?.points ?? 0, trees: TREES_PER_TASK }),
        });
        onComplete?.();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || t('tasks.toast.errorMessage');
        showToast({
          type: 'error',
          title: t('tasks.toast.errorTitle'),
          message: String(msg),
        });
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
          if (variant === 'default') {
            queryClient.invalidateQueries(['tasks']);
          }
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

  if (isLoading) return <div>{t('tasksComponents.loading')}</div>;
  if (!task) return <div>{t('tasksComponents.notFound')}</div>;

  const questions = normalizeQuizQuestionsForDisplay(task.quiz_questions || []);

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
          <p>{t('tasksComponents.quiz.noQuestions')}</p>
        </div>
      </div>
    );
  }

  if (variant === 'public') {
    const currentQuestionPub = questions[currentQuestionIndex];
    const allAnsweredPub = questions.every((question) => answers[question.id]);
    const handleSubmitPub = () => {
      if (!allAnsweredPub) return;
      completeMutation.mutate({
        quiz_answers: Object.entries(answers).map(([index, answer]) => ({
          questionIndex: questions.findIndex((q) => q.id === index),
          answerId: answer,
          answer:
            questions.find((q) => q.id === index)?.options.find((opt) => opt.id === answer)?.label ??
            answer,
        })),
      });
    };
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
        <div className="quiz-container">
          <h3>{t('tasksComponents.quiz.title')}</h3>
          <div className="question-progress">
            {t('tasksComponents.quiz.questionProgress', {
              current: currentQuestionIndex + 1,
              total: questions.length,
            })}
          </div>
          {currentQuestionPub && (
            <div className="question-card">
              <p className="question-text">{currentQuestionPub.question}</p>
              <div className="answer-options">
                {currentQuestionPub.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`answer-button ${
                      answers[currentQuestionPub.id] === option.id ? 'selected' : ''
                    }`}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [currentQuestionPub.id]: option.id }))
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="quiz-navigation">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
            >
              {t('tasksComponents.video.previous')}
            </button>
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                disabled={!answers[currentQuestionPub?.id ?? '']}
              >
                {t('tasksComponents.video.next')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitPub}
                disabled={!allAnsweredPub || completeMutation.isLoading}
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

  const currentQuestion = questions[currentQuestionIndex];
  const selectedId = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCurrentVerified = verified[currentQuestionIndex] === true;
  const allVerified = questions.every((_, i) => verified[i]);
  const allAnswered = questions.every((q) => answers[q.id]);

  const handleAnswer = (questionId: string, optionId: string) => {
    const idx = questions.findIndex((q) => q.id === questionId);
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
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

  const handleFinalSubmit = () => {
    if (!allVerified || !allAnswered) return;
    completeMutation.mutate({
      quiz_answers: questions.map((q, i) => ({
        questionIndex: i,
        answerId: answers[q.id],
        answer:
          q.options.find((opt) => opt.id === answers[q.id])?.label ?? answers[q.id] ?? '',
      })),
    });
  };

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

      {task.description && (
        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-light)' }}>
          {task.description}
        </p>
      )}

      <div className="quiz-container">
        <h3>{t('tasksComponents.quiz.title')}</h3>
        <div className="question-progress">
          {t('tasksComponents.quiz.questionProgress', {
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
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
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
            type="button"
            onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
          >
            {t('tasksComponents.quiz.previous')}
          </button>

          {!isCurrentVerified && (
            <button
              type="button"
              className="submit-button"
              onClick={handleCheckAnswer}
              disabled={!selectedId || !!lockActive || checkMutation.isLoading}
            >
              {checkMutation.isLoading
                ? t('tasksComponents.quiz.checking')
                : t('tasksComponents.quiz.checkAnswer')}
            </button>
          )}

          {isCurrentVerified && currentQuestionIndex < questions.length - 1 && (
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
            >
              {t('tasksComponents.quiz.next')}
            </button>
          )}

          {isCurrentVerified && currentQuestionIndex === questions.length - 1 && (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={!allVerified || completeMutation.isLoading}
              className="submit-button"
            >
              {completeMutation.isLoading
                ? t('tasksComponents.quiz.submitting')
                : t('tasksComponents.quiz.complete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
