import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { ArticleQuizTask } from '../../components/Tasks/ArticleQuizTask';
import { SurveyTask } from '../../components/Tasks/SurveyTask';
import { VideoTask } from '../../components/Tasks/VideoTask';
import { QuizTask } from '../../components/Tasks/QuizTask';
import { QRCodeTask } from '../../components/Tasks/QRCodeTask';
import { VisitLocationTask } from '../../components/Tasks/VisitLocationTask';

/** Öffentliche Aufgabe per Deep-Link `/public/task/:taskId` (Cookie-Gast-Session). */
export default function PublicTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { t, i18n } = useTranslation();
  const publicLang = i18n.language?.startsWith('en') ? 'en' : 'de';
  const [completed, setCompleted] = useState(false);

  const { data: task, isLoading, isError } = useQuery(
    ['publicTask', taskId, publicLang],
    () => api.getPublicTask(taskId!, publicLang),
    { enabled: Boolean(taskId), retry: false }
  );

  if (!taskId) {
    return (
      <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
        <p>{t('publicTask.invalidLink')}</p>
        <Link to="/login">{t('publicTask.goToLogin')}</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
        {t('common.loading')}
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
        <p style={{ marginBottom: '1rem' }}>{t('publicTask.notFound')}</p>
        <Link to="/login">{t('publicTask.goToLogin')}</Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
        <h1 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>{t('publicTask.cta.title')}</h1>
        <p style={{ marginBottom: '1.25rem' }}>{t('publicTask.cta.body')}</p>
        <p>
          <Link to="/login?mode=register">{t('publicTask.cta.register')}</Link>
          <span style={{ margin: '0 0.5rem' }}>·</span>
          <Link to="/login">{t('publicTask.cta.login')}</Link>
        </p>
      </div>
    );
  }

  const type = task.type as string;
  const onDone = () => setCompleted(true);

  if (type === 'article_quiz') {
    return <ArticleQuizTask taskId={taskId} variant="public" onComplete={onDone} />;
  }
  if (type === 'survey') {
    return <SurveyTask taskId={taskId} variant="public" onComplete={onDone} />;
  }
  if (type === 'video') {
    return <VideoTask taskId={taskId} variant="public" onComplete={onDone} />;
  }
  if (type === 'quiz') {
    return <QuizTask taskId={taskId} variant="public" onComplete={onDone} />;
  }
  if (type === 'qr') {
    return (
      <QRCodeTask
        taskId={taskId}
        qrCode={(task as { qr_code?: string }).qr_code ?? ''}
        variant="public"
        onComplete={onDone}
      />
    );
  }
  if (type === 'visit_location') {
    return <VisitLocationTask taskId={taskId} variant="public" onComplete={onDone} />;
  }
  if (type === 'photo') {
    return (
      <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
        <p>{t('publicTask.photoRequiresLogin')}</p>
        <p>
          <Link to="/login">{t('publicTask.goToLogin')}</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
      <p>{t('publicTask.unsupportedType')}</p>
    </div>
  );
}
