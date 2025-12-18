import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
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
import './TasksPage.css';

function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'qr' | 'photo' | 'visit_location' | 'quiz' | 'article_quiz' | 'survey'>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'not_completed'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent'>('all');
  const { data: tasks, isLoading, refetch } = useQuery('tasks', () => api.getTasks());
  const { t } = useTranslation();

  // All hooks must be called before any conditional returns
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    let filtered = [...tasks];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((task: any) => task.type === typeFilter);
    }

    // Filter by completion
    if (completionFilter === 'not_completed') {
      filtered = filtered.filter((task: any) => !task.completed);
    }

    // Filter by time (recent = last 7 days)
    if (timeFilter === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((task: any) => {
        const taskDate = new Date(task.created_at || task.createdAt || Date.now());
        return taskDate >= sevenDaysAgo;
      });
    }

    // Always show unfinished tasks first
    filtered.sort((a: any, b: any) => {
      const aCompleted = !!a.completed;
      const bCompleted = !!b.completed;
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });

    return filtered;
  }, [tasks, typeFilter, completionFilter, timeFilter]);

  const handleTaskClick = (task: any) => {
    if (task.completed) return;
    setSelectedTask(task.id);
  };

  const handleTaskComplete = async () => {
    setSelectedTask(null);
    try { await refetch(); } catch (_) {}
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

  if (selectedTask) {
    const task = tasks?.find((t: any) => t.id === selectedTask);
    if (!task) return <div>Task not found</div>;

    if (task.type === 'video') {
      return <VideoTask taskId={task.id} onComplete={handleTaskComplete} />;
    }
    if (task.type === 'quiz') {
      return <QuizTask taskId={task.id} onComplete={handleTaskComplete} />;
    }
    if (task.type === 'article_quiz') {
      return <ArticleQuizTask taskId={task.id} onComplete={handleTaskComplete} />;
    }
    if (task.type === 'survey') {
      return <SurveyTask taskId={task.id} onComplete={handleTaskComplete} />;
    }
    if (task.type === 'qr') {
      return (
        <QRCodeTask
          taskId={task.id}
          qrCode={task.qr_code}
          onComplete={handleTaskComplete}
        />
      );
    }
    if (task.type === 'photo') {
      return <PhotoTask taskId={task.id} onComplete={handleTaskComplete} />;
    }
    if (task.type === 'visit_location') {
      return <VisitLocationTask taskId={task.id} onComplete={handleTaskComplete} />;
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

  return (
    <div className="tasks-page">
      <h1 className="tasks-title">{t('tasks.title')}</h1>
      
      <div className="tasks-filters-row">
        <FilterDropdown
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as typeof typeFilter)}
          options={[
            { value: 'all', label: t('tasks.filters.type.all') },
            { value: 'video', label: t('tasks.filters.type.video'), icon: '🎥' },
            { value: 'quiz', label: t('tasks.filters.type.quiz'), icon: '❓' },
            { value: 'article_quiz', label: t('tasks.filters.type.article_quiz'), icon: '📄' },
            { value: 'survey', label: t('tasks.filters.type.survey'), icon: '📋' },
            { value: 'qr', label: t('tasks.filters.type.qr'), icon: <QRCodeIcon size={20} /> },
            { value: 'photo', label: t('tasks.filters.type.photo'), icon: '📷' },
            { value: 'visit_location', label: t('tasks.filters.type.visit_location'), icon: '📍' },
          ]}
        />
        <FilterDropdown
          value={completionFilter}
          onChange={(value) => setCompletionFilter(value as typeof completionFilter)}
          options={[
            { value: 'all', label: t('tasks.filters.completion.all') },
            { value: 'not_completed', label: t('tasks.filters.completion.not_completed') },
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

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={t('tasks.empty.filtered.title')}
          description={t('tasks.empty.filtered.description')}
        />
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task: any) => (
            <div key={task.id} className={`task-card ${task.completed ? 'task-card-completed' : ''}`}>
            <div className="task-header">
              <span className="task-icon">
                {task.type === 'video' ? '🎥' : 
                 task.type === 'quiz' ? '❓' : 
                 task.type === 'article_quiz' ? '📄' :
                 task.type === 'survey' ? '📋' :
                 task.type === 'qr' ? <QRCodeIcon size={48} /> : 
                 task.type === 'visit_location' ? '📍' : '📷'}
              </span>
              <span className="task-points">{t('tasksComponents.points', { points: task.points })}</span>
              {task.completed && (
                <span className="task-completed-badge" title={t('tasks.badges.completed')}>
                  ✓
                </span>
              )}
            </div>
            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>
            <button
              className="task-button"
              onClick={() => handleTaskClick(task)}
              disabled={!!task.completed}
            >
              {task.completed ? t('tasks.buttons.completed') : t('tasks.buttons.start')}
            </button>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

export default TasksPage;
