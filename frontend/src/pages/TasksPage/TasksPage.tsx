import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { forestKeyFromTaskCategory, isForestCategoryRouteKey } from '../../constants/forestCategories';
import { VideoTask } from '../../components/Tasks/VideoTask';
import { QRCodeTask } from '../../components/Tasks/QRCodeTask';
import { PhotoTask } from '../../components/Tasks/PhotoTask';
import { VisitLocationTask } from '../../components/Tasks/VisitLocationTask';
import { QuizTask } from '../../components/Tasks/QuizTask';
import { ArticleQuizTask } from '../../components/Tasks/ArticleQuizTask';
import { SurveyTask } from '../../components/Tasks/SurveyTask';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { Bookmark, CheckCircle2, Globe, ListTodo, Loader2, Lock, Map, MapPin, Star, Timer } from 'lucide-react';
import { FilterDropdown } from '../../components/Filters/FilterDropdown';
import { BackArrowIcon } from '../../components/Tasks/BackArrowIcon';
import { TaskTypeIcon } from '../../components/Tasks/taskTypeIcons';
import { UserLocationMap } from '../../components/LocationMap/UserLocationMap';
import { TaskDetailView } from '../../components/Tasks/TaskDetailView';
import { useCategoryTaskGridRowHeight } from '../../hooks/useCategoryTaskGridRowHeight';
import { descriptionPreviewPlain } from '../../utils/taskDescriptionPreview';
import {
  getCollectionTasks,
  getOnlineTasks,
  getUniquePlaces,
  HUB_SCROLL_LIMIT,
  isPlaceTask,
  isTaskOnline,
  parseTaskLocation,
  type PlaceSummary,
} from '../../utils/taskHubUtils';
import './TasksPage.css';

/** Nur diese Typen erscheinen im Filter (keine kaputten/DB-Testwerte im Dropdown). */
const KNOWN_TASK_TYPES_FOR_FILTER = new Set([
  'video',
  'quiz',
  'article_quiz',
  'survey',
  'qr',
  'photo',
  'visit_location',
]);

function isKnownTaskTypeForFilter(value: string): boolean {
  return KNOWN_TASK_TYPES_FOR_FILTER.has(value);
}

function filterTaskTypeIcon(type: string) {
  return <TaskTypeIcon type={type} size={16} strokeWidth={2} className="tasks-filter-type-icon" />;
}

function formatLockRemainingMinutes(lockedUntilIso: string): number {
  const untilTs = new Date(lockedUntilIso).getTime();
  if (!Number.isFinite(untilTs)) return 0;
  const remainingMs = Math.max(0, untilTs - Date.now());
  return Math.max(0, Math.ceil(remainingMs / 60000));
}

type HubTask = {
  id: string;
  title?: string;
  points?: number;
  thumbnail_url?: string;
  type?: string;
};

