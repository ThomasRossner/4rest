import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useQuery, useMutation } from 'react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import './AdminPage.css';
import {
  USER_ROLES,
  USER_TYPES,
  HOTEL_IDS,
  REWARD_TYPES,
  UserRole,
  UserType,
  HotelId,
  RewardType,
} from '../../constants/enums';
import { TASK_TYPE_ICONS } from '../../constants/taskIcons.ts';
import { REWARD_TYPE_ICONS } from '../../constants/rewardIcons.ts';

type AdminMode = 'task' | 'reward' | 'taskManage' | 'rewardManage' | null;
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
  active?: boolean | null;
};

type RewardTemplate = {
  id: string;
  title: string;
  description?: string | null;
  reward_type: string;
  points_cost: number;
  voucher_code?: string | null;
  external_api_id?: string | null;
  allowed_roles?: string[] | null;
  allowed_user_types?: string[] | null;
  allowed_hotel_ids?: string[] | null;
  created_at?: string | null;
  active?: boolean | null;
};

type VideoSourceOption = 'url' | 'upload';
type RewardSource = '' | 'existing' | RewardType;

type TaskFormState = {
  title: string;
  description: string;
  type: string;
  points: number;
  video_url: string;
  videoSource: VideoSourceOption;
  videoFile: File | null;
  quizQuestions: QuizQuestionDraft[];
  qr_code: string;
  photo_required: boolean;
  co2_savings_kg: number;
  allowedRoles: string[];
  allowedUserTypes: string[];
  allowedHotelIds: string[];
  active: boolean;
};

type RewardFormState = {
  title: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  voucherCode: string;
  externalApiId: string;
  allowedRoles: string[];
  allowedUserTypes: string[];
  allowedHotelIds: string[];
  active: boolean;
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

type ConfirmDialogState = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone: 'default' | 'danger';
  onConfirm: () => void;
};

const COMPACT_TOGGLE_STYLE: CSSProperties = {
  transform: 'scale(0.6)',
  transformOrigin: 'center',
};

const defaultConfirmDialogState: ConfirmDialogState = {
  visible: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  confirmTone: 'default',
  onConfirm: () => undefined,
};

const TaskTypeBadge = ({ type }: { type: string }) => {
  const icon = TASK_TYPE_ICONS[type] ?? '🧩';
  return (
    <div className="admin-type-badge">
      <span className="admin-type-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{type.toUpperCase()}</span>
    </div>
  );
};

const RewardTypeBadge = ({ type }: { type: RewardType }) => {
  const icon = REWARD_TYPE_ICONS[type] ?? '🎁';
  return (
    <div className="admin-type-badge">
      <span className="admin-type-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{type.toUpperCase().replace(/_/g, ' ')}</span>
    </div>
  );
};

const ICONS: Record<
  'logout' | 'refresh' | 'back',
  { viewBox: string; paths: string[]; strokeWidth?: number }
> = {
  logout: {
    viewBox: '0 0 24 24',
    paths: [
      'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
      'M16 17l5-5-5-5',
      'M21 12H9',
    ],
    strokeWidth: 1.5,
  },
  refresh: {
    viewBox: '0 0 24 24',
    paths: [
      'M21 2v6h-6',
      'M3 12a9 9 0 0 1 15-6.7L21 8',
      'M3 22v-6h6',
      'M21 12a9 9 0 0 1-15 6.7L3 16',
    ],
    strokeWidth: 1.5,
  },
  back: {
    viewBox: '0 0 24 24',
    paths: ['M19 12H5', 'M12 19l-7-7 7-7'],
    strokeWidth: 1.5,
  },
};

