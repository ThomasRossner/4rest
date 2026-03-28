import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  FOREST_CATEGORY_KEYS,
  OTHER_FOREST_CATEGORY_KEY,
  forestKeyFromTaskCategory,
  isForestCategoryRouteKey,
} from '../../constants/forestCategories';
import { VideoTask } from '../../components/Tasks/VideoTask';
import { QRCodeTask } from '../../components/Tasks/QRCodeTask';
import { PhotoTask } from '../../components/Tasks/PhotoTask';
import { VisitLocationTask } from '../../components/Tasks/VisitLocationTask';
import { QuizTask } from '../../components/Tasks/QuizTask';
import { ArticleQuizTask } from '../../components/Tasks/ArticleQuizTask';
import { SurveyTask } from '../../components/Tasks/SurveyTask';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { FilterDropdown } from '../../components/Filters/FilterDropdown';
import { QRCodeIcon } from '../../components/Icons/QRCodeIcon';
import { BackArrowIcon } from '../../components/Tasks/BackArrowIcon';
import { CategoryHubIcon } from '../../components/Tasks/CategoryHubIcon';
import { UserLocationMap } from '../../components/LocationMap/UserLocationMap';
import './TasksPage.css';

// Map task types to icons and translation keys
const getTaskTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return '🎥';
    case 'quiz': return '❓';
    case 'article_quiz': return '📄';
    case 'survey': return '📋';
    case 'qr': return <QRCodeIcon size={20} />;
    case 'photo': return '📷';
    case 'visit_location': return '📍';
    default: return '📝';
  }
};

const CATEGORY_ORDER = [...FOREST_CATEGORY_KEYS, OTHER_FOREST_CATEGORY_KEY];

