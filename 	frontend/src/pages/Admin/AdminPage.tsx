import { useEffect, useMemo, useRef, useState } from 'react';
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
  quizQuestions: QuizQuestionDraft[];
  qr_code: string;
  photo_required: boolean;
  co2_savings_kg: number;
  allowedRoles: string[];
  allowedUserTypes: string[];
  allowedHotelIds: string[];
};

type QuizAnswerDraft = {
  id: string;
  text: string;
};

type QuizQuestionDraft = {
  id: string;
  prompt: string;
  answers: QuizAnswerDraft[];
  correctAnswerId: string | null;
  order: number;
};

type Option = {
  value: string;
  label: string;
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

const generateId = () => Math.random().toString(36).slice(2, 10);

const createEmptyAnswer = (): QuizAnswerDraft => ({
  id: generateId(),
  text: '',
});

const createEmptyQuestion = (order = 1): QuizQuestionDraft => {
  const first = createEmptyAnswer();
  const second = createEmptyAnswer();
  return {
    id: generateId(),
    prompt: '',
    answers: [first, second],
    correctAnswerId: first.id,
    order,
  };
};

const reindexQuestions = (questions: QuizQuestionDraft[]): QuizQuestionDraft[] =>
  questions.map((question, index) => ({
    ...question,
    order: index + 1,
  }));

const ROLE_OPTIONS = USER_ROLES.map((role) => ({ value: role, label: role }));
const USER_TYPE_OPTIONS = USER_TYPES.map((type) => ({ value: type, label: type }));
const HOTEL_OPTIONS = HOTEL_IDS.map((id) => ({ value: id, label: id }));

const defaultTaskForm = (type: 'video' | 'qr' | 'photo'): TaskFormState => ({
  title: '',
  description: '',
  type,
  points: 0,
  video_url: '',
  quizQuestions: type === 'video' ? [createEmptyQuestion(1)] : [],
  qr_code: type === 'qr' ? '' : '',
  photo_required: type === 'photo',
  co2_savings_kg: 0,
  allowedRoles: [],
  allowedUserTypes: [],
  allowedHotelIds: [],
});

const normalizeQuizQuestions = (payload: unknown): QuizQuestionDraft[] => {
  if (!Array.isArray(payload)) {
    return [createEmptyQuestion()];
  }

  const questions = payload.map((item) => {
      const raw = item as any;
      const prompt =
        typeof raw?.question === 'string'
          ? raw.question
          : typeof raw?.prompt === 'string'
          ? raw.prompt
          : '';

      const rawAnswers: unknown[] = Array.isArray(raw?.options)
        ? raw.options
        : Array.isArray(raw?.answers)
        ? raw.answers
        : [];

      const answers = rawAnswers
        .map((entry) => {
          if (typeof entry === 'string') {
            return { id: generateId(), text: entry };
          }
          if (entry && typeof entry === 'object' && typeof (entry as any).text === 'string') {
            return { id: generateId(), text: (entry as any).text };
          }
          return null;
        })
        .filter((answer): answer is QuizAnswerDraft => Boolean(answer));

      while (answers.length < 2) {
        answers.push(createEmptyAnswer());
      }

      const correctAnswerLabel =
        typeof raw?.correctAnswer === 'string'
          ? raw.correctAnswer
          : typeof raw?.correct_answer === 'string'
          ? raw.correct_answer
          : null;

      const correctAnswerId =
        typeof raw?.correctAnswerId === 'string'
          ? raw.correctAnswerId
          : typeof raw?.correct_answer_id === 'string'
          ? raw.correct_answer_id
          : null;

      let resolvedCorrectId: string | null = null;
      if (correctAnswerId) {
        resolvedCorrectId = answers.find((answer) => answer.id === correctAnswerId)?.id ?? null;
      }
      if (!resolvedCorrectId && correctAnswerLabel) {
        resolvedCorrectId =
          answers.find((answer) => answer.text === correctAnswerLabel)?.id ?? answers[0].id;
      }
      if (!resolvedCorrectId) {
        resolvedCorrectId = answers[0]?.id ?? null;
      }

      return {
        id: generateId(),
        prompt,
        answers,
        correctAnswerId: resolvedCorrectId,
        order: 0,
      };
    });

  const normalized = questions.length > 0 ? questions : [createEmptyQuestion()];
  return reindexQuestions(normalized);
};

const buildQuizPayload = (questions: QuizQuestionDraft[]) => {
  if (!questions.length) {
    throw new Error('Add at least one quiz question for a video task.');
  }

  return questions.map((question) => {
    const prompt = question.prompt.trim();
    const questionNumber = question.order;
    if (!prompt) {
      throw new Error(`Question ${questionNumber} is missing a prompt.`);
    }

    if (question.answers.length < 2) {
      throw new Error(`Question ${questionNumber} must have at least two possible answers.`);
    }

    const options = question.answers.map((answer) => {
      const text = answer.text.trim();
      if (!text) {
        throw new Error(`Question ${questionNumber} has an answer without text.`);
      }
      return text;
    });

    const uniqueOptions = new Set(options);
    if (uniqueOptions.size !== options.length) {
      throw new Error(`Question ${questionNumber} has duplicate answers.`);
    }

    const correctAnswer = question.answers.find(
      (answer) => answer.id === question.correctAnswerId
    );
    if (!correctAnswer) {
      throw new Error(`Question ${questionNumber} must have a correct answer selected.`);
    }

    const correctAnswerText = correctAnswer.text.trim();
    if (!correctAnswerText) {
      throw new Error(`Question ${questionNumber} has an empty correct answer.`);
    }

    return {
      question: prompt,
      options,
      correctAnswer: correctAnswerText,
    };
  });
};

type TaskFormValidation = {
  isValid: boolean;
  message: string | null;
};

type ValidateTaskFormParams = {
  taskSource: TaskSource;
  selectedExistingTaskId: string;
  taskForm: TaskFormState;
};

const validateTaskFormState = ({
  taskSource,
  selectedExistingTaskId,
  taskForm,
}: ValidateTaskFormParams): TaskFormValidation => {
  if (!taskSource) {
    return { isValid: false, message: 'Choose how you want to start creating your task.' };
  }

  if (taskSource === 'existing' && !selectedExistingTaskId) {
    return { isValid: false, message: 'Select an existing task to continue.' };
  }

  if (!taskForm.title.trim()) {
    return { isValid: false, message: 'Title is required.' };
  }

  if (!taskForm.description.trim()) {
    return { isValid: false, message: 'Description is required.' };
  }

  if (!Number.isFinite(taskForm.points) || Number.isNaN(taskForm.points)) {
    return { isValid: false, message: 'Points must be zero or greater.' };
  }

  if (taskForm.points < 0) {
    return { isValid: false, message: 'Points must be zero or greater.' };
  }

  if (taskForm.type === 'video') {
    if (!taskForm.video_url.trim()) {
      return { isValid: false, message: 'Video URL is required for video tasks.' };
    }
    try {
      buildQuizPayload(taskForm.quizQuestions);
    } catch (error: any) {
      return {
        isValid: false,
        message: error?.message ?? 'Check the quiz questions for missing details.',
      };
    }
  }

  if (taskForm.type === 'qr' && !taskForm.qr_code.trim()) {
    return { isValid: false, message: 'Enter the QR code value for QR tasks.' };
  }

  return { isValid: true, message: null };
};

type MultiSelectDropdownProps = {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  buttonLabel?: string;
};

const MultiSelectDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'All values allowed',
  buttonLabel,
}: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!(event.target instanceof Node)) return;
      if (!containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleValue = (value: string) => {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((entry) => entry !== value)
      : [...selectedValues, value];

    const ordered = options
      .map((option) => option.value)
      .filter((optionValue) => next.includes(optionValue));
    onChange(ordered);
  };

  const handleClear = () => {
    onChange([]);
  };

  const selectedSummary = selectedValues.length
    ? options
        .filter((option) => selectedValues.includes(option.value))
        .map((option) => option.label)
        .join(', ')
    : placeholder;

  return (
    <div className={`admin-multi-select${isOpen ? ' open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="admin-multi-select-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="admin-multi-select-label">{buttonLabel}</span>
        <span className="admin-multi-select-value">{selectedSummary}</span>
        <span className="admin-multi-select-icon" aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      {isOpen && (
        <div className="admin-multi-select-dropdown">
          <div className="admin-multi-select-actions">
            <button type="button" onClick={handleClear} className="admin-multi-select-clear">
              Clear selection
            </button>
          </div>
          <div className="admin-multi-select-options">
            {options.map((option) => {
              const checked = selectedValues.includes(option.value);
              return (
                <label key={option.value} className="admin-multi-select-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

type FieldLabelProps = {
  label: string;
  required?: boolean;
  readOnly?: boolean;
};

const FieldLabel = ({ label, required, readOnly }: FieldLabelProps) => (
  <span className="admin-field-label">
    <span>{label}</span>
    {required && (
      <span className="admin-field-required" aria-hidden="true" title="Required field">
        *
      </span>
    )}
    {readOnly && <span className="admin-field-readonly">Read only</span>}
  </span>
);

const moveItem = <T,>(items: T[], index: number, offset: number): T[] => {
  const newIndex = index + offset;
  if (newIndex < 0 || newIndex >= items.length) {
    return items;
  }
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(newIndex, 0, item);
  return copy;
};

type QuizBuilderProps = {
  questions: QuizQuestionDraft[];
  onChange: (questions: QuizQuestionDraft[]) => void;
};

const QuizBuilder = ({ questions, onChange }: QuizBuilderProps) => {
  const updateQuestions = (
    updater: (current: QuizQuestionDraft[]) => QuizQuestionDraft[]
  ): void => {
    const next = reindexQuestions(updater(questions));
    onChange(next);
  };

  const handlePromptChange = (questionId: string, value: string) => {
    updateQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, prompt: value } : question
      )
    );
  };

  const addQuestion = () => {
    updateQuestions((current) => [...current, createEmptyQuestion(current.length + 1)]);
  };

  const removeQuestion = (questionId: string) => {
    updateQuestions((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((question) => question.id !== questionId);
    });
  };

  const moveQuestion = (questionId: string, offset: number) => {
    updateQuestions((current) => {
      const index = current.findIndex((question) => question.id === questionId);
      if (index === -1) return current;
      return moveItem(current, index, offset);
    });
  };

  const handleAnswerTextChange = (questionId: string, answerId: string, value: string) => {
    updateQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          answers: question.answers.map((answer) =>
            answer.id === answerId ? { ...answer, text: value } : answer
          ),
        };
      })
    );
  };

  const addAnswer = (questionId: string) => {
    updateQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        return { ...question, answers: [...question.answers, createEmptyAnswer()] };
      })
    );
  };

  const removeAnswer = (questionId: string, answerId: string) => {
    updateQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        if (question.answers.length <= 2) {
          return question;
        }
        const filteredAnswers = question.answers.filter((answer) => answer.id !== answerId);
        const hasCorrect = filteredAnswers.some(
          (answer) => answer.id === question.correctAnswerId
        );
        return {
          ...question,
          answers: filteredAnswers,
          correctAnswerId: hasCorrect ? question.correctAnswerId : filteredAnswers[0]?.id ?? null,
        };
      })
    );
  };

  const moveAnswer = (questionId: string, answerId: string, offset: number) => {
    updateQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        const index = question.answers.findIndex((answer) => answer.id === answerId);
        if (index === -1) return question;
        return { ...question, answers: moveItem(question.answers, index, offset) };
      })
    );
  };

  const selectCorrectAnswer = (questionId: string, answerId: string) => {
    updateQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, correctAnswerId: answerId } : question
      )
    );
  };

  if (!questions.length) {
    return (
      <div className="admin-quiz-builder">
        <p className="admin-quiz-empty">No questions yet. Add your first question below.</p>
        <button type="button" className="admin-quiz-add-question" onClick={addQuestion}>
          Add question
        </button>
      </div>
    );
  }

  return (
    <div className="admin-quiz-builder">
      <div className="admin-quiz-header">
        <h3>Quiz questions</h3>
        <p>
          Add multiple choice questions for this video. Each question needs at least two answers and
          one correct answer.
        </p>
      </div>

      <div className="admin-quiz-list">
        {questions.map((question, questionIndex) => {
          const answerGroupName = `correct-answer-${question.id}`;
          return (
            <div key={question.id} className="admin-quiz-question">
              <div className="admin-quiz-question-header">
                <h4>
                  Question {question.order}
                  <span className="admin-quiz-question-controls">
                    <button
                      type="button"
                      onClick={() => moveQuestion(question.id, -1)}
                      disabled={questionIndex === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(question.id, 1)}
                      disabled={questionIndex === questions.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      disabled={questions.length === 1}
                    >
                      Remove
                    </button>
                  </span>
                </h4>
              </div>

              <label className="admin-field">
                <span>Question text</span>
                <input
                  type="text"
                  value={question.prompt}
                  onChange={(event) => handlePromptChange(question.id, event.target.value)}
                  placeholder="Enter the question prompt"
                />
              </label>

              <div className="admin-quiz-answers">
                {question.answers.map((answer, answerIndex) => (
                  <div key={answer.id} className="admin-quiz-answer-row">
                    <label className="admin-quiz-answer-select">
                      <input
                        type="radio"
                        name={answerGroupName}
                        checked={question.correctAnswerId === answer.id}
                        onChange={() => selectCorrectAnswer(question.id, answer.id)}
                      />
                      <span>Correct</span>
                    </label>
                    <input
                      type="text"
                      value={answer.text}
                      onChange={(event) =>
                        handleAnswerTextChange(question.id, answer.id, event.target.value)
                      }
                      placeholder={`Answer option ${answerIndex + 1}`}
                    />
                    <div className="admin-quiz-answer-controls">
                      <button
                        type="button"
                        onClick={() => moveAnswer(question.id, answer.id, -1)}
                        disabled={answerIndex === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveAnswer(question.id, answer.id, 1)}
                        disabled={answerIndex === question.answers.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAnswer(question.id, answer.id)}
                        disabled={question.answers.length <= 2}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="admin-quiz-add-answer"
                onClick={() => addAnswer(question.id)}
              >
                Add answer
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="admin-quiz-add-question" onClick={addQuestion}>
        Add question
      </button>
    </div>
  );
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
  const [hasAttemptedPublish, setHasAttemptedPublish] = useState(false);

  const validation = useMemo(
    () => validateTaskFormState({ taskSource, selectedExistingTaskId, taskForm }),
    [taskSource, selectedExistingTaskId, taskForm]
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
      setHasAttemptedPublish(false);
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

  const isPublishDisabled = publishTaskMutation.isLoading || !validation.isValid;

  useEffect(() => {
    setTaskMessage(null);
    setHasAttemptedPublish(false);
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
    setHasAttemptedPublish(false);
    setTaskForm({
      title: template.title ?? '',
      description: template.description ?? '',
      type: template.type,
      points: template.points ?? 0,
      video_url: template.video_url ?? '',
    quizQuestions:
      template.type === 'video'
        ? normalizeQuizQuestions(template.quiz_questions ?? [])
        : [],
      qr_code: template.qr_code ?? '',
    photo_required: template.type === 'photo',
      co2_savings_kg: template.co2_savings_kg ?? 0,
      allowedRoles: normalizeEnumArray(template.allowed_roles),
      allowedUserTypes: normalizeEnumArray(template.allowed_user_types),
      allowedHotelIds: normalizeEnumArray(template.allowed_hotel_ids),
    });
  }, [taskSource, selectedExistingTaskId, existingTemplates]);

  const handlePublishTask = () => {
    try {
      setTaskMessage(null);
      setHasAttemptedPublish(true);

      if (!validation.isValid) {
        setTaskMessage({
          type: 'error',
          text: validation.message ?? 'Please complete the required fields.',
        });
        return;
      }

      if (taskSource === 'existing') {
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
          payload.video_url = taskForm.video_url.trim();
          payload.quiz_questions = buildQuizPayload(taskForm.quizQuestions);
        }
        if (template.type === 'qr') {
          payload.qr_code = taskForm.qr_code.trim();
        }
        if (template.type === 'photo') {
          payload.photo_required = true;
        }

        publishTaskMutation.mutate(payload);
        return;
      }

      if (!taskSource) {
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
        payload.video_url = taskForm.video_url.trim();
        payload.quiz_questions = buildQuizPayload(taskForm.quizQuestions);
      }
      if (taskSource === 'qr') {
        payload.qr_code = taskForm.qr_code.trim();
      }
      if (taskSource === 'photo') {
        payload.photo_required = true;
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
              <div className="admin-form-layout">
                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <h3>Task basics</h3>
                    <p>Provide the essential details for this task.</p>
                  </div>
                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <FieldLabel label="Task type" readOnly />
                      <input
                        type="text"
                        value={taskForm.type}
                        readOnly
                        className="admin-input-readonly"
                      />
                    </label>
                    <label className="admin-field">
                      <FieldLabel label="Title" required />
                      <input
                        type="text"
                        value={taskForm.title}
                        onChange={(event) =>
                          setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </label>
                    <label className="admin-field admin-field-span-2">
                      <FieldLabel label="Description" required />
                      <textarea
                        value={taskForm.description}
                        onChange={(event) =>
                          setTaskForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <label className="admin-field">
                      <FieldLabel label="Points" required />
                      <input
                        type="number"
                        min={0}
                        value={Number.isNaN(taskForm.points) ? '' : taskForm.points}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            points: Number.parseInt(event.target.value || '0', 10),
                          }))
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <FieldLabel label="CO₂ savings (kg)" />
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
                    {taskForm.type === 'video' && (
                      <label className="admin-field admin-field-span-2">
                        <FieldLabel label="Video URL" required />
                        <input
                          type="url"
                          value={taskForm.video_url}
                          onChange={(event) =>
                            setTaskForm((prev) => ({ ...prev, video_url: event.target.value }))
                          }
                          placeholder="https://example.com/video"
                        />
                      </label>
                    )}
                    {taskForm.type === 'qr' && (
                      <label className="admin-field admin-field-span-2">
                        <FieldLabel label="QR code value" required />
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
                      <div className="admin-form-full">
                        <FieldLabel label="Photo requirement" readOnly />
                        <p className="admin-field-note">
                          A photo is always required for this task type.
                        </p>
                      </div>
                    )}
                  </div>
                  {taskForm.type === 'video' && (
                    <div className="admin-form-full">
                      <FieldLabel label="Quiz questions" required />
                      <QuizBuilder
                        questions={taskForm.quizQuestions}
                        onChange={(questions) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            quizQuestions: questions,
                          }))
                        }
                      />
                    </div>
                  )}
                </section>
                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <h3>Audience & access</h3>
                    <p>Restrict visibility to specific roles, user types, or hotels.</p>
                  </div>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <FieldLabel label="Allowed roles" />
                      <MultiSelectDropdown
                        options={ROLE_OPTIONS}
                        selectedValues={taskForm.allowedRoles}
                        onChange={(selected) =>
                          setTaskForm((prev) => ({ ...prev, allowedRoles: selected }))
                        }
                        buttonLabel="Select roles"
                        placeholder="All roles"
                      />
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Allowed user types" />
                      <MultiSelectDropdown
                        options={USER_TYPE_OPTIONS}
                        selectedValues={taskForm.allowedUserTypes}
                        onChange={(selected) =>
                          setTaskForm((prev) => ({ ...prev, allowedUserTypes: selected }))
                        }
                        buttonLabel="Select user types"
                        placeholder="All user types"
                      />
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Allowed hotel IDs" />
                      <MultiSelectDropdown
                        options={HOTEL_OPTIONS}
                        selectedValues={taskForm.allowedHotelIds}
                        onChange={(selected) =>
                          setTaskForm((prev) => ({ ...prev, allowedHotelIds: selected }))
                        }
                        buttonLabel="Select hotel IDs"
                        placeholder="All hotels"
                      />
                    </div>
                  </div>
                </section>
                <div className="admin-form-actions">
                  <div className="admin-form-feedback">
                    {taskMessage ? (
                      <p className={taskMessage.type === 'error' ? 'admin-error' : 'admin-success'}>
                        {taskMessage.text}
                      </p>
                    ) : !validation.isValid ? (
                      <p className="admin-publish-hint">
                        {hasAttemptedPublish && validation.message
                          ? validation.message
                          : 'Complete required fields to enable publish.'}
                      </p>
                    ) : (
                      <p className="admin-publish-hint">All mandatory fields are complete.</p>
                    )}
                  </div>
                  <button
                    className="admin-submit"
                    onClick={handlePublishTask}
                    disabled={isPublishDisabled}
                  >
                    {publishTaskMutation.isLoading ? 'Publishing…' : 'Publish Task'}
                  </button>
                </div>
              </div>
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

