import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import { VideoTask } from '../../components/Tasks/VideoTask';
import { QRCodeTask } from '../../components/Tasks/QRCodeTask';
import { PhotoTask } from '../../components/Tasks/PhotoTask';
import './TasksPage.css';

function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const { data: tasks, isLoading } = useQuery('tasks', () => api.getTasks());

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task.id);
  };

  const handleTaskComplete = () => {
    setSelectedTask(null);
  };

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

  return (
    <div className="tasks-page">
      <h1 className="tasks-title">Available Tasks</h1>
      <div className="tasks-grid">
        {tasks?.map((task: any) => (
          <div key={task.id} className="task-card">
            <div className="task-header">
              <span className="task-icon">
                {task.type === 'video' ? '🎥' : task.type === 'qr' ? '📱' : '📷'}
              </span>
              <span className="task-points">+{task.points} pts</span>
            </div>
            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>
            <button
              className="task-button"
              onClick={() => handleTaskClick(task)}
            >
              Start Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TasksPage;