function TasksPage() {
  const { categoryKey: categoryKeyParam } = useParams<{ categoryKey: string }>();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'not_completed' | 'completed' | 'validating'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent'>('all');
  const [showOnlineTasks, setShowOnlineTasks] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [prerequisiteTaskIdsFilter, setPrerequisiteTaskIdsFilter] = useState<string[] | null>(null);
  const queryClient = useQueryClient();
  const { data: tasks, isLoading, refetch } = useQuery('tasks', () => api.getTasks());

  useEffect(() => {
    if (categoryKeyParam && !isForestCategoryRouteKey(categoryKeyParam)) {
      navigate('/tasks', { replace: true });
    }
  }, [categoryKeyParam, navigate]);

  useEffect(() => {
    setShowLocationMap(false);
  }, [categoryKeyParam]);

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

  const categoryCounts = useMemo(() => {
    const m: Partial<Record<string, number>> = {};
    if (!tasks) return m;
    for (const task of tasks) {
      const k = forestKeyFromTaskCategory((task as { category?: string }).category);
      m[k] = (m[k] || 0) + 1;
    }
    return m as Record<string, number>;
  }, [tasks]);

  // Extract unique task types from loaded tasks as fallback
  const taskTypesFromTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    const uniqueTypes = new Set(tasks.map((task: any) => task.type).filter(Boolean));
    return Array.from(uniqueTypes);
  }, [tasks]);

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

    // Filter by prerequisite task IDs (Type 2 prerequisites)
    if (prerequisiteTaskIdsFilter && prerequisiteTaskIdsFilter.length > 0) {
      filtered = filtered.filter((task: any) => 
        prerequisiteTaskIdsFilter.includes(task.id)
      );
    }

    // Filter by online status
    if (showOnlineTasks) {
      filtered = filtered.filter((task: any) => {
        if (!task.location) return false;
        const location = typeof task.location === 'string' ? JSON.parse(task.location) : task.location;
        const isOnline = location.is_online === true || location.is_online === 'true' || String(location.is_online).toLowerCase() === 'true';
        return isOnline;
      });
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
    typeFilter,
    completionFilter,
    timeFilter,
    showOnlineTasks,
    prerequisiteTaskIdsFilter,
  ]);

  const handleTaskClick = (task: any) => {
    if (task.completed && task.verification_status !== 'pending') return;
    if (task.verification_status === 'pending') return;
    if (task.is_available === false) return; // Don't allow clicking locked tasks
    setSelectedTask(task.id);
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
  if (isLoading) {
    return (
      <div className="tasks-page">
        <h1 className="tasks-title">{t('tasks.title')}</h1>
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  const wrapTaskShell = (node: React.ReactNode) => (
    <div className="tasks-task-shell">
      <button
        type="button"
        className="tasks-back-from-task"
        onClick={() => setSelectedTask(null)}
        title={t('tasks.backToList')}
        aria-label={t('tasks.backToList')}
      >
        <BackArrowIcon className="tasks-back-from-task-icon" />
      </button>
      {node}
    </div>
  );

  if (selectedTask) {
    const task = tasks?.find((t: any) => t.id === selectedTask);
    if (!task) return <div>{t('tasks.notFound')}</div>;

    if (task.type === 'video') {
      return wrapTaskShell(<VideoTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'quiz') {
      return wrapTaskShell(<QuizTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'article_quiz') {
      return wrapTaskShell(<ArticleQuizTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'survey') {
      return wrapTaskShell(<SurveyTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'qr') {
      return wrapTaskShell(
        <QRCodeTask taskId={task.id} qrCode={task.qr_code} onComplete={handleTaskComplete} />
      );
    }
    if (task.type === 'photo') {
      return wrapTaskShell(<PhotoTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
    if (task.type === 'visit_location') {
      return wrapTaskShell(<VisitLocationTask taskId={task.id} onComplete={handleTaskComplete} />);
    }
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="tasks-page">
        <h1 className="tasks-title">{t('tasks.title')}</h1>
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
        <h1 className="tasks-title">{t('tasks.title')}</h1>
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (!categoryKeyParam && !selectedTask) {
    return (
      <div className="tasks-page tasks-page--hub">
        <h1 className="tasks-title">{t('tasks.categories.hubTitle')}</h1>
        <p className="tasks-hub-subtitle">{t('tasks.categories.hubSubtitle')}</p>
        <div className="tasks-category-grid">
          {CATEGORY_ORDER.map((key) => {
            const count = categoryCounts[key] || 0;
            if (count === 0) return null;
            return (
              <Link
                key={key}
                to={`/tasks/c/${key}`}
                className={`tasks-category-tile tasks-category-tile--${key}`}
              >
                <span className="tasks-category-tile-icon" aria-hidden>
                  <CategoryHubIcon categoryKey={key} className="tasks-category-tile-icon-svg" />
                </span>
                <span className="tasks-category-tile-title">{t(`tasks.categories.${key}`)}</span>
                <span className="tasks-category-tile-count">{t('tasks.categories.taskCount', { count })}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (!categoryKeyParam) {
    return null;
  }

  if (showLocationMap) {
    return (
      <div className="tasks-page tasks-page--map">
        <div className="tasks-map-header">
          <button
            type="button"
            className="tasks-map-back"
            onClick={() => setShowLocationMap(false)}
            title={t('tasks.backToList')}
            aria-label={t('tasks.backToList')}
          >
            <BackArrowIcon className="tasks-icon-back-svg" />
          </button>
          <h1 className="tasks-title">{t(`tasks.categories.${categoryKeyParam}`)}</h1>
          <span className="tasks-map-header-spacer" aria-hidden="true" />
        </div>
        <div className="tasks-map-body">
          <UserLocationMap
            variant="tasks"
            height="calc(100dvh - 200px)"
            tasks={filteredTasks as any[]}
            onTaskClick={(taskId) => {
              setShowLocationMap(false);
              setSelectedTask(taskId);
            }}
          />
        </div>
      </div>
    );
  }

  return (
      <div className="tasks-page tasks-page--category">
        <div className="tasks-category-sticky">
        <div className="tasks-header tasks-header--category">
          <div className="tasks-header-category-top">
            <button
              type="button"
              className="tasks-icon-back"
              onClick={() => navigate('/tasks')}
              title={t('tasks.categories.backToCategories')}
              aria-label={t('tasks.categories.backToCategories')}
            >
              <BackArrowIcon className="tasks-icon-back-svg" />
            </button>
            <h1 className="tasks-title tasks-header-category-title">{t(`tasks.categories.${categoryKeyParam}`)}</h1>
          </div>
          <div className="tasks-header-category-actions">
            {prerequisiteTaskIdsFilter && prerequisiteTaskIdsFilter.length > 0 ? (
              <div className="tasks-header-category-actions-row">
                <button
                  type="button"
                  className="location-button"
                  onClick={() => setPrerequisiteTaskIdsFilter(null)}
                >
                  {t('tasks.prerequisites.clearFilter')}
                </button>
                <button
                  type="button"
                  className="location-button"
                  onClick={() => setShowLocationMap(true)}
                  title={t('tasks.showLocation')}
                >
                  {t('tasks.locationButton')}
                </button>
              </div>
            ) : showOnlineTasks ? (
              <div className="tasks-header-category-actions-row">
                <button
                  type="button"
                  className="location-button"
                  onClick={() => setShowOnlineTasks(false)}
                >
                  {t('tasks.prerequisites.clearFilter')}
                </button>
                <button
                  type="button"
                  className="location-button"
                  onClick={() => setShowLocationMap(true)}
                  title={t('tasks.showLocation')}
                >
                  {t('tasks.locationButton')}
                </button>
              </div>
            ) : (
              <div className="tasks-header-category-actions-row">
                <button
                  type="button"
                  className="location-button"
                  onClick={() => setShowLocationMap(true)}
                  title={t('tasks.showLocation')}
                >
                  {t('tasks.locationButton')}
                </button>
                <button
                  type="button"
                  className="location-button"
                  onClick={() => setShowOnlineTasks(true)}
                  title={t('tasks.showOnline')}
                >
                  {t('tasks.onlineButton')}
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
              ? taskTypeParameters.map((param: any) => ({
                  value: param.value,
                  label: t(`tasks.filters.type.${param.value}`, { defaultValue: param.value }),
                  icon: getTaskTypeIcon(param.value),
                }))
              : taskTypesFromTasks.length > 0
              ? taskTypesFromTasks.map((type: string) => ({
                  value: type,
                  label: t(`tasks.filters.type.${type}`, { defaultValue: type }),
                  icon: getTaskTypeIcon(type),
                }))
              : [
                  // Final fallback to hardcoded types
                  { value: 'video', label: t('tasks.filters.type.video'), icon: '🎥' },
                  { value: 'quiz', label: t('tasks.filters.type.quiz'), icon: '❓' },
                  { value: 'article_quiz', label: t('tasks.filters.type.article_quiz'), icon: '📄' },
                  { value: 'survey', label: t('tasks.filters.type.survey'), icon: '📋' },
                  { value: 'qr', label: t('tasks.filters.type.qr'), icon: <QRCodeIcon size={20} /> },
                  { value: 'photo', label: t('tasks.filters.type.photo'), icon: '📷' },
                  { value: 'visit_location', label: t('tasks.filters.type.visit_location'), icon: '📍' },
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

      <div className="tasks-category-scroll">
      {filteredTasks.length === 0 ? (
        <EmptyState
          title={t('tasks.empty.filtered.title')}
          description={t('tasks.empty.filtered.description')}
        />
      ) : (
        <div className="tasks-grid tasks-grid--compact">
          {filteredTasks.map((task: any) => {
            const isLocked = task.is_available === false;
            const isCompleted = !!task.completed && task.verification_status !== 'pending';
            const isValidating = task.verification_status === 'pending';
            return (
            <div key={task.id} className={`task-card ${isCompleted ? 'task-card-completed' : ''} ${isValidating ? 'task-card-validating' : ''} ${isLocked ? 'task-card-locked' : ''}`}>
            <div className="task-header">
              <span className="task-icon">
                {task.thumbnail_url ? (
                  <img src={task.thumbnail_url} alt={task.title} className="task-icon-image" />
                ) : (
                  task.type === 'video' ? '🎥' : 
                  task.type === 'quiz' ? '❓' : 
                  task.type === 'article_quiz' ? '📄' :
                  task.type === 'survey' ? '📋' :
                  task.type === 'qr' ? <QRCodeIcon size={48} /> : 
                  task.type === 'visit_location' ? '📍' : '📷'
                )}
              </span>
              <span className="task-points">{t('tasksComponents.points', { points: task.points })}</span>
              {isCompleted && (
                <span className="task-completed-badge" title={t('tasks.badges.completed')}>
                  ✓
                </span>
              )}
              {isValidating && (
                <span className="task-validating-badge" title={t('tasks.badges.validating')}>
                  ⏳
                </span>
              )}
              {isLocked && (
                <span className="task-locked-badge" title={t('tasks.badges.locked')}>
                  🔒
                </span>
              )}
            </div>
            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>
            {isLocked && (
              <p className="task-locked-message" style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                {t('tasks.prerequisites.unlockMessage')}
              </p>
            )}
            {/* Show prerequisite tasks button for Type 2 prerequisites */}
            {task.prerequisite_task_ids && Array.isArray(task.prerequisite_task_ids) && task.prerequisite_task_ids.length > 0 && (
              <button
                className="task-prerequisite-button"
                onClick={() => setPrerequisiteTaskIdsFilter(task.prerequisite_task_ids)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'var(--color-surface, #f3f4f6)',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {t('tasks.prerequisites.showPrerequisites')}
              </button>
            )}
            <button
              className="task-button"
              onClick={() => handleTaskClick(task)}
              disabled={isCompleted || isValidating || isLocked}
            >
              {isCompleted ? t('tasks.buttons.completed') : isValidating ? t('tasks.buttons.validating') : isLocked ? t('tasks.buttons.locked') : t('tasks.buttons.start')}
            </button>
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