function TasksPage() {
  const { categoryKey: categoryKeyParam } = useParams<{ categoryKey: string }>();
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const placeParam = searchParams.get('place');
  const onlineParam = searchParams.get('online') === 'true';
  const mapParam = searchParams.get('map') === 'true';
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  /** Zwischenliste und Ausführung: Detail mit vollem Text + Karte */
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'not_completed' | 'completed' | 'validating'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent'>('all');
  const [showOnlineTasks, setShowOnlineTasks] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [prerequisiteTaskIdsFilter, setPrerequisiteTaskIdsFilter] = useState<string[] | null>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const {
    data: tasks,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery('tasks', () => api.getTasks(), {
    enabled: !!(user && token),
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (categoryKeyParam && !isForestCategoryRouteKey(categoryKeyParam)) {
      navigate('/tasks', { replace: true });
    }
  }, [categoryKeyParam, navigate]);

  useEffect(() => {
    setShowLocationMap(false);
  }, [categoryKeyParam]);

  useEffect(() => {
    const taskIdFromUrl = searchParams.get('task');
    if (taskIdFromUrl) {
      setDetailTaskId(taskIdFromUrl);
      return;
    }
    if (categoryKeyParam) {
      setDetailTaskId(null);
    }
  }, [categoryKeyParam, searchParams]);

  // Listen for WebSocket task updates
  React.useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'task:update' || event.detail?.type === 'photo:task:update') {
        queryClient.invalidateQueries(['tasks']);
      }
    };

    window.addEventListener('data:update', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('data:update', handleUpdate as EventListener);
    };
  }, [queryClient]);
  const { data: taskTypeParameters } = useQuery('taskTypeParameters', () => api.getTaskParameters('type'), {
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: true, // Always try to load
  });
  const { t } = useTranslation();

  const hubPlaces = useMemo(() => getUniquePlaces(tasks), [tasks]);

  const hubCollectionTasks = useMemo(
    () => getCollectionTasks(tasks ?? []).slice(0, HUB_SCROLL_LIMIT),
    [tasks]
  );

  const hubOnlineTasks = useMemo(
    () => getOnlineTasks(tasks ?? []).slice(0, HUB_SCROLL_LIMIT),
    [tasks]
  );

  const isMapView = showLocationMap || mapParam;

  const isHubView =
    !categoryKeyParam &&
    !viewParam &&
    !placeParam &&
    !onlineParam &&
    !mapParam &&
    !isMapView &&
    !selectedTask &&
    !detailTaskId;

  const isFilteredListView =
    !!categoryKeyParam || viewParam === 'all' || viewParam === 'collection' || viewParam === 'places' || !!placeParam || onlineParam;

  // Extract unique task types from loaded tasks as fallback
  const taskTypesFromTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    const uniqueTypes = new Set(
      tasks
        .map((task: any) => task.type)
        .filter(Boolean)
        .filter((t: string) => isKnownTaskTypeForFilter(t))
    );
    return Array.from(uniqueTypes);
  }, [tasks]);

  // Ungültigen Filter (z. B. nach Datenbereinigung) zurücksetzen
  React.useEffect(() => {
    if (typeFilter !== 'all' && !isKnownTaskTypeForFilter(typeFilter)) {
      setTypeFilter('all');
    }
  }, [typeFilter, tasks]);

  // All hooks must be called before any conditional returns
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    let filtered = [...tasks];

    if (categoryKeyParam) {
      filtered = filtered.filter(
        (task: { category?: string }) =>
          forestKeyFromTaskCategory(task.category) === categoryKeyParam
      );
    }

    if (placeParam) {
      filtered = filtered.filter((task: any) => {
        const loc = parseTaskLocation(task);
        return loc?.id === placeParam || task.location_id === placeParam;
      });
    } else if (viewParam === 'places') {
      filtered = filtered.filter((task: any) => isPlaceTask(task));
    }

    if (viewParam === 'collection') {
      filtered = getCollectionTasks(filtered);
    }

    // Filter by prerequisite task IDs (Type 2 prerequisites)
    if (prerequisiteTaskIdsFilter && prerequisiteTaskIdsFilter.length > 0) {
      filtered = filtered.filter((task: any) => 
        prerequisiteTaskIdsFilter.includes(task.id)
      );
    }

    // Filter by online status
    if (showOnlineTasks || onlineParam) {
      filtered = filtered.filter((task: any) => isTaskOnline(task));
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((task: any) => task.type === typeFilter);
    }

    // Filter by completion
    if (completionFilter === 'not_completed') {
      filtered = filtered.filter((task: any) => !task.completed);
    } else if (completionFilter === 'completed') {
      filtered = filtered.filter((task: any) => !!task.completed && task.verification_status !== 'pending');
    } else if (completionFilter === 'validating') {
      filtered = filtered.filter((task: any) => task.verification_status === 'pending');
    }
    // If completionFilter === 'all', show both completed and not completed

    // Filter by time (recent = last 7 days)
    if (timeFilter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((task: any) => {
        const taskDate = new Date(task.created_at || task.createdAt || Date.now());
        return taskDate >= sevenDaysAgo;
      });
    }

    // Sort: unfinished first, then validating, then completed
    filtered.sort((a: any, b: any) => {
      const aCompleted = !!a.completed;
      const bCompleted = !!b.completed;
      const aValidating = a.verification_status === 'pending';
      const bValidating = b.verification_status === 'pending';
      
      // Not completed tasks first
      if (!aCompleted && bCompleted) return -1;
      if (aCompleted && !bCompleted) return 1;
      
      // Among completed tasks, validating comes before fully completed
      if (aCompleted && bCompleted) {
        if (aValidating && !bValidating) return -1;
        if (!aValidating && bValidating) return 1;
      }
      
      // Among non-completed tasks, show normal tasks first
      if (!aCompleted && !bCompleted) {
        return 0;
      }
      
      return 0;
    });

    return filtered;
  }, [
    tasks,
    categoryKeyParam,
    viewParam,
    placeParam,
    onlineParam,
    typeFilter,
    completionFilter,
    timeFilter,
    showOnlineTasks,
    prerequisiteTaskIdsFilter,
    user?.id,
  ]);

  const globalLocationTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task: any) => {
      if (!task?.location) return false;
      let location = task.location;
      if (typeof location === 'string') {
        try {
          location = JSON.parse(location);
        } catch {
          return false;
        }
      }
      const isOnline =
        location?.is_online === true ||
        location?.is_online === 'true' ||
        String(location?.is_online).toLowerCase() === 'true';
      if (isOnline) return false;
      return location?.latitude != null && location?.longitude != null;
    });
  }, [tasks]);

  useCategoryTaskGridRowHeight(categoryScrollRef, [categoryKeyParam, filteredTasks.length]);

  const openTaskDetail = (task: { id: string; is_available?: boolean }) => {
    if (task.is_available === false) return;
    setDetailTaskId(task.id);
  };

  const handleTaskComplete = async () => {
    setSelectedTask(null);
    try {
      await refetch();
    } catch (_) {}
    try {
      await api.refreshMe();
    } catch (_) {}
  };

  // Conditional returns after all hooks
  if (isLoading || (isFetching && !tasks)) {
    return (
      <div className="tasks-page">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (isError && !tasks) {
    return (
      <div className="tasks-page">
        <EmptyState
          title={t('tasks.loadError')}
          action={
            <button type="button" className="btn-primary" onClick={() => refetch()}>
              {t('common.actions.refresh')}
            </button>
          }
        />
      </div>
    );
  }

  const wrapTaskShell = (taskMeta: { title?: string; points?: number }, node: React.ReactNode) => (
    <div className="tasks-task-shell">
      <div className="tasks-execution-header">
        <button
          type="button"
          className="tasks-back-from-task"
          onClick={() => setSelectedTask(null)}
          title={t('tasks.backToList')}
          aria-label={t('tasks.backToList')}
        >
          <BackArrowIcon className="tasks-back-from-task-icon" />
        </button>
        <h2 className="tasks-execution-title">{taskMeta.title ?? ''}</h2>
        <span className="tasks-execution-points">
          {t('tasksComponents.points', { points: Number(taskMeta.points ?? 0) })}
        </span>
      </div>
      {node}
    </div>
  );

  if (detailTaskId) {
    const openedFromUrl = searchParams.get('task') === detailTaskId;

    const clearTaskQueryParam = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('task');
      const qs = next.toString();
      navigate(qs ? `/tasks?${qs}` : '/tasks', { replace: true });
    };

    return (
      <div className="tasks-page tasks-page--detail">
        <TaskDetailView
          taskId={detailTaskId}
          listTask={tasks?.find((x: any) => x.id === detailTaskId) as Record<string, unknown> | undefined}
          onBack={() => {
            if (openedFromUrl) {
              navigate(-1);
              return;
            }
            setDetailTaskId(null);
          }}
          onStartExecution={() => {
            setSelectedTask(detailTaskId);
            setDetailTaskId(null);
            if (openedFromUrl) {
              clearTaskQueryParam();
            }
          }}
        />
      </div>
    );
  }

  if (selectedTask) {
    const task = tasks?.find((t: any) => t.id === selectedTask);
    if (!task) return <div>{t('tasks.notFound')}</div>;

    if (task.type === 'video') {
      return wrapTaskShell(task, <VideoTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'quiz') {
      return wrapTaskShell(task, <QuizTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'article_quiz') {
      return wrapTaskShell(task, <ArticleQuizTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'survey') {
      return wrapTaskShell(task, <SurveyTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'qr') {
      return wrapTaskShell(
        task,
        <QRCodeTask taskId={task.id} qrCode={task.qr_code} onComplete={handleTaskComplete} />
      );
    }
    if (task.type === 'photo') {
      return wrapTaskShell(task, <PhotoTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'visit_location') {
      return wrapTaskShell(task, <VisitLocationTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="tasks-page">
        <EmptyState
          title={t('tasks.empty.all.title')}
          description={t('tasks.empty.all.description')}
        />
      </div>
    );
  }

  if (categoryKeyParam && !isForestCategoryRouteKey(categoryKeyParam)) {
    return (
      <div className="tasks-page">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  const renderHubTaskTile = (task: HubTask) => (
    <button
      key={task.id}
      type="button"
      className="glass-task-tile"
      onClick={() => setDetailTaskId(task.id)}
    >
      <span className="glass-task-tile__thumb">
        {task.thumbnail_url ? (
          <img src={task.thumbnail_url} alt="" />
        ) : (
          <TaskTypeIcon type={task.type ?? ''} size={22} strokeWidth={2} />
        )}
      </span>
      <span className="glass-task-tile__title">{task.title}</span>
      <span className="glass-points-badge">
        <Star size={10} strokeWidth={2} aria-hidden />
        {t('tasksComponents.points', { points: Number(task.points ?? 0) })}
      </span>
    </button>
  );

  const renderPlaceTile = (place: PlaceSummary) => (
    <Link key={place.id} to={`/tasks?place=${encodeURIComponent(place.id)}`} className="glass-task-tile">
      <span className="glass-task-tile__thumb">
        {place.image_url ? (
          <img src={place.image_url} alt="" />
        ) : (
          <MapPin size={22} strokeWidth={2} aria-hidden />
        )}
      </span>
      <span className="glass-task-tile__title">{place.name}</span>
      <span className="glass-points-badge">
        {t('tasks.hub.placeTaskCount', { count: place.taskCount })}
      </span>
    </Link>
  );

  if (isHubView) {
    const visiblePlaces = hubPlaces.slice(0, HUB_SCROLL_LIMIT);

    return (
      <div className="tasks-page tasks-page--hub tasks-page--hub-sections">
        <section className="glass-section tasks-hub-section" aria-labelledby="tasks-hub-overview-title">
          <h2 id="tasks-hub-overview-title" className="glass-section__title">
            {t('tasks.hub.sections.overview')}
          </h2>
          <div className="tasks-hub-overview-actions">
            <Link to="/tasks?view=all" className="glass-action-card tasks-hub-action-card">
              <span className="glass-action-card__head">
                <ListTodo size={16} strokeWidth={2} aria-hidden />
                {t('tasks.hub.allTasks.title')}
              </span>
            </Link>
            <Link to="/tasks?map=true" className="glass-action-card tasks-hub-action-card">
              <span className="glass-action-card__head">
                <Map size={16} strokeWidth={2} aria-hidden />
                {t('tasks.hub.mapView.title')}
              </span>
            </Link>
          </div>
        </section>

        {visiblePlaces.length > 0 && (
          <section className="glass-section tasks-hub-section" aria-labelledby="tasks-hub-places-title">
            <h2 id="tasks-hub-places-title" className="glass-section__title">
              {t('tasks.hub.sections.places')}
            </h2>
            <div className="glass-scroll-row tasks-hub-scroll-row">
              {visiblePlaces.map(renderPlaceTile)}
              <Link to="/tasks?view=places" className="glass-task-tile glass-task-tile--all">
                <MapPin size={22} strokeWidth={2} aria-hidden />
                <span className="glass-task-tile__title">{t('tasks.hub.all')}</span>
              </Link>
            </div>
          </section>
        )}

        {hubOnlineTasks.length > 0 && (
          <section className="glass-section tasks-hub-section" aria-labelledby="tasks-hub-online-title">
            <h2 id="tasks-hub-online-title" className="glass-section__title">
              {t('tasks.hub.sections.online')}
            </h2>
            <div className="glass-scroll-row tasks-hub-scroll-row">
              {hubOnlineTasks.map(renderHubTaskTile)}
              <Link to="/tasks?online=true" className="glass-task-tile glass-task-tile--all">
                <Globe size={22} strokeWidth={2} aria-hidden />
                <span className="glass-task-tile__title">{t('tasks.hub.all')}</span>
              </Link>
            </div>
          </section>
        )}

        {hubCollectionTasks.length > 0 && (
          <section className="glass-section tasks-hub-section" aria-labelledby="tasks-hub-collection-title">
            <h2 id="tasks-hub-collection-title" className="glass-section__title">
              {t('tasks.hub.sections.collection')}
            </h2>
            <div className="glass-scroll-row tasks-hub-scroll-row">
              {hubCollectionTasks.map(renderHubTaskTile)}
              <Link to="/tasks?view=collection" className="glass-task-tile glass-task-tile--all">
                <Bookmark size={22} strokeWidth={2} aria-hidden />
                <span className="glass-task-tile__title">{t('tasks.hub.all')}</span>
              </Link>
            </div>
          </section>
        )}

      </div>
    );
  }

  if (isMapView) {
    const mapTasks = categoryKeyParam ? filteredTasks : globalLocationTasks;
    return (
      <div className="tasks-page tasks-page--map">
        <div className="tasks-map-header">
          <button
            type="button"
            className="tasks-map-back"
            onClick={() => {
              setShowLocationMap(false);
              if (mapParam) navigate('/tasks');
            }}
            title={t('tasks.backToList')}
            aria-label={t('tasks.backToList')}
          >
            <BackArrowIcon className="tasks-icon-back-svg" />
          </button>
        </div>
        <div className="tasks-map-body">
          <UserLocationMap
            variant="tasks"
            height="calc(100dvh - 200px)"
            tasks={mapTasks as any[]}
            onTaskClick={(taskId) => {
              setShowLocationMap(false);
              setDetailTaskId(taskId);
            }}
          />
        </div>
      </div>
    );
  }

  if (!isFilteredListView) {
    return null;
  }

  const listViewTitle = (() => {
    if (categoryKeyParam && isForestCategoryRouteKey(categoryKeyParam)) {
      return t(`tasks.categories.${categoryKeyParam}`);
    }
    if (placeParam) {
      const place = hubPlaces.find((p) => p.id === placeParam);
      return place?.name ?? t('tasks.hub.sections.places');
    }
    if (viewParam === 'all') return t('tasks.hub.allTasks.title');
    if (viewParam === 'collection') return t('tasks.hub.sections.collection');
    if (viewParam === 'places') return t('tasks.hub.sections.places');
    if (onlineParam) return t('tasks.hub.sections.online');
    return t('tasks.title');
  })();

  const activePlace = placeParam ? hubPlaces.find((p) => p.id === placeParam) : undefined;

  const backToHubLabel = t('tasks.hub.backToHub');

  const showCategoryClearFilter =
    (prerequisiteTaskIdsFilter && prerequisiteTaskIdsFilter.length > 0) ||
    showOnlineTasks ||
    Boolean(onlineParam) ||
    Boolean(placeParam);

  const handleCategoryClearFilter = () => {
    if (prerequisiteTaskIdsFilter && prerequisiteTaskIdsFilter.length > 0) {
      setPrerequisiteTaskIdsFilter(null);
      return;
    }
    if (showOnlineTasks || onlineParam) {
      setShowOnlineTasks(false);
      navigate('/tasks');
      return;
    }
    if (placeParam) {
      navigate('/tasks');
    }
  };

  return (
      <div className="tasks-page tasks-page--category">
        <div className="tasks-category-sticky">
        <div className="tasks-header tasks-header--category">
          <div className="tasks-header-category-row">
            <button
              type="button"
              className="tasks-icon-back"
              onClick={() => navigate('/tasks')}
              title={backToHubLabel}
              aria-label={backToHubLabel}
            >
              <BackArrowIcon className="tasks-icon-back-svg" />
            </button>
            {activePlace?.image_url && (
              <img
                src={activePlace.image_url}
                alt=""
                className="tasks-header-place-image"
              />
            )}
            <h2 className="tasks-header-category-title">{listViewTitle}</h2>
            {showCategoryClearFilter && (
              <div className="tasks-header-category-actions">
                <button
                  type="button"
                  className="location-button"
                  onClick={handleCategoryClearFilter}
                >
                  {t('tasks.prerequisites.clearFilter')}
                </button>
              </div>
            )}
          </div>
        </div>
      
      <div className="tasks-filters-row">
        <FilterDropdown
          value={typeFilter}
          onChange={(value) => setTypeFilter(value)}
          options={[
            { value: 'all', label: t('tasks.filters.type.all') },
            ...(taskTypeParameters && Array.isArray(taskTypeParameters) && taskTypeParameters.length > 0
              ? taskTypeParameters
                  .filter((param: any) => param?.value && isKnownTaskTypeForFilter(String(param.value)))
                  .map((param: any) => ({
                    value: param.value,
                    label: t(`tasks.filters.type.${param.value}`, { defaultValue: param.value }),
                    icon: filterTaskTypeIcon(param.value),
                  }))
              : taskTypesFromTasks.length > 0
              ? taskTypesFromTasks.map((type: string) => ({
                  value: type,
                  label: t(`tasks.filters.type.${type}`, { defaultValue: type }),
                  icon: filterTaskTypeIcon(type),
                }))
              : [
                  // Final fallback to hardcoded types
                  { value: 'video', label: t('tasks.filters.type.video'), icon: filterTaskTypeIcon('video') },
                  { value: 'quiz', label: t('tasks.filters.type.quiz'), icon: filterTaskTypeIcon('quiz') },
                  { value: 'article_quiz', label: t('tasks.filters.type.article_quiz'), icon: filterTaskTypeIcon('article_quiz') },
                  { value: 'survey', label: t('tasks.filters.type.survey'), icon: filterTaskTypeIcon('survey') },
                  { value: 'qr', label: t('tasks.filters.type.qr'), icon: filterTaskTypeIcon('qr') },
                  { value: 'photo', label: t('tasks.filters.type.photo'), icon: filterTaskTypeIcon('photo') },
                  { value: 'visit_location', label: t('tasks.filters.type.visit_location'), icon: filterTaskTypeIcon('visit_location') },
                ]),
          ]}
        />
        <FilterDropdown
          value={completionFilter}
          onChange={(value) => setCompletionFilter(value as typeof completionFilter)}
          options={[
            { value: 'all', label: t('tasks.filters.completion.all') },
            { value: 'not_completed', label: t('tasks.filters.completion.not_completed') },
            { value: 'validating', label: t('tasks.filters.completion.validating') },
            { value: 'completed', label: t('tasks.filters.completion.completed') },
          ]}
        />
        <FilterDropdown
          value={timeFilter}
          onChange={(value) => setTimeFilter(value as typeof timeFilter)}
          options={[
            { value: 'all', label: t('tasks.filters.time.all') },
            { value: 'recent', label: t('tasks.filters.time.recent') },
          ]}
        />
      </div>
        </div>

      <div className="tasks-category-scroll" ref={categoryScrollRef}>
      {filteredTasks.length === 0 ? (
        <EmptyState
          title={t('tasks.empty.filtered.title')}
          description={t('tasks.empty.filtered.description')}
        />
      ) : (
        <div className="tasks-category-matrix">
          {filteredTasks.map((task: any) => {
            const isLocked = task.is_available === false;
            const isCompleted = !!task.completed && task.verification_status !== 'pending';
            const isValidating = task.verification_status === 'pending';
            const quizLockedUntil =
              typeof task.quiz_locked_until === 'string' ? task.quiz_locked_until : null;
            const isQuizLockedByWrongAnswer =
              !!quizLockedUntil &&
              !isCompleted &&
              new Date(quizLockedUntil).getTime() > Date.now();
            const quizLockRemainingMinutes = isQuizLockedByWrongAnswer
              ? formatLockRemainingMinutes(quizLockedUntil)
              : 0;
            const previewText = descriptionPreviewPlain(task.teaser ?? task.description, 60);
            return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              aria-disabled={isLocked}
              className={`task-card task-card--list-row ${isCompleted ? 'task-card-completed' : ''} ${isValidating ? 'task-card-validating' : ''} ${isLocked ? 'task-card-locked' : ''} ${isQuizLockedByWrongAnswer ? 'task-card-quiz-locked' : ''}`}
              onClick={() => openTaskDetail(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openTaskDetail(task);
                }
              }}
            >
              <span className="task-list-thumb">
                {task.thumbnail_url ? (
                  <img src={task.thumbnail_url} alt="" className="task-list-thumb__image" />
                ) : (
                  <TaskTypeIcon type={task.type} size={28} strokeWidth={2} className="task-list-thumb__icon" />
                )}
              </span>
              <div className="task-list-body">
                <h3 className="task-list-title">{task.title}</h3>
                {isQuizLockedByWrongAnswer && (
                  <p className="task-list-hint">
                    {t('tasks.detail.quizLockedRemaining', { minutes: quizLockRemainingMinutes })}
                  </p>
                )}
                {isLocked ? (
                  <p className="task-list-hint">{t('tasks.prerequisites.unlockMessage')}</p>
                ) : (
                  <p className={`task-list-preview ${!previewText ? 'task-list-preview--empty' : ''}`}>
                    {previewText || t('tasks.tile.noPreview')}
                  </p>
                )}
                {task.prerequisite_task_ids && Array.isArray(task.prerequisite_task_ids) && task.prerequisite_task_ids.length > 0 && (
                  <button
                    type="button"
                    className="task-prerequisite-button task-prerequisite-button--list"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrerequisiteTaskIdsFilter(task.prerequisite_task_ids);
                    }}
                  >
                    {t('tasks.prerequisites.showPrerequisites')}
                  </button>
                )}
              </div>
              <div className="task-list-meta">
                <span className="glass-points-badge">
                  <Star size={12} strokeWidth={2} aria-hidden />
                  {t('tasksComponents.points', { points: task.points })}
                </span>
                <div className="task-list-status-icons">
                  {isCompleted && (
                    <span className="task-list-status" title={t('tasks.badges.completed')}>
                      <CheckCircle2 size={15} strokeWidth={2.5} aria-hidden />
                    </span>
                  )}
                  {isValidating && (
                    <span className="task-list-status" title={t('tasks.badges.validating')}>
                      <Loader2 size={15} strokeWidth={2.5} className="task-tile-badge-svg--spin" aria-hidden />
                    </span>
                  )}
                  {isLocked && (
                    <span className="task-list-status" title={t('tasks.badges.locked')}>
                      <Lock size={14} strokeWidth={2.5} aria-hidden />
                    </span>
                  )}
                  {isQuizLockedByWrongAnswer && (
                    <span className="task-list-status" title={t('tasks.detail.quizLockedHint')}>
                      <Timer size={14} strokeWidth={2.5} aria-hidden />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

export default TasksPage;

