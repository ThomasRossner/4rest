import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { api } from '../../services/api';
import { UserLocationMap } from '../LocationMap/UserLocationMap';
import { BackArrowIcon } from './BackArrowIcon';
import './TaskDetailView.css';

type TaskDetailViewProps = {
  taskId: string;
  /** Daten aus der Liste (Fallback, falls GET /tasks/:id langsam fehlschlägt). */
  listTask?: Record<string, unknown> | null;
  onBack: () => void;
  /** Startet die bestehende Aufgaben-UI (Video, Quiz, Ort, …). */
  onStartExecution: () => void;
  /** Öffentliche Aufgabe: GET /tasks/public/:id (ohne JWT). */
  dataSource?: 'authenticated' | 'public';
  /** Nur bei dataSource public — Sprache für API (i18n-Default wenn fehlt). */
  publicLang?: 'de' | 'en';
  /** Ersetzt den Standard-Footer (Hinweise + Start), z. B. Foto ohne Login. */
  footerReplacement?: ReactNode;
};

function formatCompletedAt(iso: unknown, localeHint: string): string {
  if (iso == null || iso === '') return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  const locale = localeHint.startsWith('de') ? 'de-DE' : 'en-US';
  return d.toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' });
}

function formatLockRemainingMinutes(lockedUntilIso: string): number {
  const untilTs = new Date(lockedUntilIso).getTime();
  if (!Number.isFinite(untilTs)) return 0;
  const remainingMs = Math.max(0, untilTs - Date.now());
  return Math.max(0, Math.ceil(remainingMs / 60000));
}

