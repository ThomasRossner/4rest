import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import './AdminPage.css';
import { USER_ROLES, USER_TYPES, HOTEL_IDS, UserRole, UserType, HotelId } from '../../constants/enums';

type AdminMode = 'task' | 'reward' | null;
type TaskSource = '' | 'existing' | 'video' | 'qr' | 'photo';

type AdminTaskTemplate = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  points: number;
  video_url?: string | null;
  quiz_questions?: any;
  qr_code?: string | null;
  photo_required?: boolean;
  co2_savings_kg?: number | null;
  allowed_roles?: UserRole[] | null;
  allowed_user_types?: UserType[] | null;
  allowed_hotel_ids?: HotelId[] | null;
};

type RewardTemplate = {
  id: string;
  name: string;
  title: string;
  description?: string | null;
  reward_type: string;
  points_cost: number;
};

type TaskFormState = {
  title: string;
  description: string;
  type: string;
  points: number;
  video_url: string;
  quizQuestionsText: string;
  qr_code: string;
  photo_required: boolean;
  co2_savings_kg: number;
  allowedRoles: string[];
  allowedUserTypes: string[];
  allowedHotelIds: string[];
};

const normalizeEnumArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const withoutBraces = trimmed.startsWith('{') && trimmed.endsWith('}')
      ? trimmed.slice(1, -1)
      : trimmed;
    if (!withoutBraces) return [];
    return withoutBraces
      .split(',')
      .map((part) => part.replace(/^"|"$/g, '').trim())
      .filter(Boolean);
  }
  return [];
};

const ensureRoleList = (input: string[]): UserRole[] => {
  const invalid = input.filter((value) => !(USER_ROLES as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid roles: ${invalid.join(', ')}`);
  }
  return input as UserRole[];
};

const ensureUserTypeList = (input: string[]): UserType[] => {
  const invalid = input.filter((value) => !(USER_TYPES as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid user types: ${invalid.join(', ')}`);
  }
  return input as UserType[];
};