const Icon = ({ name }: { name: keyof typeof ICONS }) => {
  const icon = ICONS[name];
  return (
    <svg
      className="admin-icon"
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth ?? 1.2}
      aria-hidden="true"
    >
      {icon.paths.map((d, index) => (
        <path key={index} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
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
const formatRewardType = (type: RewardType) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const REWARD_TYPE_OPTIONS = REWARD_TYPES.map((type) => ({
  value: type,
  label: formatRewardType(type),
}));

const defaultTaskForm = (type: 'video' | 'qr' | 'photo'): TaskFormState => ({
  title: '',
  description: '',
  type,
  points: 0,
  video_url: '',
  videoSource: 'url',
  videoFile: null,
  quizQuestions: type === 'video' ? [createEmptyQuestion(1)] : [],
  qr_code: type === 'qr' ? '' : '',
  photo_required: type === 'photo',
  co2_savings_kg: 0,
  allowedRoles: [],
  allowedUserTypes: [],
  allowedHotelIds: [],
  active: true,
});

const defaultRewardForm = (type: RewardType): RewardFormState => ({
  title: '',
  description: '',
  type,
  pointsCost: 0,
  voucherCode: '',
  externalApiId: '',
  allowedRoles: [],
  allowedUserTypes: [],
  allowedHotelIds: [],
  active: true,
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

type ValidationResult = {
  isValid: boolean;
  message: string | null;
};

type ValidateTaskFormParams = {
  taskSource: TaskSource;
  selectedExistingTaskId: string;
  taskForm: TaskFormState;
  isEditing?: boolean;
};

type ValidateRewardFormParams = {
  rewardSource: RewardSource;
  selectedRewardTemplate: string;
  rewardForm: RewardFormState;
  isEditing?: boolean;
};

const validateTaskFormState = ({
  taskSource,
  selectedExistingTaskId,
  taskForm,
  isEditing = false,
}: ValidateTaskFormParams): ValidationResult => {
  if (!taskSource && !isEditing) {
    return { isValid: false, message: 'Choose how you want to start creating your task.' };
  }

  if (!isEditing && taskSource === 'existing' && !selectedExistingTaskId) {
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
    if (taskForm.videoSource === 'url') {
      if (!taskForm.video_url.trim()) {
        return { isValid: false, message: 'Video URL is required for video tasks.' };
      }
    } else {
      if (!taskForm.videoFile) {
        return { isValid: false, message: 'Upload a video file for video tasks.' };
      }
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

const validateRewardFormState = ({
  rewardSource,
  selectedRewardTemplate,
  rewardForm,
  isEditing = false,
}: ValidateRewardFormParams): ValidationResult => {
  if (!rewardSource && !isEditing) {
    return { isValid: false, message: 'Choose how you want to start creating your reward.' };
  }

  if (!isEditing && rewardSource === 'existing' && !selectedRewardTemplate) {
    return { isValid: false, message: 'Select an existing reward template.' };
  }

  if (!rewardForm.title.trim()) {
    return { isValid: false, message: 'Title is required.' };
  }

  if (!rewardForm.description.trim()) {
    return { isValid: false, message: 'Description is required.' };
  }

  if (!rewardForm.type || !(REWARD_TYPES as readonly string[]).includes(rewardForm.type)) {
    return { isValid: false, message: 'Select a valid reward type.' };
  }

  if (!Number.isFinite(rewardForm.pointsCost) || Number.isNaN(rewardForm.pointsCost)) {
    return { isValid: false, message: 'Points cost must be zero or greater.' };
  }

  if (rewardForm.pointsCost < 0) {
    return { isValid: false, message: 'Points cost must be zero or greater.' };
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
        {buttonLabel && <span className="admin-multi-select-label">{buttonLabel}</span>}
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
                    className="admin-checkbox"
                    style={COMPACT_TOGGLE_STYLE}
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
                        className="admin-radio"
                        style={COMPACT_TOGGLE_STYLE}
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

const ConfirmDialog = ({
  visible,
  title,
  description,
  confirmLabel,
  confirmTone,
  onCancel,
  onConfirm,
}: ConfirmDialogState & { onCancel: () => void }) => {
  if (!visible) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="admin-modal-header">
          <h3 id="confirm-title">{title}</h3>
        </div>
        <div className="admin-modal-body">
          <p>{description}</p>
        </div>
        <div className="admin-modal-footer">
          <button type="button" className="admin-action-button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`admin-action-button ${confirmTone === 'danger' ? 'danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
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
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskReturnMode, setTaskReturnMode] = useState<AdminMode | null>(null);
  const [taskManagementMessage, setTaskManagementMessage] = useState<
    { type: 'error' | 'success'; text: string } | null
  >(null);
  const [includeInactiveTasks, setIncludeInactiveTasks] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskConfirm, setTaskConfirm] = useState<ConfirmDialogState>(defaultConfirmDialogState);

  const [rewardSource, setRewardSource] = useState<RewardSource>('');
  const [selectedRewardTemplate, setSelectedRewardTemplate] = useState<string>('');
  const [rewardForm, setRewardForm] = useState<RewardFormState>(() => defaultRewardForm('discount'));
  const [rewardMessage, setRewardMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );
  const [hasAttemptedRewardPublish, setHasAttemptedRewardPublish] = useState(false);
  const [isEditingReward, setIsEditingReward] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardReturnMode, setRewardReturnMode] = useState<AdminMode | null>(null);
  const [rewardManagementMessage, setRewardManagementMessage] = useState<
    { type: 'error' | 'success'; text: string } | null
  >(null);
  const [includeInactiveRewards, setIncludeInactiveRewards] = useState(false);
  const [selectedRewardIds, setSelectedRewardIds] = useState<string[]>([]);
  const [rewardConfirm, setRewardConfirm] = useState<ConfirmDialogState>(defaultConfirmDialogState);

  const taskValidation = useMemo(
    () => validateTaskFormState({ taskSource, selectedExistingTaskId, taskForm, isEditing: isEditingTask }),
    [taskSource, selectedExistingTaskId, taskForm, isEditingTask]
  );

  const {
    data: adminTasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery<AdminTaskTemplate[]>(
    ['adminTasks', includeInactiveTasks],
    () => api.getTasks({ includeAll: true, includeInactive: includeInactiveTasks }),
    {
      enabled: isAdmin && (mode === 'task' || mode === 'taskManage'),
    }
  );

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
      allowed_roles: normalizeEnumArray(task.allowed_roles) as UserRole[],
      allowed_user_types: normalizeEnumArray(task.allowed_user_types) as UserType[],
      allowed_hotel_ids: normalizeEnumArray(task.allowed_hotel_ids) as HotelId[],
      active: task.active ?? true,
    }));
  }, [adminTasks]);

  const {
    data: rewardTemplatesData,
    isLoading: rewardTemplatesLoading,
    error: rewardTemplatesError,
    refetch: refetchRewardTemplates,
  } = useQuery<RewardTemplate[]>(
    ['rewardTemplates', includeInactiveRewards],
    () => api.getRewardTemplates({ includeInactive: includeInactiveRewards }),
    {
      enabled: isAdmin && (mode === 'reward' || mode === 'rewardManage'),
    }
  );

  const rewardTemplates = rewardTemplatesData ?? [];
  const normalizedRewardTemplates = useMemo(() => {
    return rewardTemplates.map((template) => ({
      ...template,
      allowed_roles: normalizeEnumArray(template.allowed_roles),
      allowed_user_types: normalizeEnumArray(template.allowed_user_types),
      allowed_hotel_ids: normalizeEnumArray(template.allowed_hotel_ids),
      active: template.active ?? true,
    }));
  }, [rewardTemplates]);

  const rewardValidation = useMemo(
    () => validateRewardFormState({ rewardSource, selectedRewardTemplate, rewardForm, isEditing: isEditingReward }),
    [rewardSource, selectedRewardTemplate, rewardForm, isEditingReward]
  );

  const publishTaskMutation = useMutation((payload: any) => api.createCustomTask(payload), {
    onSuccess: () => {
      setTaskMessage({ type: 'success', text: 'Task published successfully.' });
      setTaskSource('');
      setSelectedExistingTaskId('');
      setTaskForm(defaultTaskForm('video'));
      setHasAttemptedPublish(false);
      setTaskReturnMode(null);
      void refetchTasks();
    },
    onError: (error: any) => {
      setTaskMessage({ type: 'error', text: error?.message || 'Failed to publish task.' });
    },
  });

  const updateTaskMutation = useMutation(
    ({ id, payload }: { id: string; payload: any }) => api.updateTask(id, payload),
    {
      onSuccess: () => {
        setTaskMessage({ type: 'success', text: 'Task updated successfully.' });
        setIsEditingTask(false);
        setEditingTaskId(null);
        setMode(taskReturnMode ?? 'task');
        setTaskSource('');
        setSelectedExistingTaskId('');
        setTaskForm(defaultTaskForm('video'));
        setHasAttemptedPublish(false);
        setTaskReturnMode(null);
        void refetchTasks();
      },
      onError: (error: any) => {
        setTaskMessage({ type: 'error', text: error?.message || 'Failed to update task.' });
      },
    }
  );

  const createRewardMutation = useMutation((payload: any) => api.createReward(payload), {
    onSuccess: () => {
      setRewardMessage({ type: 'success', text: 'Reward published successfully.' });
      setHasAttemptedRewardPublish(false);
      setRewardSource('');
      setSelectedRewardTemplate('');
      setRewardForm(defaultRewardForm('discount'));
      setRewardReturnMode(null);
      void refetchRewardTemplates();
    },
    onError: (error: any) => {
      setRewardMessage({ type: 'error', text: error?.message || 'Failed to publish reward.' });
    },
  });

  const updateRewardMutation = useMutation(
    ({ id, payload }: { id: string; payload: any }) => api.updateReward(id, payload),
    {
      onSuccess: () => {
        setRewardMessage({ type: 'success', text: 'Reward updated successfully.' });
        setIsEditingReward(false);
        setEditingRewardId(null);
        setHasAttemptedRewardPublish(false);
        setMode(rewardReturnMode ?? 'reward');
        setRewardSource('');
        setSelectedRewardTemplate('');
        setRewardForm(defaultRewardForm('discount'));
        setRewardReturnMode(null);
        void refetchRewardTemplates();
      },
      onError: (error: any) => {
        setRewardMessage({ type: 'error', text: error?.message || 'Failed to update reward.' });
      },
    }
  );

  const isPublishDisabled =
    publishTaskMutation.isLoading ||
    updateTaskMutation.isLoading ||
    isUploadingVideo ||
    !taskValidation.isValid;
  const isRewardPublishDisabled =
    createRewardMutation.isLoading || updateRewardMutation.isLoading || !rewardValidation.isValid;

  useEffect(() => {
    if (isEditingTask) {
      return;
    }
    setTaskMessage(null);
    setHasAttemptedPublish(false);
    setIsUploadingVideo(false);
    if (taskSource === 'existing') {
      setSelectedExistingTaskId('');
      setTaskForm(defaultTaskForm('video'));
    } else if (taskSource === 'video' || taskSource === 'qr' || taskSource === 'photo') {
      setSelectedExistingTaskId('');
      setTaskForm(defaultTaskForm(taskSource));
    }
  }, [taskSource, isEditingTask]);

  useEffect(() => {
    if (isEditingTask) return;
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
      videoSource: 'url',
      videoFile: null,
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
      active: template.active ?? true,
    });
  }, [taskSource, selectedExistingTaskId, existingTemplates, isEditingTask]);

  useEffect(() => {
    if (isEditingReward) {
      return;
    }
    if (!rewardSource) {
      setHasAttemptedRewardPublish(false);
      setSelectedRewardTemplate('');
      setRewardForm(defaultRewardForm('discount'));
      return;
    }
    setRewardMessage(null);
    if (rewardSource === 'existing') {
      setSelectedRewardTemplate('');
      setRewardForm(defaultRewardForm('discount'));
    } else {
      setSelectedRewardTemplate('');
      setRewardForm(defaultRewardForm(rewardSource));
    }
  }, [rewardSource, isEditingReward]);

  useEffect(() => {
    if (isEditingReward) {
      return;
    }
    if (rewardSource !== 'existing') {
      return;
    }
    setRewardMessage(null);
    setHasAttemptedRewardPublish(false);
    if (!selectedRewardTemplate) {
      setRewardForm(defaultRewardForm('discount'));
      return;
    }
    const template = normalizedRewardTemplates.find((item) => item.id === selectedRewardTemplate);
    if (!template) {
      return;
    }
    const templateType = (REWARD_TYPES as readonly string[]).includes(template.reward_type)
      ? (template.reward_type as RewardType)
      : 'discount';
    const pointsCostRaw =
      template.points_cost !== undefined && template.points_cost !== null
        ? Number(template.points_cost)
        : 0;
    const normalizedPointsCost = Number.isNaN(pointsCostRaw) ? 0 : pointsCostRaw;
    setRewardForm({
      title: template.title ?? '',
      description: template.description ?? '',
      type: templateType,
      pointsCost: normalizedPointsCost,
      voucherCode: template.voucher_code ?? '',
      externalApiId: template.external_api_id ?? '',
      allowedRoles: normalizeEnumArray(template.allowed_roles),
      allowedUserTypes: normalizeEnumArray(template.allowed_user_types),
      allowedHotelIds: normalizeEnumArray(template.allowed_hotel_ids),
      active: template.active ?? true,
    });
  }, [rewardSource, selectedRewardTemplate, normalizedRewardTemplates, isEditingReward]);

  const handlePublishTask = async () => {
    try {
      setTaskMessage(null);
      setHasAttemptedPublish(true);

      if (!taskValidation.isValid) {
        setTaskMessage({
          type: 'error',
          text: taskValidation.message ?? 'Please complete the required fields.',
        });
        return;
      }

      const prepareVideoData = async (taskType: string) => {
        if (taskType !== 'video') {
          return { videoUrl: undefined as string | undefined, quizPayload: undefined as any };
        }

        let videoUrl = taskForm.video_url.trim();

        if (taskForm.videoSource === 'upload') {
          const file = taskForm.videoFile;
          if (!file) {
            throw new Error('Upload a video file for video tasks.');
          }
          setIsUploadingVideo(true);
          try {
            const uploadResponse = await api.uploadTaskVideo(file);
            const uploadedUrl = uploadResponse?.video_url || uploadResponse?.url;
            if (!uploadedUrl || typeof uploadedUrl !== 'string') {
              throw new Error('Video upload failed.');
            }
            videoUrl = uploadedUrl;
            setTaskForm((prev) => ({ ...prev, video_url: uploadedUrl }));
          } finally {
            setIsUploadingVideo(false);
          }
        }

        const quizPayload = buildQuizPayload(taskForm.quizQuestions);
        return { videoUrl, quizPayload };
      };

      if (isEditingTask && editingTaskId) {
        const { videoUrl, quizPayload } = await prepareVideoData(taskForm.type);

        const payload: any = {
          title: taskForm.title,
          description: taskForm.description,
          type: taskForm.type,
          points: Number(taskForm.points) || 0,
          co2_savings_kg: Number(taskForm.co2_savings_kg) || 0,
          allowed_roles: ensureRoleList(taskForm.allowedRoles),
          allowed_user_types: ensureUserTypeList(taskForm.allowedUserTypes),
          allowed_hotel_ids: ensureHotelIdList(taskForm.allowedHotelIds),
          active: Boolean(taskForm.active),
        };

        if (taskForm.type === 'video') {
          if (!videoUrl) {
            throw new Error('Video URL is required for video tasks.');
          }
          payload.video_url = videoUrl;
          payload.quiz_questions = quizPayload;
        }
        if (taskForm.type === 'qr') {
          payload.qr_code = taskForm.qr_code.trim();
        }
        if (taskForm.type === 'photo') {
          payload.photo_required = true;
        }

        await updateTaskMutation.mutateAsync({ id: editingTaskId, payload });
        return;
      }

      if (taskSource === 'existing') {
        const template = existingTemplates.find((task) => task.id === selectedExistingTaskId);
        if (!template) {
          setTaskMessage({ type: 'error', text: 'Selected task not found.' });
          return;
        }

        const { videoUrl, quizPayload } = await prepareVideoData(template.type);

        const payload: any = {
          title: taskForm.title,
          description: taskForm.description,
          type: template.type,
          points: Number(taskForm.points) || 0,
          co2_savings_kg: Number(taskForm.co2_savings_kg) || 0,
          allowed_roles: ensureRoleList(taskForm.allowedRoles),
          allowed_user_types: ensureUserTypeList(taskForm.allowedUserTypes),
          allowed_hotel_ids: ensureHotelIdList(taskForm.allowedHotelIds),
          active: Boolean(taskForm.active),
        };

        if (template.type === 'video') {
          if (!videoUrl) {
            throw new Error('Video URL is required for video tasks.');
          }
          payload.video_url = videoUrl;
          payload.quiz_questions = quizPayload;
        }
        if (template.type === 'qr') {
          payload.qr_code = taskForm.qr_code.trim();
        }
        if (template.type === 'photo') {
          payload.photo_required = true;
        }

        await publishTaskMutation.mutateAsync(payload);
        return;
      }

      if (!taskSource) {
        return;
      }

      const { videoUrl, quizPayload } = await prepareVideoData(taskForm.type);

      const payload: any = {
        title: taskForm.title,
        description: taskForm.description,
        type: taskForm.type,
        points: Number(taskForm.points) || 0,
        co2_savings_kg: Number(taskForm.co2_savings_kg) || 0,
        allowed_roles: ensureRoleList(taskForm.allowedRoles),
        allowed_user_types: ensureUserTypeList(taskForm.allowedUserTypes),
        allowed_hotel_ids: ensureHotelIdList(taskForm.allowedHotelIds),
        active: Boolean(taskForm.active),
      };

      if (taskSource === 'video') {
        if (!videoUrl) {
          throw new Error('Video URL is required for video tasks.');
        }
        payload.video_url = videoUrl;
        payload.quiz_questions = quizPayload;
      }
      if (taskSource === 'qr') {
        payload.qr_code = taskForm.qr_code.trim();
      }
      if (taskSource === 'photo') {
        payload.photo_required = true;
      }

      await publishTaskMutation.mutateAsync(payload);
    } catch (error: any) {
      setIsUploadingVideo(false);
      setTaskMessage({ type: 'error', text: error?.message || 'Failed to prepare payload.' });
    }
  };

  const handlePublishReward = async () => {
    try {
      setRewardMessage(null);
      setHasAttemptedRewardPublish(true);

      if (!rewardValidation.isValid) {
        setRewardMessage({
          type: 'error',
          text: rewardValidation.message ?? 'Please complete the required fields.',
        });
        return;
      }

      const allowedRoles = ensureRoleList(rewardForm.allowedRoles);
      const allowedUserTypes = ensureUserTypeList(rewardForm.allowedUserTypes);
      const allowedHotelIds = ensureHotelIdList(rewardForm.allowedHotelIds);
      const pointsCost = Number(rewardForm.pointsCost) || 0;

      const basePayload: any = {
        title: rewardForm.title,
        description: rewardForm.description,
        pointsCost,
        rewardType: rewardForm.type,
        allowed_roles: allowedRoles,
        allowed_user_types: allowedUserTypes,
        allowed_hotel_ids: allowedHotelIds,
        active: Boolean(rewardForm.active),
      };

      if (rewardForm.voucherCode.trim()) {
        basePayload.voucherCode = rewardForm.voucherCode.trim();
      }
      if (rewardForm.externalApiId.trim()) {
        basePayload.externalApiId = rewardForm.externalApiId.trim();
      }

      if (isEditingReward && editingRewardId) {
        await updateRewardMutation.mutateAsync({ id: editingRewardId, payload: basePayload });
        return;
      }

      await createRewardMutation.mutateAsync(basePayload);
    } catch (error: any) {
      setRewardMessage({
        type: 'error',
        text: error?.message || 'Failed to prepare reward payload.',
      });
    }
  };

  useEffect(() => {
    setSelectedTaskIds((prev) =>
      prev.filter((id) => existingTemplates.some((task) => task.id === id))
    );
  }, [existingTemplates]);

  useEffect(() => {
    setSelectedRewardIds((prev) =>
      prev.filter((id) => normalizedRewardTemplates.some((reward) => reward.id === id))
    );
  }, [normalizedRewardTemplates]);

  const toggleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return Array.from(next);
    });
  };

  const toggleRewardSelection = (rewardId: string, checked: boolean) => {
    setSelectedRewardIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(rewardId);
      } else {
        next.delete(rewardId);
      }
      return Array.from(next);
    });
  };

  const handleTaskBulkStatus = async (active: boolean) => {
    if (!selectedTaskIds.length) return;
    try {
      setTaskManagementMessage(null);
      await api.bulkUpdateTasksStatus(selectedTaskIds, active);
      setTaskManagementMessage({
        type: 'success',
        text: active ? 'Selected tasks activated.' : 'Selected tasks deactivated.',
      });
      setSelectedTaskIds([]);
      void refetchTasks();
    } catch (error: any) {
      setTaskManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update selected tasks.',
      });
    }
  };

  const handleTaskBulkDelete = async () => {
    if (!selectedTaskIds.length) return;
    setTaskConfirm({
      visible: true,
      title: 'Delete selected tasks',
      description: 'Are you sure you want to delete the selected tasks? They will become inactive.',
      confirmLabel: 'Delete tasks',
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setTaskManagementMessage(null);
          await api.bulkDeleteTasks(selectedTaskIds);
          setTaskManagementMessage({
            type: 'success',
            text: 'Selected tasks deleted.',
          });
          setSelectedTaskIds([]);
          void refetchTasks();
        } catch (error: any) {
          setTaskManagementMessage({
            type: 'error',
            text: error?.message || 'Failed to delete selected tasks.',
          });
        } finally {
          setTaskConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  const handleTaskStatusChange = async (taskId: string, active: boolean) => {
    try {
      setTaskManagementMessage(null);
      await api.bulkUpdateTasksStatus([taskId], active);
      setTaskManagementMessage({
        type: 'success',
        text: active ? 'Task activated.' : 'Task deactivated.',
      });
      void refetchTasks();
    } catch (error: any) {
      setTaskManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update task.',
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    setTaskConfirm({
      visible: true,
      title: 'Delete task',
      description: 'Are you sure you want to delete this task? It will become inactive for users.',
      confirmLabel: 'Delete task',
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setTaskManagementMessage(null);
          await api.bulkDeleteTasks([taskId]);
          setTaskManagementMessage({
            type: 'success',
            text: 'Task deleted.',
          });
          if (editingTaskId === taskId) {
            cancelTaskEdit();
          }
          void refetchTasks();
        } catch (error: any) {
          setTaskManagementMessage({
            type: 'error',
            text: error?.message || 'Failed to delete task.',
          });
        } finally {
          setTaskConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  const handleRewardBulkStatus = async (active: boolean) => {
    if (!selectedRewardIds.length) return;
    try {
      setRewardManagementMessage(null);
      await api.bulkUpdateRewardsStatus(selectedRewardIds, active);
      setRewardManagementMessage({
        type: 'success',
        text: active ? 'Selected rewards activated.' : 'Selected rewards deactivated.',
      });
      setSelectedRewardIds([]);
      void refetchRewardTemplates();
    } catch (error: any) {
      setRewardManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update selected rewards.',
      });
    }
  };

  const handleRewardBulkDelete = async () => {
    if (!selectedRewardIds.length) return;
    setRewardConfirm({
      visible: true,
      title: 'Delete selected rewards',
      description: 'Are you sure you want to delete the selected rewards? They will become inactive.',
      confirmLabel: 'Delete rewards',
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setRewardManagementMessage(null);
          await api.bulkDeleteRewards(selectedRewardIds);
          setRewardManagementMessage({
            type: 'success',
            text: 'Selected rewards deleted.',
          });
          setSelectedRewardIds([]);
          void refetchRewardTemplates();
        } catch (error: any) {
          setRewardManagementMessage({
            type: 'error',
            text: error?.message || 'Failed to delete selected rewards.',
          });
        } finally {
          setRewardConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  const handleRewardStatusChange = async (rewardId: string, active: boolean) => {
    try {
      setRewardManagementMessage(null);
      await api.bulkUpdateRewardsStatus([rewardId], active);
      setRewardManagementMessage({
        type: 'success',
        text: active ? 'Reward activated.' : 'Reward deactivated.',
      });
      void refetchRewardTemplates();
    } catch (error: any) {
      setRewardManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update reward.',
      });
    }
  };

  const handleRewardDelete = async (rewardId: string) => {
    setRewardConfirm({
      visible: true,
      title: 'Delete reward',
      description: 'Are you sure you want to delete this reward? It will become inactive for users.',
      confirmLabel: 'Delete reward',
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setRewardManagementMessage(null);
          await api.bulkDeleteRewards([rewardId]);
          setRewardManagementMessage({
            type: 'success',
            text: 'Reward deleted.',
          });
          if (editingRewardId === rewardId) {
            cancelRewardEdit();
          }
          void refetchRewardTemplates();
        } catch (error: any) {
          setRewardManagementMessage({
            type: 'error',
            text: error?.message || 'Failed to delete reward.',
          });
        } finally {
          setRewardConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  const startTaskEdit = (task: AdminTaskTemplate) => {
    setTaskReturnMode(mode === 'taskManage' ? 'taskManage' : null);
    setMode('task');
    setTaskManagementMessage(null);
    setTaskMessage(null);
    const source: TaskSource =
      task.type === 'video' ? 'video' : task.type === 'qr' ? 'qr' : task.type === 'photo' ? 'photo' : '';
    setTaskSource(source);
    setSelectedExistingTaskId('');
    setTaskForm({
      title: task.title ?? '',
      description: task.description ?? '',
      type: task.type,
      points: task.points ?? 0,
      video_url: task.video_url ?? '',
      videoSource: 'url',
      videoFile: null,
      quizQuestions:
        task.type === 'video' ? normalizeQuizQuestions(task.quiz_questions ?? []) : [],
      qr_code: task.qr_code ?? '',
      photo_required: task.type === 'photo',
      co2_savings_kg: task.co2_savings_kg ?? 0,
      allowedRoles: normalizeEnumArray(task.allowed_roles),
      allowedUserTypes: normalizeEnumArray(task.allowed_user_types),
      allowedHotelIds: normalizeEnumArray(task.allowed_hotel_ids),
      active: task.active ?? true,
    });
    setIsEditingTask(true);
    setEditingTaskId(task.id);
    setHasAttemptedPublish(false);
  };

  const cancelTaskEdit = () => {
    setIsEditingTask(false);
    setEditingTaskId(null);
    setTaskSource('');
    setSelectedExistingTaskId('');
    setTaskForm(defaultTaskForm('video'));
    setTaskMessage(null);
    setHasAttemptedPublish(false);
    if (taskReturnMode) {
      setMode(taskReturnMode);
    } else {
      setMode(null);
    }
    setTaskReturnMode(null);
  };

  const startRewardEdit = (template: RewardTemplate) => {
    setRewardReturnMode(mode === 'rewardManage' ? 'rewardManage' : null);
    setMode('reward');
    setRewardManagementMessage(null);
    setRewardMessage(null);
    const templateType = (REWARD_TYPES as readonly string[]).includes(template.reward_type)
      ? (template.reward_type as RewardType)
      : 'discount';
    setRewardSource(templateType);
    setSelectedRewardTemplate('');
    const pointsCostRaw =
      template.points_cost !== undefined && template.points_cost !== null
        ? Number(template.points_cost)
        : 0;
    const normalizedPointsCost = Number.isNaN(pointsCostRaw) ? 0 : pointsCostRaw;
    setRewardForm({
      title: template.title ?? '',
      description: template.description ?? '',
      type: templateType,
      pointsCost: normalizedPointsCost,
      voucherCode: template.voucher_code ?? '',
      externalApiId: template.external_api_id ?? '',
      allowedRoles: normalizeEnumArray(template.allowed_roles),
      allowedUserTypes: normalizeEnumArray(template.allowed_user_types),
      allowedHotelIds: normalizeEnumArray(template.allowed_hotel_ids),
      active: template.active ?? true,
    });
    setIsEditingReward(true);
    setEditingRewardId(template.id);
    setHasAttemptedRewardPublish(false);
  };

  const cancelRewardEdit = () => {
    setIsEditingReward(false);
    setEditingRewardId(null);
    setRewardSource('');
    setSelectedRewardTemplate('');
    setRewardForm(defaultRewardForm('discount'));
    setRewardMessage(null);
    setHasAttemptedRewardPublish(false);
    if (rewardReturnMode) {
      setMode(rewardReturnMode);
    } else {
      setMode(null);
    }
    setRewardReturnMode(null);
  };

  const allTasksSelected =
    existingTemplates.length > 0 && selectedTaskIds.length === existingTemplates.length;
  const allRewardsSelected =
    normalizedRewardTemplates.length > 0 &&
    selectedRewardIds.length === normalizedRewardTemplates.length;
  const hasTaskSelection = selectedTaskIds.length > 0;
  const hasRewardSelection = selectedRewardIds.length > 0;
  const isTaskSaving = publishTaskMutation.isLoading || updateTaskMutation.isLoading;
  const taskSubmitLabel = isEditingTask
     ? isTaskSaving
      ? 'Saving…'
      : 'Save Task Changes'
     : publishTaskMutation.isLoading
     ? 'Publishing…'
     : 'Publish Task';
  const isRewardSaving = createRewardMutation.isLoading || updateRewardMutation.isLoading;
  const rewardSubmitLabel = isEditingReward
    ? isRewardSaving
      ? 'Saving…'
      : 'Save Reward Changes'
    : createRewardMutation.isLoading
    ? 'Publishing…'
    : 'Publish Reward';

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
        <div className="admin-header-card">
          <div className="admin-header-text">
            <h1 className="admin-title">Administrator Home</h1>
            <p className="admin-subtitle">Curate experiences for guests, employees, and partners.</p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-icon-button" onClick={logout} title="Logout">
              <Icon name="logout" />
              <span className="sr-only">Logout</span>
            </button>
          </div>
        </div>
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
          <button className="admin-choice-card" onClick={() => setMode('taskManage')}>
            <span className="admin-choice-icon">🗂️</span>
            <h2>Manage Tasks</h2>
            <p>Browse, edit, activate, deactivate, or delete existing tasks.</p>
          </button>
          <button className="admin-choice-card" onClick={() => setMode('rewardManage')}>
            <span className="admin-choice-icon">🧾</span>
            <h2>Manage Rewards</h2>
            <p>Review and maintain rewards available to users.</p>
          </button>
        </div>
      )}

      {mode === 'task' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{isEditingTask ? 'Edit Task' : 'Publish Task'}</h2>
              <p>
                {isEditingTask
                  ? 'Update the selected task using the form below.'
                  : 'Select an existing task or start from scratch depending on the task type.'}
              </p>
            </div>
            <div className="admin-actions">
              {!isEditingTask && (
                <button
                  className="admin-icon-button"
                  onClick={() => refetchTasks()}
                  title="Refresh tasks"
                >
                  <Icon name="refresh" />
                  <span className="sr-only">Refresh tasks</span>
                </button>
              )}
              <button
                className="admin-icon-button"
                onClick={() => {
                  if (isEditingTask) {
                    cancelTaskEdit();
                  } else {
                    setMode(null);
                  }
                }}
                title={isEditingTask ? 'Cancel editing' : 'Back to main menu'}
              >
                <Icon name="back" />
                <span className="sr-only">{isEditingTask ? 'Cancel editing' : 'Back'}</span>
              </button>
            </div>
          </header>

          {tasksLoading && <p>Loading tasks…</p>}
          {Boolean(tasksError) && <p className="admin-error">Failed to load existing tasks.</p>}

          <div className="admin-form-card">
            {!isEditingTask && (
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
            )}

            {!isEditingTask && taskSource === 'existing' && (
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
                    <div>
                      <h3>Task basics</h3>
                      <p>Provide the essential details for this task.</p>
                    </div>
                    <TaskTypeBadge type={taskForm.type} />
                  </div>
                  <div className="admin-form-grid admin-form-grid-two">
                    <label className="admin-field admin-field-span-2">
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
                    <div className="admin-field">
                      <FieldLabel label="Active" />
                      <div className="admin-toggle">
                        <input
                          id="task-active-toggle"
                          type="checkbox"
                          className="admin-checkbox"
                          style={COMPACT_TOGGLE_STYLE}
                          checked={taskForm.active}
                          onChange={(event) =>
                            setTaskForm((prev) => ({ ...prev, active: event.target.checked }))
                          }
                        />
                        <label htmlFor="task-active-toggle">
                          {taskForm.active ? 'Active' : 'Inactive'}
                        </label>
                      </div>
                    </div>
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
                      <>
                        <div className="admin-field admin-field-span-2">
                          <FieldLabel label="Video source" required />
                          <div className="admin-video-source">
                            <label className="admin-video-option">
                              <input
                                type="radio"
                                className="admin-radio"
                                style={COMPACT_TOGGLE_STYLE}
                                name="video-source"
                                value="url"
                                checked={taskForm.videoSource === 'url'}
                                onChange={() =>
                                  setTaskForm((prev) => ({
                                    ...prev,
                                    videoSource: 'url',
                                    videoFile: null,
                                  }))
                                }
                              />
                              <span>Use external video URL</span>
                            </label>
                            <label className="admin-video-option">
                              <input
                                type="radio"
                                className="admin-radio"
                                style={COMPACT_TOGGLE_STYLE}
                                name="video-source"
                                value="upload"
                                checked={taskForm.videoSource === 'upload'}
                                onChange={() =>
                                  setTaskForm((prev) => ({
                                    ...prev,
                                    videoSource: 'upload',
                                    video_url: '',
                                  }))
                                }
                              />
                              <span>Upload video file</span>
                            </label>
                          </div>
                        </div>
                        {taskForm.videoSource === 'url' && (
                          <label className="admin-field admin-field-span-2 admin-video-upload-block">
                            <FieldLabel label="Video URL" required />
                            <input
                              type="url"
                              value={taskForm.video_url}
                              onChange={(event) =>
                                setTaskForm((prev) => ({ ...prev, video_url: event.target.value }))
                              }
                              placeholder="https://example.com/video.mp4"
                            />
                          </label>
                        )}
                        {taskForm.videoSource === 'upload' && (
                          <div className="admin-field admin-field-span-2 admin-video-upload-block">
                            <FieldLabel label="Video file" required />
                            <div className="admin-upload-field">
                              <span>Select a video file to upload</span>
                              <div className="admin-upload-control">
                                <label className="admin-upload-button">
                                  <span>Choose file</span>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0] ?? null;
                                      setTaskForm((prev) => ({
                                        ...prev,
                                        videoFile: file,
                                        video_url: file ? '' : '',
                                      }));
                                    }}
                                  />
                                </label>
                                <span className="admin-upload-filename">
                                  {taskForm.videoFile ? taskForm.videoFile.name : 'No file selected'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
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
                  <div className="admin-form-full admin-quiz-block">
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
                    ) : isEditingTask ? (
                      <p className="admin-publish-hint">Editing existing task.</p>
                    ) : isUploadingVideo ? (
                      <p className="admin-publish-hint">Uploading video file…</p>
                    ) : !taskValidation.isValid ? (
                      <p className="admin-publish-hint">
                        {hasAttemptedPublish && taskValidation.message
                          ? taskValidation.message
                          : 'Complete required fields to enable publish.'}
                      </p>
                    ) : (
                      <p className="admin-publish-hint">All mandatory fields are complete.</p>
                    )}
                  </div>
                  <div className="admin-form-actions-buttons">
                    {isEditingTask && (
                      <button
                        type="button"
                        className="admin-action-button secondary"
                        onClick={cancelTaskEdit}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="admin-submit"
                      onClick={handlePublishTask}
                      disabled={isPublishDisabled}
                    >
                      {taskSubmitLabel}
                    </button>
                  </div>
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
              <h2>{isEditingReward ? 'Edit Reward' : 'Publish Reward'}</h2>
              <p>
                {isEditingReward
                  ? 'Update the selected reward using the form below.'
                  : 'Use an existing reward as a template or start from scratch with a predefined type.'}
              </p>
            </div>
            <div className="admin-actions">
              {!isEditingReward && (
                <button
                  className="admin-icon-button"
                  onClick={() => refetchRewardTemplates()}
                  title="Refresh rewards"
                >
                  <Icon name="refresh" />
                  <span className="sr-only">Refresh rewards</span>
                </button>
              )}
              <button
                className="admin-icon-button"
                onClick={() => {
                  if (isEditingReward) {
                    cancelRewardEdit();
                  } else {
                    setMode(null);
                  }
                }}
                title={isEditingReward ? 'Cancel editing' : 'Back to main menu'}
              >
                <Icon name="back" />
                <span className="sr-only">{isEditingReward ? 'Cancel editing' : 'Back'}</span>
              </button>
            </div>
          </header>

          {rewardTemplatesLoading && <p>Loading reward templates…</p>}
          {Boolean(rewardTemplatesError) && (
            <p className="admin-error">Failed to load reward templates.</p>
          )}

          <div className="admin-form-card">
            {!isEditingReward && (
              <label className="admin-field">
                <span>Create from</span>
                <select
                  value={rewardSource}
                  onChange={(event) => setRewardSource(event.target.value as RewardSource)}
                >
                  <option value="">Select option</option>
                  <option value="existing">Existing reward</option>
                  {REWARD_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {`Start from scratch – ${option.label}`}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {!isEditingReward && rewardSource === 'existing' && (
              <label className="admin-field">
                <span>Select existing reward</span>
                <select
                  value={selectedRewardTemplate}
                  onChange={(event) => setSelectedRewardTemplate(event.target.value)}
                >
                  <option value="">Select reward</option>
                  {normalizedRewardTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title} ({formatRewardType(template.reward_type as RewardType)})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {rewardSource === 'existing' &&
              !rewardTemplatesLoading &&
              normalizedRewardTemplates.length === 0 && (
                <p className="admin-field-note">
                  No existing rewards available yet. Create one from scratch first.
                </p>
            )}

            {rewardSource && (rewardSource !== 'existing' || selectedRewardTemplate) && (
              <div className="admin-form-layout">
                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <div>
                      <h3>Reward details</h3>
                      <p>Define the reward content and optional integrations.</p>
                    </div>
                    <RewardTypeBadge type={rewardForm.type} />
                  </div>
                  <div className="admin-form-grid admin-form-grid-two">
                    <label className="admin-field admin-field-span-2">
                      <FieldLabel label="Title" required />
                      <input
                        type="text"
                        value={rewardForm.title}
                        onChange={(event) =>
                          setRewardForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </label>
                    <label className="admin-field admin-field-span-2">
                      <FieldLabel label="Description" required />
                      <textarea
                        value={rewardForm.description}
                        onChange={(event) =>
                          setRewardForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <label className="admin-field">
                      <FieldLabel label="Points cost" required />
                      <input
                        type="number"
                        min={0}
                        value={Number.isNaN(rewardForm.pointsCost) ? '' : rewardForm.pointsCost}
                        onChange={(event) =>
                          setRewardForm((prev) => ({
                            ...prev,
                            pointsCost: Number.parseInt(event.target.value || '0', 10),
                          }))
                        }
                      />
                    </label>
                    <div className="admin-field">
                      <FieldLabel label="Active" />
                      <div className="admin-toggle">
                        <input
                          id="reward-active-toggle"
                          type="checkbox"
                          className="admin-checkbox"
                          style={COMPACT_TOGGLE_STYLE}
                          checked={rewardForm.active}
                          onChange={(event) =>
                            setRewardForm((prev) => ({ ...prev, active: event.target.checked }))
                          }
                        />
                        <label htmlFor="reward-active-toggle">
                          {rewardForm.active ? 'Active' : 'Inactive'}
                        </label>
                      </div>
                    </div>
                    <label className="admin-field">
                      <FieldLabel label="Voucher code" />
                      <input
                        type="text"
                        value={rewardForm.voucherCode}
                        onChange={(event) =>
                          setRewardForm((prev) => ({ ...prev, voucherCode: event.target.value }))
                        }
                        placeholder="Optional code for voucher-based rewards"
                      />
                    </label>
                    <label className="admin-field admin-field-span-2">
                      <FieldLabel label="External API ID" />
                      <input
                        type="text"
                        value={rewardForm.externalApiId}
                        onChange={(event) =>
                          setRewardForm((prev) => ({ ...prev, externalApiId: event.target.value }))
                        }
                        placeholder="Optional identifier for external integrations"
                      />
                    </label>
                  </div>
                </section>

                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <h3>Audience & access</h3>
                    <p>Limit the reward visibility to certain roles, user types, or hotels.</p>
                  </div>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <FieldLabel label="Allowed roles" />
                      <MultiSelectDropdown
                        options={ROLE_OPTIONS}
                        selectedValues={rewardForm.allowedRoles}
                        onChange={(selected) =>
                          setRewardForm((prev) => ({ ...prev, allowedRoles: selected }))
                        }
                        placeholder="All roles"
                      />
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Allowed user types" />
                      <MultiSelectDropdown
                        options={USER_TYPE_OPTIONS}
                        selectedValues={rewardForm.allowedUserTypes}
                        onChange={(selected) =>
                          setRewardForm((prev) => ({ ...prev, allowedUserTypes: selected }))
                        }
                        placeholder="All user types"
                      />
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Allowed hotel IDs" />
                      <MultiSelectDropdown
                        options={HOTEL_OPTIONS}
                        selectedValues={rewardForm.allowedHotelIds}
                        onChange={(selected) =>
                          setRewardForm((prev) => ({ ...prev, allowedHotelIds: selected }))
                        }
                        placeholder="All hotels"
                      />
                    </div>
                  </div>
                </section>

                <div className="admin-form-actions">
                  <div className="admin-form-feedback">
                    {rewardMessage ? (
                      <p className={rewardMessage.type === 'error' ? 'admin-error' : 'admin-success'}>
                        {rewardMessage.text}
                      </p>
                    ) : isEditingReward ? (
                      <p className="admin-publish-hint">Editing existing reward.</p>
                    ) : !rewardValidation.isValid ? (
                      <p className="admin-publish-hint">
                        {hasAttemptedRewardPublish && rewardValidation.message
                          ? rewardValidation.message
                          : 'Complete required fields to enable publish.'}
                      </p>
                    ) : (
                      <p className="admin-publish-hint">All mandatory fields are complete.</p>
                    )}
                  </div>
                  <div className="admin-form-actions-buttons">
                    {isEditingReward && (
                      <button
                        type="button"
                        className="admin-action-button secondary"
                        onClick={cancelRewardEdit}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="admin-submit"
                      onClick={handlePublishReward}
                      disabled={isRewardPublishDisabled}
                    >
                      {rewardSubmitLabel}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {mode === 'taskManage' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>Manage Tasks</h2>
              <p>Browse all tasks, toggle availability, or clean up unused entries.</p>
            </div>
            <div className="admin-actions">
              {!isEditingTask && (
                <button
                  className="admin-icon-button"
                  onClick={() => refetchTasks()}
                  title="Refresh tasks"
                >
                  <Icon name="refresh" />
                  <span className="sr-only">Refresh tasks</span>
                </button>
              )}
              <button
                className="admin-icon-button"
                onClick={() => {
                  if (isEditingTask) {
                    cancelTaskEdit();
                  } else {
                    setMode(null);
                  }
                }}
                title={isEditingTask ? 'Cancel editing' : 'Back to main menu'}
              >
                <Icon name="back" />
                <span className="sr-only">{isEditingTask ? 'Cancel editing' : 'Back'}</span>
              </button>
            </div>
          </header>

          {tasksLoading && <p>Loading tasks…</p>}
          {Boolean(tasksError) && <p className="admin-error">Failed to load existing tasks.</p>}

          <div className="admin-management-card">
            <div className="admin-management-top">
              <div>
                <h3>Existing tasks</h3>
                <p>Review, edit, activate, deactivate, or delete tasks directly.</p>
              </div>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  style={COMPACT_TOGGLE_STYLE}
                  checked={includeInactiveTasks}
                  onChange={(event) => {
                    setIncludeInactiveTasks(event.target.checked);
                    setSelectedTaskIds([]);
                  }}
                />
                <span>Show inactive</span>
              </label>
            </div>
            {taskManagementMessage && (
              <p
                className={
                  taskManagementMessage.type === 'error' ? 'admin-error' : 'admin-success'
                }
              >
                {taskManagementMessage.text}
              </p>
            )}
            <div className="admin-management-actions">
              <div className="admin-bulk-buttons">
                <button
                  className="admin-action-button"
                  onClick={() => handleTaskBulkStatus(true)}
                  disabled={!hasTaskSelection}
                  type="button"
                >
                  Activate
                </button>
                <button
                  className="admin-action-button"
                  onClick={() => handleTaskBulkStatus(false)}
                  disabled={!hasTaskSelection}
                  type="button"
                >
                  Deactivate
                </button>
                <button
                  className="admin-action-button danger"
                  onClick={handleTaskBulkDelete}
                  disabled={!hasTaskSelection}
                  type="button"
                >
                  Delete
                </button>
              </div>
              <span className="admin-selection-count">
                {hasTaskSelection ? `${selectedTaskIds.length} selected` : 'No tasks selected'}
              </span>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '3rem' }}>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        style={COMPACT_TOGGLE_STYLE}
                        checked={allTasksSelected && existingTemplates.length > 0}
                        disabled={!existingTemplates.length}
                        onChange={(event) =>
                          setSelectedTaskIds(
                            event.target.checked
                              ? existingTemplates.map((task) => task.id)
                              : []
                          )
                        }
                        aria-label="Select all tasks"
                      />
                    </th>
                    <th>Task</th>
                    <th>Type</th>
                    <th>Points</th>
                    <th>Status</th>
                    <th style={{ width: '24rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {existingTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="admin-table-empty">
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    existingTemplates.map((task) => {
                      const isSelected = selectedTaskIds.includes(task.id);
                      return (
                        <tr key={task.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="admin-checkbox"
                              style={COMPACT_TOGGLE_STYLE}
                              checked={isSelected}
                              onChange={(event) =>
                                toggleTaskSelection(task.id, event.target.checked)
                              }
                              aria-label={`Select task ${task.title}`}
                            />
                          </td>
                          <td data-label="Task">
                            <div className="admin-table-primary">
                              <span className="admin-table-title">
                                {task.title || 'Untitled task'}
                              </span>
                              {task.description && (
                                <span className="admin-table-subtitle">{task.description}</span>
                              )}
                            </div>
                          </td>
                          <td data-label="Type">
                            <span className="admin-table-type">
                              <TaskTypeBadge type={task.type} />
                            </span>
                          </td>
                          <td data-label="Points">{task.points}</td>
                          <td data-label="Status">
                            <span
                              className={`admin-status-badge ${
                                task.active ? 'active' : 'inactive'
                              }`}
                            >
                              {task.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td data-label="Actions" className="admin-table-actions">
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => startTaskEdit(task)}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => handleTaskStatusChange(task.id, !task.active)}
                            >
                              {task.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              className="admin-action-button danger"
                              type="button"
                              onClick={() => handleTaskDelete(task.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {mode === 'rewardManage' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>Manage Rewards</h2>
              <p>Review existing rewards and adjust their details or availability.</p>
            </div>
            <div className="admin-actions">
              {!isEditingReward && (
                <button
                  className="admin-icon-button"
                  onClick={() => refetchRewardTemplates()}
                  title="Refresh rewards"
                >
                  <Icon name="refresh" />
                  <span className="sr-only">Refresh rewards</span>
                </button>
              )}
              <button
                className="admin-icon-button"
                onClick={() => {
                  if (isEditingReward) {
                    cancelRewardEdit();
                  } else {
                    setMode(null);
                  }
                }}
                title={isEditingReward ? 'Cancel editing' : 'Back to main menu'}
              >
                <Icon name="back" />
                <span className="sr-only">{isEditingReward ? 'Cancel editing' : 'Back'}</span>
              </button>
            </div>
          </header>

          {rewardTemplatesLoading && <p>Loading rewards…</p>}
          {Boolean(rewardTemplatesError) && (
            <p className="admin-error">Failed to load rewards.</p>
          )}

          <div className="admin-management-card">
            <div className="admin-management-top">
              <div>
                <h3>Existing rewards</h3>
                <p>Maintain active rewards, edit their details, or clean up inactive entries.</p>
              </div>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  style={COMPACT_TOGGLE_STYLE}
                  checked={includeInactiveRewards}
                  onChange={(event) => {
                    setIncludeInactiveRewards(event.target.checked);
                    setSelectedRewardIds([]);
                  }}
                />
                <span>Show inactive</span>
              </label>
            </div>
            {rewardManagementMessage && (
              <p
                className={
                  rewardManagementMessage.type === 'error' ? 'admin-error' : 'admin-success'
                }
              >
                {rewardManagementMessage.text}
              </p>
            )}
            <div className="admin-management-actions">
              <div className="admin-bulk-buttons">
                <button
                  className="admin-action-button"
                  onClick={() => handleRewardBulkStatus(true)}
                  disabled={!hasRewardSelection}
                  type="button"
                >
                  Activate
                </button>
                <button
                  className="admin-action-button"
                  onClick={() => handleRewardBulkStatus(false)}
                  disabled={!hasRewardSelection}
                  type="button"
                >
                  Deactivate
                </button>
                <button
                  className="admin-action-button danger"
                  onClick={handleRewardBulkDelete}
                  disabled={!hasRewardSelection}
                  type="button"
                >
                  Delete
                </button>
              </div>
              <span className="admin-selection-count">
                {hasRewardSelection
                  ? `${selectedRewardIds.length} selected`
                  : 'No rewards selected'}
              </span>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '3rem' }}>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        style={COMPACT_TOGGLE_STYLE}
                        checked={allRewardsSelected && normalizedRewardTemplates.length > 0}
                        disabled={!normalizedRewardTemplates.length}
                        onChange={(event) =>
                          setSelectedRewardIds(
                            event.target.checked
                              ? normalizedRewardTemplates.map((reward) => reward.id)
                              : []
                          )
                        }
                        aria-label="Select all rewards"
                      />
                    </th>
                    <th>Reward</th>
                    <th>Type</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th style={{ width: '24rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedRewardTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="admin-table-empty">
                        No rewards found.
                      </td>
                    </tr>
                  ) : (
                    normalizedRewardTemplates.map((reward) => {
                      const isSelected = selectedRewardIds.includes(reward.id);
                      const cost =
                        reward.points_cost !== undefined && reward.points_cost !== null
                          ? Number(reward.points_cost)
                          : 0;
                      return (
                        <tr key={reward.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="admin-checkbox"
                              style={COMPACT_TOGGLE_STYLE}
                              checked={isSelected}
                              onChange={(event) =>
                                toggleRewardSelection(reward.id, event.target.checked)
                              }
                              aria-label={`Select reward ${reward.title}`}
                            />
                          </td>
                          <td data-label="Reward">
                             <div className="admin-table-primary">
                               <span className="admin-table-title">
                                 {reward.title || 'Untitled reward'}
                               </span>
                               {reward.description && (
                                 <span className="admin-table-subtitle">{reward.description}</span>
                               )}
                             </div>
                           </td>
                          <td data-label="Type">
                             <span className="admin-table-type">
                               <RewardTypeBadge type={reward.reward_type as RewardType} />
                             </span>
                           </td>
                          <td data-label="Cost">{cost}</td>
                          <td data-label="Status">
                             <span
                               className={`admin-status-badge ${
                                 reward.active ? 'active' : 'inactive'
                               }`}
                             >
                               {reward.active ? 'Active' : 'Inactive'}
                             </span>
                           </td>
                          <td data-label="Actions" className="admin-table-actions">
                             <button
                               className="admin-action-button"
                               type="button"
                               onClick={() => startRewardEdit(reward)}
                             >
                               Edit
                             </button>
                             <button
                               className="admin-action-button"
                               type="button"
                               onClick={() => handleRewardStatusChange(reward.id, !reward.active)}
                             >
                               {reward.active ? 'Deactivate' : 'Activate'}
                             </button>
                             <button
                               className="admin-action-button danger"
                               type="button"
                               onClick={() => handleRewardDelete(reward.id)}
                             >
                               Delete
                             </button>
                           </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      <ConfirmDialog
        {...taskConfirm}
        onCancel={() => setTaskConfirm(defaultConfirmDialogState)}
      />
      <ConfirmDialog
        {...rewardConfirm}
        onCancel={() => setRewardConfirm(defaultConfirmDialogState)}
      />
    </div>
  );
}

export default AdminPage;