export function TaskDetailView({
  taskId,
  listTask,
  onBack,
  onStartExecution,
  dataSource = 'authenticated',
  publicLang,
  footerReplacement,
}: TaskDetailViewProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const completedVideoRef = useRef<HTMLVideoElement | null>(null);
  const lang = publicLang ?? (i18n.language?.startsWith('en') ? 'en' : 'de');
  /** Optimistischer Override des Sammlungs-Status (null = Serverwert verwenden). */
  const [collectionOverride, setCollectionOverride] = useState<boolean | null>(null);
  const [collectionBusy, setCollectionBusy] = useState(false);

  useEffect(() => {
    setCollectionOverride(null);
  }, [taskId]);

  const authQuery = useQuery(
    ['task', taskId],
    () => api.getTask(taskId),
    {
      enabled: !!taskId && dataSource === 'authenticated',
      retry: 1,
    }
  );

  const publicQuery = useQuery(
    ['publicTask', taskId, lang],
    () => api.getPublicTask(taskId, lang),
    {
      enabled: !!taskId && dataSource === 'public',
      retry: 1,
    }
  );

  const { data: fetchedTask, isLoading, isError, error, refetch } =
    dataSource === 'public' ? publicQuery : authQuery;

  const task = (fetchedTask as Record<string, unknown> | undefined) ?? listTask ?? undefined;
  const taskType = String((task as Record<string, unknown> | undefined)?.type ?? '');
  const isQuizLikeTask = taskType === 'quiz' || taskType === 'article_quiz' || taskType === 'video';

  const quizLocksQuery = useQuery(
    ['quizLocks', taskId, 'detail'],
    () => api.getQuizQuestionLocks(taskId),
    {
      enabled: Boolean(taskId) && dataSource === 'authenticated' && isQuizLikeTask,
      staleTime: 30_000,
      refetchInterval: 30_000,
    }
  );

  const backNavTitle =
    dataSource === 'public' ? t('publicTask.backToOverview') : t('tasks.backToList');
  const backButtonLabel =
    dataSource === 'public' ? t('publicTask.backToOverview') : t('tasks.categories.backToCategories');

  if (isLoading && !listTask) {
    return (
      <div className="task-detail-view task-detail-view--loading">
        <p>{t('tasksComponents.loading')}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-view">
        <p className="task-detail-error">
          {isError && error
            ? (error as { message?: string }).message || String(error)
            : t('tasksComponents.notFound')}
        </p>
        <button type="button" className="task-detail-back" onClick={onBack}>
          {backButtonLabel}
        </button>
        {isError ? (
          <button type="button" className="task-detail-retry" onClick={() => refetch()}>
            {t('common.actions.refresh')}
          </button>
        ) : null}
      </div>
    );
  }

  const row = task as Record<string, unknown>;

  const isCompleted = !!row.completed && row.verification_status !== 'pending';
  const isValidating = row.verification_status === 'pending';
  const isLocked = row.is_available === false;

  const showCollectionToggle = dataSource === 'authenticated';
  const inCollection = collectionOverride ?? Boolean(row.in_collection);

  const handleToggleCollection = async () => {
    if (collectionBusy) return;
    const next = !inCollection;
    setCollectionOverride(next);
    setCollectionBusy(true);
    try {
      if (next) {
        await api.addTaskToCollection(taskId);
      } else {
        await api.removeTaskFromCollection(taskId);
      }
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['task', taskId]);
    } catch (_) {
      setCollectionOverride(!next);
    } finally {
      setCollectionBusy(false);
    }
  };

  const activeQuizLocks = (quizLocksQuery.data?.locks ?? []).filter((l) => new Date(l.lockedUntil).getTime() > Date.now());
  const maxQuizLockedUntil =
    activeQuizLocks.length > 0
      ? activeQuizLocks
          .map((l) => l.lockedUntil)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;
  const isQuizLockedByWrongAnswer = Boolean(maxQuizLockedUntil) && !isCompleted;
  const quizLockRemainingMinutes = maxQuizLockedUntil ? formatLockRemainingMinutes(maxQuizLockedUntil) : 0;

  const completedAtLabel = formatCompletedAt(row.completed_at, i18n.language || 'de');

  const taskForMapPreview = useMemo(() => {
    if (row.type !== 'visit_location') return null;
    if (row.location) return row as any;
    const lat = row.target_latitude;
    const lng = row.target_longitude;
    if (lat == null || lng == null) return null;
    return {
      ...row,
      location: {
        latitude: Number(lat),
        longitude: Number(lng),
        is_online: false,
      },
    };
  }, [row]);

  const showMapPreview = Boolean(taskForMapPreview);
  const showCompletedVideo =
    isCompleted &&
    taskType === 'video' &&
    typeof row.video_url === 'string' &&
    row.video_url.trim() !== '';
  const completedVideoUrl = showCompletedVideo ? String(row.video_url).trim() : '';
  const isCompletedVideoYouTube =
    completedVideoUrl.includes('youtube.com') || completedVideoUrl.includes('youtu.be');
  const completedVideoEmbedUrl = useMemo(() => {
    if (!isCompletedVideoYouTube) return completedVideoUrl;
    if (completedVideoUrl.includes('/shorts/')) {
      const videoId = completedVideoUrl.split('/shorts/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : completedVideoUrl;
    }
    if (completedVideoUrl.includes('youtube.com/watch?v=')) {
      const videoId = completedVideoUrl.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : completedVideoUrl;
    }
    if (completedVideoUrl.includes('youtu.be/')) {
      const videoId = completedVideoUrl.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : completedVideoUrl;
    }
    return completedVideoUrl;
  }, [completedVideoUrl, isCompletedVideoYouTube]);
  const videoSubtitleTracks = useMemo(() => {
    const raw = row.video_subtitles_i18n;
    if (!raw || typeof raw !== 'object') return [];
    const subtitleMap = raw as Record<string, unknown>;
    const de = typeof subtitleMap.de === 'string' ? subtitleMap.de.trim() : '';
    const en = typeof subtitleMap.en === 'string' ? subtitleMap.en.trim() : '';
    return [
      ...(de ? [{ lang: 'de', label: 'Deutsch', src: de }] : []),
      ...(en ? [{ lang: 'en', label: 'English', src: en }] : []),
    ];
  }, [row.video_subtitles_i18n]);
  const preferredSubtitleLang = i18n.language?.startsWith('en') ? 'en' : 'de';

  useEffect(() => {
    const videoEl = completedVideoRef.current;
    if (!videoEl || videoSubtitleTracks.length === 0) return;
    const preferredTrack =
      videoSubtitleTracks.find((track) => track.lang === preferredSubtitleLang) ??
      videoSubtitleTracks.find((track) => track.lang === 'de') ??
      videoSubtitleTracks[0];
    for (let i = 0; i < videoEl.textTracks.length; i += 1) {
      const textTrack = videoEl.textTracks[i];
      textTrack.mode = textTrack.language === preferredTrack.lang ? 'showing' : 'disabled';
    }
  }, [preferredSubtitleLang, videoSubtitleTracks, showCompletedVideo]);

  return (
    <div className="task-detail-view">
      <div className="task-detail-view-header">
        <button
          type="button"
          className="task-detail-back"
          onClick={onBack}
          title={backNavTitle}
          aria-label={backNavTitle}
        >
          <BackArrowIcon className="task-detail-back-icon" />
        </button>
        <div className="task-detail-view-heading">
          <h1 className="task-detail-title">{String(row.title ?? '')}</h1>
          <span className="task-detail-points">
            {t('tasksComponents.points', { points: Number(row.points ?? 0) })}
          </span>
          {showCollectionToggle && (
            <button
              type="button"
              className={`task-detail-collection-toggle ${inCollection ? 'task-detail-collection-toggle--active' : ''}`}
              onClick={handleToggleCollection}
              disabled={collectionBusy}
              aria-pressed={inCollection}
              title={inCollection ? t('tasks.collection.remove') : t('tasks.collection.add')}
              aria-label={inCollection ? t('tasks.collection.remove') : t('tasks.collection.add')}
            >
              {inCollection ? (
                <BookmarkCheck size={20} strokeWidth={2} aria-hidden />
              ) : (
                <Bookmark size={20} strokeWidth={2} aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="task-detail-view-body">
        {row.description ? (
          <div className="task-detail-description">{String(row.description)}</div>
        ) : (
          <p className="task-detail-description task-detail-description--empty">{t('tasks.detail.noDescription')}</p>
        )}

        {showCompletedVideo && (
          <div className="task-detail-video-block">
            <h2 className="task-detail-section-title">{t('tasks.detail.videoSection')}</h2>
            {isCompletedVideoYouTube ? (
              <iframe
                className="task-detail-video-player"
                src={completedVideoEmbedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
              />
            ) : (
              <video
                ref={completedVideoRef}
                className="task-detail-video-player"
                src={completedVideoUrl}
                controls
                preload="metadata"
              >
                {videoSubtitleTracks.map((track) => (
                  <track
                    key={track.lang}
                    kind="subtitles"
                    srcLang={track.lang}
                    label={track.label}
                    src={track.src}
                    default={track.lang === preferredSubtitleLang}
                  />
                ))}
              </video>
            )}
          </div>
        )}

        {showMapPreview && taskForMapPreview && (
          <div className="task-detail-map-block">
            <h2 className="task-detail-section-title">{t('tasks.detail.locationSection')}</h2>
            <UserLocationMap
              variant="tasks"
              height="min(45vh, 320px)"
              tasks={[taskForMapPreview as any]}
              previewMode
            />
          </div>
        )}
      </div>

      {footerReplacement != null ? (
        <div className="task-detail-view-footer">{footerReplacement}</div>
      ) : (
        <div className="task-detail-view-footer">
          {isLocked && !isCompleted && (
            <p className="task-detail-footer-hint">{t('tasks.prerequisites.unlockMessage')}</p>
          )}
          {isValidating && (
            <p className="task-detail-footer-hint">{t('tasks.badges.validating')}</p>
          )}
          {isQuizLockedByWrongAnswer && (
            <div className="task-detail-completed-meta">
              <p className="task-detail-footer-hint">{t('tasks.detail.quizLockedHint')}</p>
              <p className="task-detail-completed-date">
                {t('tasks.detail.quizLockedRemaining', { minutes: quizLockRemainingMinutes })}
              </p>
            </div>
          )}
          {isCompleted && (
            <div className="task-detail-completed-meta">
              {completedAtLabel ? (
                <p className="task-detail-completed-date">{t('tasks.detail.completedAt', { date: completedAtLabel })}</p>
              ) : (
                <p className="task-detail-footer-hint">{t('tasks.badges.completed')}</p>
              )}
            </div>
          )}
          {!isCompleted && !isQuizLockedByWrongAnswer && (
            <button
              type="button"
              className="task-detail-start"
              onClick={onStartExecution}
              disabled={isValidating || isLocked}
            >
              {isValidating
                ? t('tasks.buttons.validating')
                : isLocked
                  ? t('tasks.buttons.locked')
                  : t('tasks.buttons.start')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
