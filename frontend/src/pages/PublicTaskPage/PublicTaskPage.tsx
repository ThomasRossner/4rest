import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { ArticleQuizTask } from '../../components/Tasks/ArticleQuizTask';
import { SurveyTask } from '../../components/Tasks/SurveyTask';
import { VideoTask } from '../../components/Tasks/VideoTask';
import { QuizTask } from '../../components/Tasks/QuizTask';
import { QRCodeTask } from '../../components/Tasks/QRCodeTask';
import { VisitLocationTask } from '../../components/Tasks/VisitLocationTask';
import { TaskDetailView } from '../../components/Tasks/TaskDetailView';
import { BackArrowIcon } from '../../components/Tasks/BackArrowIcon';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import '../TasksPage/TasksPage.css';
import './PublicTaskPage.css';

const RUNNABLE_PUBLIC_TYPES = new Set([
  'article_quiz',
  'survey',
  'video',
  'quiz',
  'qr',
  'visit_location',
]);

type Phase = 'detail' | 'run' | 'done';

/** Öffentliche Aufgabe per Deep-Link `/public/task/:taskId` (Cookie-Gast-Session). */
export default function PublicTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const publicLang = i18n.language?.startsWith('en') ? 'en' : 'de';
  const [phase, setPhase] = useState<Phase>('detail');

  useEffect(() => {
    setPhase('detail');
  }, [taskId]);

  const { data: task, isLoading, isError } = useQuery(
    ['publicTask', taskId, publicLang],
    () => api.getPublicTask(taskId!, publicLang),
    { enabled: Boolean(taskId), retry: false }
  );

  const shellClass = 'tasks-page tasks-page--detail tasks-page--public-task';

  const wrapRun = (node: ReactNode) => (
    <div className={shellClass}>
      <div className="tasks-task-shell">
        <button
          type="button"
          className="tasks-back-from-task"
          onClick={() => setPhase('detail')}
          title={t('publicTask.backToOverview')}
          aria-label={t('publicTask.backToOverview')}
        >
          <BackArrowIcon className="tasks-back-from-task-icon" />
        </button>
        {node}
      </div>
    </div>
  );

  const onTaskDone = () => setPhase('done');

  if (!taskId) {
    return (
      <div className={shellClass}>
        <div className="task-detail-view">
          <p className="task-detail-error">{t('publicTask.invalidLink')}</p>
          <p style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
            <Link to="/public/guest">{t('publicTask.backToOverview')}</Link>
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={shellClass}>
        <div className="task-detail-view task-detail-view--loading">
          <p>{t('tasksComponents.loading')}</p>
          <LoadingSkeleton lines={4} />
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className={shellClass}>
        <div className="task-detail-view">
          <p className="task-detail-error">{t('publicTask.notFound')}</p>
          <button type="button" className="task-detail-retry" onClick={() => navigate('/public/guest')}>
            {t('publicTask.backToOverview')}
          </button>
        </div>
      </div>
    );
  }

  const type = task.type as string;

  if (phase === 'done') {
    return (
      <div className={shellClass}>
        <div className="task-detail-view public-task-completion">
          <div className="task-detail-view-body">
            <h1 className="task-detail-title">{t('publicTask.cta.title')}</h1>
            <p className="task-detail-description">{t('publicTask.cta.body')}</p>
            <div className="public-task-completion-links">
              <Link to="/login?mode=register" className="task-detail-start">
                {t('publicTask.cta.register')}
              </Link>
              <span aria-hidden>·</span>
              <Link to="/login" className="task-detail-start">
                {t('publicTask.cta.login')}
              </Link>
            </div>
            <p style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
              <Link to="/public/guest">{t('publicTask.backToOverview')}</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'run') {
    switch (type) {
      case 'article_quiz':
        return wrapRun(<ArticleQuizTask taskId={taskId} variant="public" onComplete={onTaskDone} />);
      case 'survey':
        return wrapRun(<SurveyTask taskId={taskId} variant="public" onComplete={onTaskDone} />);
      case 'video':
        return wrapRun(<VideoTask taskId={taskId} variant="public" onComplete={onTaskDone} skipVideo />);
      case 'quiz':
        return wrapRun(<QuizTask taskId={taskId} variant="public" onComplete={onTaskDone} />);
      case 'qr':
        return wrapRun(
          <QRCodeTask
            taskId={taskId}
            qrCode={(task as { qr_code?: string }).qr_code ?? ''}
            variant="public"
            onComplete={onTaskDone}
          />
        );
      case 'visit_location':
        return wrapRun(<VisitLocationTask taskId={taskId} variant="public" onComplete={onTaskDone} />);
      default:
        return (
          <div className={shellClass}>
            <div className="task-detail-view">
              <p className="task-detail-error">{t('publicTask.unsupportedType')}</p>
              <button type="button" className="task-detail-retry" onClick={() => setPhase('detail')}>
                {t('publicTask.backToOverview')}
              </button>
            </div>
          </div>
        );
    }
  }

  if (type === 'photo') {
    return (
      <div className={shellClass}>
        <TaskDetailView
          taskId={taskId}
          dataSource="public"
          publicLang={publicLang}
          listTask={task as Record<string, unknown>}
          onBack={() => navigate('/public/guest')}
          onStartExecution={() => {}}
          footerReplacement={
            <>
              <p className="task-detail-footer-hint">{t('publicTask.photoRequiresLogin')}</p>
              <Link to="/login" className="task-detail-start">
                {t('publicTask.goToLogin')}
              </Link>
            </>
          }
        />
      </div>
    );
  }

  if (!RUNNABLE_PUBLIC_TYPES.has(type)) {
    return (
      <div className={shellClass}>
        <div className="task-detail-view">
          <div className="task-detail-view-header">
            <button
              type="button"
              className="task-detail-back"
              onClick={() => navigate('/public/guest')}
              title={t('publicTask.backToOverview')}
              aria-label={t('publicTask.backToOverview')}
            >
              <BackArrowIcon className="task-detail-back-icon" />
            </button>
            <div className="task-detail-view-heading">
              <h1 className="task-detail-title">{task.title}</h1>
              <span className="task-detail-points">
                {t('tasksComponents.points', { points: task.points ?? 0 })}
              </span>
            </div>
          </div>
          <div className="task-detail-view-body">
            <p className="task-detail-description">{t('publicTask.unsupportedType')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <TaskDetailView
        taskId={taskId}
        dataSource="public"
        publicLang={publicLang}
        listTask={task as Record<string, unknown>}
        onBack={() => navigate('/public/guest')}
        onStartExecution={() => setPhase('run')}
      />
    </div>
  );
}
