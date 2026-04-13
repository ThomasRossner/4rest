import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [verified, setVerified] = useState<Record<number, boolean>>({});
  const [lockedUntilByQuestion, setLockedUntilByQuestion] = useState<Record<number, string>>({});
  const [tick, setTick] = useState(0);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { t, i18n } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  const lockActive =
    lockUntil && new Date(lockUntil).getTime() > Date.now() && !isCurrentVerified;
  const subtitleTracks = useMemo(() => {
    const raw = (task as any)?.video_subtitles_i18n;
    if (!raw || typeof raw !== 'object') return [];
    const de = typeof raw.de === 'string' ? raw.de.trim() : '';
    const en = typeof raw.en === 'string' ? raw.en.trim() : '';
    return [
      ...(de ? [{ lang: 'de', label: 'Deutsch', src: de }] : []),
      ...(en ? [{ lang: 'en', label: 'English', src: en }] : []),
    ];
  }, [task]);
  const preferredSubtitleLang = i18n.language?.startsWith('en') ? 'en' : 'de';

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || subtitleTracks.length === 0) return;
    const preferredTrack =
      subtitleTracks.find((track) => track.lang === preferredSubtitleLang) ??
      subtitleTracks.find((track) => track.lang === 'de') ??
      subtitleTracks[0];
    for (let i = 0; i < videoEl.textTracks.length; i += 1) {
      const textTrack = videoEl.textTracks[i];
      textTrack.mode = textTrack.language === preferredTrack.lang ? 'showing' : 'disabled';
    }
  }, [preferredSubtitleLang, subtitleTracks]);

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
                ref={videoRef}
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
                {subtitleTracks.map((track) => (
                  <track
                    key={track.lang}
                    kind="subtitles"
                    srcLang={track.lang}
                    label={track.label}
                    src={track.src}
                    default={track.lang === preferredSubtitleLang}
                  />
                ))}
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
            {t('tasksComponents.video.previous')}
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
              {t('tasksComponents.video.next')}
            </button>
          )}

          {isCurrentVerified && currentQuestionIndex === questions.length - 1 && (
            <button
              onClick={handleSubmit}
              disabled={!allVerified || !allAnswered || completeMutation.isLoading}
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
