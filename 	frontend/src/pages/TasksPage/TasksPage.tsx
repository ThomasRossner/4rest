import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { VideoTask } from '../../components/Tasks/VideoTask';
import { QRCodeTask } from '../../components/Tasks/QRCodeTask';
import { PhotoTask } from '../../components/Tasks/PhotoTask';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './TasksPage.css';

function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'qr' | 'photo'>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'not_completed'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent'>('all');
  const { data: tasks, isLoading, refetch } = useQuery('tasks', () => api.getTasks());

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
        <h1 className="tasks-title">Available Tasks</h1>
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
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="tasks-page">
        <h1 className="tasks-title">Available Tasks</h1>
        <EmptyState title="No tasks available" description="Check back later for new sustainability tasks." />
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <h1 className="tasks-title">Available Tasks</h1>
      
      <div className="tasks-filters">
        <div className="tasks-filter-group">
          <label className="tasks-filter-label">Type:</label>
          <div className="tasks-filter-buttons">
            {(['all', 'video', 'qr', 'photo'] as const).map((type) => (
              <button
                key={type}
                className={`tasks-filter-btn ${typeFilter === type ? 'active' : ''}`}
                onClick={() => setTypeFilter(type)}
                aria-pressed={typeFilter === type}
              >
                {type === 'all' ? 'All' : type === 'video' ? '🎥 Video' : type === 'qr' ? '📱 QR' : '📷 Photo'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="tasks-filter-group">
          <label className="tasks-filter-label">Status:</label>
          <div className="tasks-filter-buttons">
            <button
              className={`tasks-filter-btn ${completionFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCompletionFilter('all')}
              aria-pressed={completionFilter === 'all'}
            >
              All
            </button>
            <button
              className={`tasks-filter-btn ${completionFilter === 'not_completed' ? 'active' : ''}`}
              onClick={() => setCompletionFilter('not_completed')}
              aria-pressed={completionFilter === 'not_completed'}
            >
              Not Completed
            </button>
          </div>
        </div>
        
        <div className="tasks-filter-group">
          <label className="tasks-filter-label">Time:</label>
          <div className="tasks-filter-buttons">
            <button
              className={`tasks-filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTimeFilter('all')}
              aria-pressed={timeFilter === 'all'}
            >
              All
            </button>
            <button
              className={`tasks-filter-btn ${timeFilter === 'recent' ? 'active' : ''}`}
              onClick={() => setTimeFilter('recent')}
              aria-pressed={timeFilter === 'recent'}
            >
              Recent
            </button>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState title="No tasks match your filters" description="Try adjusting your filter settings." />
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task: any) => (
            <div key={task.id} className={`task-card ${task.completed ? 'task-card-completed' : ''}`}>
            <div className="task-header">
              <span className="task-icon">
                {task.type === 'video' ? '🎥' : task.type === 'qr' ? '📱' : '📷'}
              </span>
              <span className="task-points">+{task.points} pts</span>
              {task.completed && (
                <span className="task-completed-badge" title="Task completed">✓</span>
              )}
            </div>
            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>
            <button
              className="task-button"
              onClick={() => handleTaskClick(task)}
              disabled={!!task.completed}
            >
              {task.completed ? 'Completed' : 'Start Task'}
            </button>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

export default TasksPage;