const ensureHotelIdList = (input: string[]): HotelId[] => {
  const invalid = input.filter((value) => !(HOTEL_IDS as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid hotel IDs: ${invalid.join(', ')}`);
  }
  return input as HotelId[];
};

const ROLE_OPTIONS = USER_ROLES.map((role) => ({ value: role, label: role }));
const USER_TYPE_OPTIONS = USER_TYPES.map((type) => ({ value: type, label: type }));
const HOTEL_OPTIONS = HOTEL_IDS.map((id) => ({ value: id, label: id }));

const defaultTaskForm = (type: 'video' | 'qr' | 'photo'): TaskFormState => ({
  title: '',
  description: '',
  type,
  points: 0,
  video_url: '',
  quizQuestionsText: type === 'video' ? '[]' : '',
  qr_code: type === 'qr' ? '' : '',
  photo_required: type === 'photo',
  co2_savings_kg: 0,
  allowedRoles: [],
  allowedUserTypes: [],
  allowedHotelIds: [],
});

const parseQuizText = (text: string) => {
  if (!text.trim()) return [];
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('Quiz JSON must be an array.');
  }
  return parsed;
};

function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = user?.role === 'administrator';
  const [mode, setMode] = useState<AdminMode>(null);

  const [taskSource, setTaskSource] = useState<TaskSource>('');
  const [selectedExistingTaskId, setSelectedExistingTaskId] = useState<string>('');
  const [taskForm, setTaskForm] = useState<TaskFormState>(() => defaultTaskForm('video'));
  const [taskMessage, setTaskMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  const {
    data: adminTasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery<AdminTaskTemplate[]>('adminTasks', () => api.getTasks({ includeAll: true }), {
    enabled: isAdmin && mode === 'task',
  });

  const existingTemplates = useMemo<AdminTaskTemplate[]>(() => {
    const list = Array.isArray(adminTasks) ? adminTasks : [];
    return list.map((task) => ({
      ...task,
      quiz_questions:
        typeof task.quiz_questions === 'string'
          ? (() => {
              try {
                return JSON.parse(task.quiz_questions);
              } catch {
                return [];
              }
            })()
          : task.quiz_questions ?? [],
    }));
  }, [adminTasks]);

  const {
    data: rewardTemplatesData,
    isLoading: rewardTemplatesLoading,
    error: rewardTemplatesError,
    refetch: refetchRewardTemplates,
  } = useQuery<RewardTemplate[]>('rewardTemplates', api.getRewardTemplates, {
    enabled: isAdmin && mode === 'reward',
  });

  const rewardTemplates = rewardTemplatesData ?? [];

  const [selectedRewardTemplate, setSelectedRewardTemplate] = useState<string>('');
  const [rewardTitleOverride, setRewardTitleOverride] = useState('');
  const [rewardPointsOverride, setRewardPointsOverride] = useState<number | undefined>(undefined);

  const publishTaskMutation = useMutation((payload: any) => api.createCustomTask(payload), {
    onSuccess: () => {
      setTaskMessage({ type: 'success', text: 'Task published successfully.' });
      setTaskSource('');
      setSelectedExistingTaskId('');
      setTaskForm(defaultTaskForm('video'));
      void refetchTasks();
    },
    onError: (error: any) => {
      setTaskMessage({ type: 'error', text: error?.message || 'Failed to publish task.' });
    },
  });

  const createRewardMutation = useMutation(
    () =>
      api.createRewardFromTemplate(selectedRewardTemplate, {
        ...(rewardTitleOverride ? { title: rewardTitleOverride } : {}),
        ...(typeof rewardPointsOverride === 'number' ? { pointsCost: rewardPointsOverride } : {}),
      }),
    {
      onSuccess: () => {
        setRewardTitleOverride('');
        setRewardPointsOverride(undefined);
        void refetchRewardTemplates();
      },
    }
  );

  useEffect(() => {
    setTaskMessage(null);
    if (taskSource === 'existing') {
      setSelectedExistingTaskId('');
      setTaskForm(defaultTaskForm('video'));
    } else if (taskSource === 'video' || taskSource === 'qr' || taskSource === 'photo') {
      setSelectedExistingTaskId('');
      setTaskForm(defaultTaskForm(taskSource));
    }
  }, [taskSource]);

  useEffect(() => {
    if (taskSource !== 'existing') return;
    const template = existingTemplates.find((task) => task.id === selectedExistingTaskId);
    if (!template) return;
    setTaskForm({
      title: template.title ?? '',
      description: template.description ?? '',
      type: template.type,
      points: template.points ?? 0,
      video_url: template.video_url ?? '',
      quizQuestionsText:
        template.type === 'video'
          ? JSON.stringify(template.quiz_questions ?? [], null, 2)
          : '',
      qr_code: template.qr_code ?? '',
      photo_required: Boolean(template.photo_required),
      co2_savings_kg: template.co2_savings_kg ?? 0,
      allowedRoles: normalizeEnumArray(template.allowed_roles),
      allowedUserTypes: normalizeEnumArray(template.allowed_user_types),
      allowedHotelIds: normalizeEnumArray(template.allowed_hotel_ids),
    });
  }, [taskSource, selectedExistingTaskId, existingTemplates]);

  const handlePublishTask = () => {
    try {
      setTaskMessage(null);

      if (taskSource === 'existing') {
        if (!selectedExistingTaskId) {
          setTaskMessage({ type: 'error', text: 'Please select an existing task.' });
          return;
        }
        if (!taskForm.title.trim()) {
          setTaskMessage({ type: 'error', text: 'Title is required.' });
          return;
        }

        const template = existingTemplates.find((task) => task.id === selectedExistingTaskId);
        if (!template) {
          setTaskMessage({ type: 'error', text: 'Selected task not found.' });
          return;
        }

        const payload: any = {
          title: taskForm.title,
          description: taskForm.description,
          type: template.type,
          points: Number(taskForm.points) || 0,
          co2_savings_kg: Number(taskForm.co2_savings_kg) || 0,
          allowed_roles: ensureRoleList(taskForm.allowedRoles),
          allowed_user_types: ensureUserTypeList(taskForm.allowedUserTypes),
          allowed_hotel_ids: ensureHotelIdList(taskForm.allowedHotelIds),
        };

        if (template.type === 'video') {
          payload.video_url = taskForm.video_url;
          payload.quiz_questions = parseQuizText(taskForm.quizQuestionsText);
        }
        if (template.type === 'qr') {
          payload.qr_code = taskForm.qr_code;
        }
        if (template.type === 'photo') {
          payload.photo_required = taskForm.photo_required;
        }

        publishTaskMutation.mutate(payload);
        return;
      }

      if (taskSource === '' || taskSource === undefined) {
        setTaskMessage({ type: 'error', text: 'Please choose how to start.' });
        return;
      }

      if (!taskForm.title.trim()) {
        setTaskMessage({ type: 'error', text: 'Title is required.' });
        return;
      }

      const payload: any = {
        title: taskForm.title,
        description: taskForm.description,
        type: taskForm.type,
        points: Number(taskForm.points) || 0,
        co2_savings_kg: Number(taskForm.co2_savings_kg) || 0,
        allowed_roles: ensureRoleList(taskForm.allowedRoles),
        allowed_user_types: ensureUserTypeList(taskForm.allowedUserTypes),
        allowed_hotel_ids: ensureHotelIdList(taskForm.allowedHotelIds),
      };

      if (taskSource === 'video') {
        payload.video_url = taskForm.video_url;
        payload.quiz_questions = parseQuizText(taskForm.quizQuestionsText);
      }
      if (taskSource === 'qr') {
        if (!taskForm.qr_code.trim()) {
          setTaskMessage({ type: 'error', text: 'QR code value is required.' });
          return;
        }
        payload.qr_code = taskForm.qr_code;
      }
      if (taskSource === 'photo') {
        payload.photo_required = taskForm.photo_required;
      }

      publishTaskMutation.mutate(payload);
    } catch (error: any) {
      setTaskMessage({ type: 'error', text: error?.message || 'Failed to prepare payload.' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <h1 className="admin-title">Administrator Area</h1>
        <p className="admin-info">You need administrator privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Administrator Home</h1>
          <p className="admin-subtitle">Select an action below.</p>
        </div>
        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      </header>

      {mode === null && (
        <div className="admin-choice-grid">
          <button className="admin-choice-card" onClick={() => setMode('task')}>
            <span className="admin-choice-icon">✅</span>
            <h2>Create Task</h2>
            <p>Use an existing task or start from scratch.</p>
          </button>
          <button className="admin-choice-card" onClick={() => setMode('reward')}>
            <span className="admin-choice-icon">🎁</span>
            <h2>Create Reward</h2>
            <p>Publish a new reward for the marketplace.</p>
          </button>
        </div>
      )}

      {mode === 'task' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>Publish Task</h2>
              <p>Select an existing task or start from scratch depending on the task type.</p>
            </div>
            <div className="admin-actions">
              <button className="admin-refresh" onClick={() => refetchTasks()}>
                Refresh tasks
              </button>
              <button className="admin-back" onClick={() => setMode(null)}>
                Back
              </button>
            </div>
          </header>

          {tasksLoading && <p>Loading tasks…</p>}
          {Boolean(tasksError) && <p className="admin-error">Failed to load existing tasks.</p>}

          <div className="admin-form-card">
            <label className="admin-field">
              <span>Create from</span>
              <select
                value={taskSource}
                onChange={(event) => setTaskSource(event.target.value as TaskSource)}
              >
                <option value="">Select option</option>
                <option value="existing">Existing task</option>
                <option value="video">Start from scratch – Video task</option>
                <option value="qr">Start from scratch – QR task</option>
                <option value="photo">Start from scratch – Photo task</option>
              </select>
            </label>

            {taskSource === 'existing' && (
              <label className="admin-field">
                <span>Select existing task</span>
                <select
                  value={selectedExistingTaskId}
                  onChange={(event) => setSelectedExistingTaskId(event.target.value)}
                >
                  <option value="">Select task</option>
                  {existingTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title} ({template.type})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {taskSource && (taskSource !== 'existing' || selectedExistingTaskId) && (
              <>
                <label className="admin-field">
                  <span>Task type</span>
                  <input type="text" value={taskForm.type} readOnly />
                </label>

                <label className="admin-field">
                  <span>Title</span>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(event) =>
                      setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Description</span>
                  <textarea
                    value={taskForm.description}
                    onChange={(event) =>
                      setTaskForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={3}
                  />
                </label>

                <label className="admin-field">
                  <span>Points</span>
                  <input
                    type="number"
                    min={0}
                    value={taskForm.points}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        points: Number.parseInt(event.target.value || '0', 10),
                      }))
                    }
                  />
                </label>

                {taskForm.type === 'video' && (
                  <>
                    <label className="admin-field">
                      <span>Video URL</span>
                      <input
                        type="text"
                        value={taskForm.video_url}
                        onChange={(event) =>
                          setTaskForm((prev) => ({ ...prev, video_url: event.target.value }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>Quiz questions (JSON array)</span>
                      <textarea
                        rows={6}
                        value={taskForm.quizQuestionsText}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            quizQuestionsText: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </>
                )}

                {taskForm.type === 'qr' && (
                  <label className="admin-field">
                    <span>QR code value</span>
                    <input
                      type="text"
                      value={taskForm.qr_code}
                      onChange={(event) =>
                        setTaskForm((prev) => ({ ...prev, qr_code: event.target.value }))
                      }
                    />
                  </label>
                )}

                {taskForm.type === 'photo' && (
                  <label className="admin-field">
                    <span>
                      <input
                        type="checkbox"
                        checked={taskForm.photo_required}
                        onChange={(event) =>
                          setTaskForm((prev) => ({ ...prev, photo_required: event.target.checked }))
                        }
                      />{' '}
                      Photo required
                    </span>
                  </label>
                )}

                <label className="admin-field">
                  <span>CO₂ savings (kg)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={taskForm.co2_savings_kg}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        co2_savings_kg: Number.parseFloat(event.target.value || '0'),
                      }))
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Allowed roles</span>
                  <select
                    multiple
                    value={taskForm.allowedRoles}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value);
                      setTaskForm((prev) => ({ ...prev, allowedRoles: selected }));
                    }}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>Allowed user types</span>
                  <select
                    multiple
                    value={taskForm.allowedUserTypes}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value);
                      setTaskForm((prev) => ({ ...prev, allowedUserTypes: selected }));
                    }}
                  >
                    {USER_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>Allowed hotel IDs</span>
                  <select
                    multiple
                    value={taskForm.allowedHotelIds}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value);
                      setTaskForm((prev) => ({ ...prev, allowedHotelIds: selected }));
                    }}
                  >
                    {HOTEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {taskMessage && (
                  <p className={taskMessage.type === 'error' ? 'admin-error' : 'admin-success'}>
                    {taskMessage.text}
                  </p>
                )}

                <button
                  className="admin-submit"
                  onClick={handlePublishTask}
                  disabled={
                    publishTaskMutation.isLoading ||
                    (taskSource === 'existing' && !selectedExistingTaskId)
                  }
                >
                  {publishTaskMutation.isLoading ? 'Publishing…' : 'Publish Task'}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {mode === 'reward' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>Publish Reward</h2>
              <p>Select a template and optionally override the title or point cost.</p>
            </div>
            <div className="admin-actions">
              <button className="admin-refresh" onClick={() => refetchRewardTemplates()}>
                Refresh
              </button>
              <button className="admin-back" onClick={() => setMode(null)}>
                Back
              </button>
            </div>
          </header>

          {rewardTemplatesLoading && <p>Loading reward templates…</p>}
          {Boolean(rewardTemplatesError) && (
            <p className="admin-error">Failed to load reward templates.</p>
          )}

          {rewardTemplates && rewardTemplates.length > 0 ? (
            <div className="admin-grid">
              <div className="admin-form-card">
                <label className="admin-field">
                  <span>Template</span>
                  <select
                    value={selectedRewardTemplate}
                    onChange={(event) => setSelectedRewardTemplate(event.target.value)}
                  >
                    <option value="">Select template</option>
                    {rewardTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} — {template.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>Title override</span>
                  <input
                    type="text"
                    value={rewardTitleOverride}
                    onChange={(event) => setRewardTitleOverride(event.target.value)}
                    placeholder="(optional)"
                  />
                </label>

                <label className="admin-field">
                  <span>Points override</span>
                  <input
                    type="number"
                    value={typeof rewardPointsOverride === 'number' ? rewardPointsOverride : ''}
                    onChange={(event) =>
                      setRewardPointsOverride(
                        event.target.value ? Number.parseInt(event.target.value, 10) : undefined
                      )
                    }
                    placeholder="(optional)"
                    min={0}
                  />
                </label>

                <button
                  className="admin-submit"
                  disabled={!selectedRewardTemplate || createRewardMutation.isLoading}
                  onClick={() => createRewardMutation.mutate()}
                >
                  {createRewardMutation.isLoading ? 'Publishing…' : 'Publish Reward'}
                </button>

                {createRewardMutation.isError && (
                  <p className="admin-error">Failed to publish reward. Please try again.</p>
                )}
                {createRewardMutation.isSuccess && (
                  <p className="admin-success">Reward published successfully.</p>
                )}
              </div>
            </div>
          ) : (
            !rewardTemplatesLoading && <p>No templates found.</p>
          )}
        </section>
      )}
    </div>
  );
}

export default AdminPage;

