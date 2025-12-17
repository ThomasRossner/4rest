import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
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
import QrScannerPage from './QrScannerPage';
import { LocationMap } from '../../components/LocationMap/LocationMap';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';

type AdminMode =
  | 'task'
  | 'reward'
  | 'taskManage'
  | 'rewardManage'
  | 'location'
  | 'locationManage'
  | 'qrScanner'
  | 'forestStats'
  | null;
type TaskSource = '' | 'existing' | 'video' | 'quiz' | 'article_quiz' | 'qr' | 'photo' | 'visit_location';

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
  location_id?: string | null;
  target_latitude?: number | null;
  target_longitude?: number | null;
  location?: AdminLocation | null;
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
  location_id?: string | null;
  location?: AdminLocation | null;
  active?: boolean | null;
};

type AdminLocation = {
  id: string;
  name: string;
  description?: string | null;
  is_online: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
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
  locationId: string;
  active: boolean;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  article_url: string;
  article_content: string;
  articleSource: 'url' | 'content';
  target_latitude?: string;
  target_longitude?: string;
  target_address?: string;
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
  locationId: string;
  active: boolean;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
};

type LocationFormState = {
  name: string;
  description: string;
  mode: 'online' | 'physical';
  address: string;
  latitude: string;
  longitude: string;
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

type FilterDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  options: Array<{ id: string; name?: string } | string>;
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  type: 'location' | 'status' | 'recurrence' | 'type';
};

const FilterDropdown = ({
  isOpen,
  onClose,
  position,
  options,
  selectedValue,
  onSelect,
  type,
}: FilterDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatValue = (value: string): string => {
    if (type === 'status') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (type === 'recurrence') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (type === 'type') {
      // Format task/reward types to be more readable
      return value.toUpperCase().replace(/_/g, ' ');
    }
    return value;
  };

  const getOptionLabel = (option: { id: string; name?: string } | string): string => {
    if (typeof option === 'string') {
      return formatValue(option);
    }
    return option.name || option.id;
  };

  const getOptionValue = (option: { id: string; name?: string } | string): string => {
    if (typeof option === 'string') {
      return option;
    }
    return option.id;
  };

  return (
    <div
      ref={dropdownRef}
      className="admin-filter-dropdown"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
      }}
    >
      <div className="admin-filter-dropdown-header">
        <span>{t('admin.filters.filterBy', { type })}</span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="admin-filter-clear"
          style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem' }}
        >
          Clear
        </button>
      </div>
      <div className="admin-filter-dropdown-list">
        <button
          type="button"
          className={`admin-filter-option ${selectedValue === null ? 'active' : ''}`}
          onClick={() => {
            onSelect(null);
            onClose();
          }}
        >
          All
        </button>
        {options.map((option) => {
          const value = getOptionValue(option);
          const label = getOptionLabel(option);
          return (
            <button
              key={value}
              type="button"
              className={`admin-filter-option ${selectedValue === value ? 'active' : ''}`}
              onClick={() => {
                onSelect(value);
                onClose();
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

type MobileFilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  filterOptions: {
    locations: Array<{ id: string; name?: string } | string>;
    statuses: Array<string>;
    recurrences: Array<string>;
    types: Array<string>;
  };
  filters: {
    location: string | null;
    status: 'active' | 'inactive' | null;
    recurrence: string | null;
    type: string | null;
  };
  onFilterChange: (filterType: 'location' | 'status' | 'recurrence' | 'type', value: string | null) => void;
  onClearAll: () => void;
};

const MobileFilterModal = ({
  isOpen,
  onClose,
  filterOptions,
  filters,
  onFilterChange,
  onClearAll,
}: MobileFilterModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatValue = (value: string, type: string): string => {
    if (type === 'status' || type === 'recurrence') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (type === 'type') {
      return value.toUpperCase().replace(/_/g, ' ');
    }
    return value;
  };

  const getOptionLabel = (option: { id: string; name?: string } | string, type: string): string => {
    if (typeof option === 'string') {
      return formatValue(option, type);
    }
    return option.name || option.id;
  };

  const getOptionValue = (option: { id: string; name?: string } | string): string => {
    if (typeof option === 'string') {
      return option;
    }
    return option.id;
  };

  const activeFilterCount = [filters.location, filters.status, filters.recurrence, filters.type].filter(Boolean).length;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
      <div ref={modalRef} className="admin-mobile-filter-modal">
        <div className="admin-mobile-filter-header">
          <h3 id="mobile-filter-title">Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</h3>
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            aria-label={t('admin.filters.close')}
          >
            <Icon name="back" />
          </button>
        </div>
        <div className="admin-mobile-filter-content">
          {/* Location Filter */}
          <div className="admin-mobile-filter-section">
            <h4>Location</h4>
            <div className="admin-mobile-filter-options">
              <button
                type="button"
                className={`admin-mobile-filter-option ${!filters.location ? 'active' : ''}`}
                onClick={() => onFilterChange('location', null)}
              >
                All Locations
              </button>
              {filterOptions.locations.map((option) => {
                const value = getOptionValue(option);
                const label = getOptionLabel(option, 'location');
                return (
                  <button
                    key={value}
                    type="button"
                    className={`admin-mobile-filter-option ${filters.location === value ? 'active' : ''}`}
                    onClick={() => onFilterChange('location', filters.location === value ? null : value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="admin-mobile-filter-section">
            <h4>Status</h4>
            <div className="admin-mobile-filter-options">
              <button
                type="button"
                className={`admin-mobile-filter-option ${!filters.status ? 'active' : ''}`}
                onClick={() => onFilterChange('status', null)}
              >
                All Statuses
              </button>
              {filterOptions.statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`admin-mobile-filter-option ${filters.status === status ? 'active' : ''}`}
                  onClick={() => onFilterChange('status', filters.status === status ? null : status as 'active' | 'inactive')}
                >
                  {formatValue(status, 'status')}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence Filter */}
          <div className="admin-mobile-filter-section">
            <h4>Recurrence</h4>
            <div className="admin-mobile-filter-options">
              <button
                type="button"
                className={`admin-mobile-filter-option ${!filters.recurrence ? 'active' : ''}`}
                onClick={() => onFilterChange('recurrence', null)}
              >
                All Recurrences
              </button>
              {filterOptions.recurrences.map((recurrence) => (
                <button
                  key={recurrence}
                  type="button"
                  className={`admin-mobile-filter-option ${filters.recurrence === recurrence ? 'active' : ''}`}
                  onClick={() => onFilterChange('recurrence', filters.recurrence === recurrence ? null : recurrence)}
                >
                  {formatValue(recurrence, 'recurrence')}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="admin-mobile-filter-section">
            <h4>Type</h4>
            <div className="admin-mobile-filter-options">
              <button
                type="button"
                className={`admin-mobile-filter-option ${!filters.type ? 'active' : ''}`}
                onClick={() => onFilterChange('type', null)}
              >
                All Types
              </button>
              {filterOptions.types.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`admin-mobile-filter-option ${filters.type === type ? 'active' : ''}`}
                  onClick={() => onFilterChange('type', filters.type === type ? null : type)}
                >
                  {formatValue(type, 'type')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="admin-mobile-filter-footer">
          <button
            type="button"
            className="admin-action-button secondary"
            onClick={onClearAll}
            disabled={activeFilterCount === 0}
          >
            Clear All
          </button>
          <button
            type="button"
            className="admin-action-button"
            onClick={onClose}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

const ICONS: Record<
  'logout' | 'refresh' | 'back' | 'filter',
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
  filter: {
    viewBox: '0 0 24 24',
    paths: [
      'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    ],
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

const defaultTaskForm = (type: 'video' | 'quiz' | 'article_quiz' | 'qr' | 'photo' | 'visit_location'): TaskFormState => ({
  title: '',
  description: '',
  type,
  points: 0,
  video_url: '',
  videoSource: 'url',
  videoFile: null,
  quizQuestions: (type === 'video' || type === 'quiz' || type === 'article_quiz') ? [createEmptyQuestion(1)] : [],
  qr_code: type === 'qr' ? '' : '',
  photo_required: type === 'photo',
  co2_savings_kg: 0,
  allowedRoles: [],
  allowedUserTypes: [],
  allowedHotelIds: [],
  locationId: '',
  active: true,
  recurrence: 'once',
  article_url: type === 'article_quiz' ? '' : '',
  article_content: type === 'article_quiz' ? '' : '',
  articleSource: 'url',
  target_latitude: type === 'visit_location' ? '' : undefined,
  target_longitude: type === 'visit_location' ? '' : undefined,
  target_address: type === 'visit_location' ? '' : undefined,
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
  locationId: '',
  active: true,
  recurrence: 'once',
});

const defaultLocationForm = (): LocationFormState => ({
  name: '',
  description: '',
  mode: 'online',
  address: '',
  latitude: '',
  longitude: '',
  active: true,
});

const isDefaultLocationRecord = (location: AdminLocation): boolean =>
  location.is_online &&
  (!location.address || location.address.trim() === '') &&
  location.name.toLowerCase() === 'online';

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

  if (taskForm.type === 'quiz') {
    try {
      buildQuizPayload(taskForm.quizQuestions);
    } catch (error: any) {
      return {
        isValid: false,
        message: error?.message ?? 'Check the quiz questions for missing details.',
      };
    }
  }

  if (taskForm.type === 'article_quiz') {
    if (taskForm.articleSource === 'url') {
      if (!taskForm.article_url.trim()) {
        return { isValid: false, message: 'Article URL is required for article quiz tasks.' };
      }
    } else {
      if (!taskForm.article_content.trim()) {
        return { isValid: false, message: 'Article content is required for article quiz tasks.' };
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

  if (taskForm.type === 'visit_location') {
    if (!taskForm.target_latitude || !taskForm.target_longitude) {
      return { isValid: false, message: 'Target location coordinates are required for visit location tasks.' };
    }
    const lat = parseFloat(taskForm.target_latitude);
    const lng = parseFloat(taskForm.target_longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { isValid: false, message: 'Invalid target location coordinates.' };
    }
  }

  if (!taskForm.locationId) {
    return { isValid: false, message: 'Select a location for this task.' };
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

  if (!rewardForm.locationId) {
    return { isValid: false, message: 'Select a location for this reward.' };
  }

  return { isValid: true, message: null };
};

const validateLocationFormState = (form: LocationFormState): ValidationResult => {
  if (!form.name.trim()) {
    return { isValid: false, message: 'Location name is required.' };
  }

  if (!form.description.trim()) {
    return { isValid: false, message: 'Description is required.' };
  }

  if (form.mode === 'physical') {
    if (!form.address.trim()) {
      return { isValid: false, message: 'Address is required for physical locations.' };
    }
    if (!form.latitude.trim()) {
      return { isValid: false, message: 'Latitude is required for physical locations.' };
    }
    if (!form.longitude.trim()) {
      return { isValid: false, message: 'Longitude is required for physical locations.' };
    }
    const lat = Number.parseFloat(form.latitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return { isValid: false, message: 'Latitude must be between -90 and 90.' };
    }
    const lon = Number.parseFloat(form.longitude);
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      return { isValid: false, message: 'Longitude must be between -180 and 180.' };
    }
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

const FieldLabel = ({ label, required, readOnly }: FieldLabelProps) => {
  const { t } = useTranslation();
  return (
    <span className="admin-field-label">
      <span>{label}</span>
      {required && (
        <span className="admin-field-required" aria-hidden="true" title={t('admin.fields.required')}>
          *
        </span>
      )}
      {readOnly && <span className="admin-field-readonly">{t('admin.fields.readOnly')}</span>}
    </span>
  );
};

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
  const { t } = useTranslation();

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
        <p className="admin-quiz-empty">{t('admin.task.quiz.empty')}</p>
        <button type="button" className="admin-quiz-add-question" onClick={addQuestion}>
          Add question
        </button>
      </div>
    );
  }

  return (
    <div className="admin-quiz-builder">
      <div className="admin-quiz-header">
        <h3>{t('admin.task.quiz.title')}</h3>
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
                <span>{t('admin.task.quiz.questionText')}</span>
                <input
                  type="text"
                  value={question.prompt}
                  onChange={(event) => handlePromptChange(question.id, event.target.value)}
                  placeholder={t('admin.task.quiz.questionPlaceholder')}
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
                      <span>{t('admin.task.quiz.correct')}</span>
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
  const { t } = useTranslation();
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
            {t('common.actions.cancel')}
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
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const showToast = useToastStore((s) => s.showToast);
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
  const [taskFilterLocation, setTaskFilterLocation] = useState<string | null>(null);
  const [taskFilterStatus, setTaskFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [taskFilterRecurrence, setTaskFilterRecurrence] = useState<string | null>(null);
  const [taskFilterType, setTaskFilterType] = useState<string | null>(null);
  const [taskFilterDropdown, setTaskFilterDropdown] = useState<'location' | 'status' | 'recurrence' | 'type' | null>(null);
  const [taskFilterDropdownPosition, setTaskFilterDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const taskFilterDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileTaskFilterOpen, setIsMobileTaskFilterOpen] = useState(false);

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
  const [rewardFilterLocation, setRewardFilterLocation] = useState<string | null>(null);
  const [rewardFilterStatus, setRewardFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [rewardFilterRecurrence, setRewardFilterRecurrence] = useState<string | null>(null);
  const [rewardFilterType, setRewardFilterType] = useState<string | null>(null);
  const [rewardFilterDropdown, setRewardFilterDropdown] = useState<'location' | 'status' | 'recurrence' | 'type' | null>(null);
  const [rewardFilterDropdownPosition, setRewardFilterDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const rewardFilterDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileRewardFilterOpen, setIsMobileRewardFilterOpen] = useState(false);

  const [locationForm, setLocationForm] = useState<LocationFormState>(defaultLocationForm);
  const [locationMessage, setLocationMessage] = useState<
    { type: 'error' | 'success'; text: string } | null
  >(null);
  const [hasAttemptedLocationSubmit, setHasAttemptedLocationSubmit] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationManagementMessage, setLocationManagementMessage] = useState<
    { type: 'error' | 'success'; text: string } | null
  >(null);
  const [locationConfirm, setLocationConfirm] = useState<ConfirmDialogState>(defaultConfirmDialogState);

  // Forest debug stats (admin-only)
  const [forestStats, setForestStats] = useState<
    Array<{
      id: string;
      email: string;
      points: number;
      tree_count: number;
      completed_tasks: number;
      is_count_consistent: boolean;
    }>
  >([]);
  const [forestStatsLoading, setForestStatsLoading] = useState(false);
  const [forestStatsError, setForestStatsError] = useState<string | null>(null);

  // Forest validation
  const [validationDryRun, setValidationDryRun] = useState(true);
  const [validationForceGeometry, setValidationForceGeometry] = useState(false);
  const [validationUserFilter, setValidationUserFilter] = useState('');
  const [validationJobId, setValidationJobId] = useState<string | null>(null);
  const [validationJobStatus, setValidationJobStatus] = useState<any>(null);
  const [validationConfirm, setValidationConfirm] = useState<ConfirmDialogState>(defaultConfirmDialogState);

  const loadForestStats = async () => {
    try {
      setForestStatsLoading(true);
      setForestStatsError(null);
      const data = await api.getForestStats();
      setForestStats(data || []);
    } catch (error: any) {
      console.error('Failed to load forest stats', error);
      setForestStatsError('Failed to load forest stats.');
    } finally {
      setForestStatsLoading(false);
    }
  };

  // Poll validation job status
  useEffect(() => {
    if (!validationJobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await api.getValidationJobStatus(validationJobId);
        setValidationJobStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
          // Refresh forest stats after completion
          if (status.status === 'completed') {
            await loadForestStats();
          }
        }
      } catch (error: any) {
        console.error('Failed to poll validation job status', error);
        clearInterval(pollInterval);
        setValidationJobStatus(null);
        setValidationJobId(null);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }, [validationJobId]);

  const startValidation = async () => {
    try {
      const result = await api.validateAndFixForest({
        dryRun: validationDryRun,
        forceGeometry: validationForceGeometry,
        userFilter: validationUserFilter || undefined,
      });
      setValidationJobId(result.jobId);
      setValidationJobStatus({ status: 'pending', progress: { currentUser: 0, totalUsers: 0 } });
      setValidationConfirm({ ...defaultConfirmDialogState });
    } catch (error: any) {
      console.error('Failed to start validation', error);
      setValidationConfirm({
        ...defaultConfirmDialogState,
        visible: true,
        title: t('admin.forestStats.validation.error'),
        description: error?.message || t('admin.forestStats.validation.startFailed'),
        confirmLabel: t('common.actions.close'),
        onConfirm: () => setValidationConfirm(defaultConfirmDialogState),
      });
    }
  };

  const handleValidationConfirm = () => {
    setValidationConfirm({
      ...defaultConfirmDialogState,
      visible: true,
      title: validationDryRun
        ? t('admin.forestStats.validation.confirmDryRun.title')
        : t('admin.forestStats.validation.confirmLive.title'),
      description: validationDryRun
        ? t('admin.forestStats.validation.confirmDryRun.description')
        : t('admin.forestStats.validation.confirmLive.description'),
      confirmLabel: t('admin.forestStats.validation.run'),
      onConfirm: () => {
        void startValidation();
      },
    });
  };
  const [locationReturnMode, setLocationReturnMode] = useState<AdminMode | null>(null);
  const [includeInactiveLocations, setIncludeInactiveLocations] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

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
      location_id: (task as any).location_id ?? (task as any).location?.id ?? null,
      location: (task as any).location ?? null,
      active: task.active ?? true,
      recurrence: ((task as any).recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
    }));
  }, [adminTasks]);

  const filteredTasks = useMemo(() => {
    let filtered = existingTemplates;
    
    if (taskFilterLocation) {
      filtered = filtered.filter((task) => task.location?.id === taskFilterLocation);
    }
    
    if (taskFilterStatus) {
      filtered = filtered.filter((task) => 
        taskFilterStatus === 'active' ? task.active : !task.active
      );
    }
    
    if (taskFilterRecurrence) {
      filtered = filtered.filter((task) => 
        ((task as any).recurrence || 'once') === taskFilterRecurrence
      );
    }
    
    if (taskFilterType) {
      filtered = filtered.filter((task) => task.type === taskFilterType);
    }
    
    return filtered;
  }, [existingTemplates, taskFilterLocation, taskFilterStatus, taskFilterRecurrence, taskFilterType]);

  const taskFilterOptions = useMemo(() => {
    const locations = new Map<string, string>();
    const statuses = new Set<'active' | 'inactive'>();
    const recurrences = new Set<string>();
    const types = new Set<string>();
    
    existingTemplates.forEach((task) => {
      if (task.location?.id && task.location?.name) {
        locations.set(task.location.id, task.location.name);
      }
      if (task.active) {
        statuses.add('active');
      } else {
        statuses.add('inactive');
      }
      recurrences.add((task as any).recurrence || 'once');
      types.add(task.type);
    });
    
    return {
      locations: Array.from(locations.entries()).map(([id, name]) => ({ id, name })),
      statuses: Array.from(statuses),
      recurrences: Array.from(recurrences),
      types: Array.from(types),
    };
  }, [existingTemplates]);

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
      location_id: template.location_id ?? template.location?.id ?? null,
      location: template.location ?? null,
      active: template.active ?? true,
      recurrence: ((template as any).recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
    }));
  }, [rewardTemplates]);

  const filteredRewards = useMemo(() => {
    let filtered = normalizedRewardTemplates;
    
    if (rewardFilterLocation) {
      filtered = filtered.filter((reward) => reward.location?.id === rewardFilterLocation);
    }
    
    if (rewardFilterStatus) {
      filtered = filtered.filter((reward) => 
        rewardFilterStatus === 'active' ? reward.active : !reward.active
      );
    }
    
    if (rewardFilterRecurrence) {
      filtered = filtered.filter((reward) => 
        ((reward as any).recurrence || 'once') === rewardFilterRecurrence
      );
    }
    
    if (rewardFilterType) {
      filtered = filtered.filter((reward) => reward.reward_type === rewardFilterType);
    }
    
    return filtered;
  }, [normalizedRewardTemplates, rewardFilterLocation, rewardFilterStatus, rewardFilterRecurrence, rewardFilterType]);

  const rewardFilterOptions = useMemo(() => {
    const locations = new Map<string, string>();
    const statuses = new Set<'active' | 'inactive'>();
    const recurrences = new Set<string>();
    const types = new Set<string>();
    
    normalizedRewardTemplates.forEach((reward) => {
      if (reward.location?.id && reward.location?.name) {
        locations.set(reward.location.id, reward.location.name);
      }
      if (reward.active) {
        statuses.add('active');
      } else {
        statuses.add('inactive');
      }
      recurrences.add((reward as any).recurrence || 'once');
      types.add(reward.reward_type);
    });
    
    return {
      locations: Array.from(locations.entries()).map(([id, name]) => ({ id, name })),
      statuses: Array.from(statuses),
      recurrences: Array.from(recurrences),
      types: Array.from(types),
    };
  }, [normalizedRewardTemplates]);

  const {
    data: locationsData,
    isLoading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useQuery<AdminLocation[]>(
    ['adminLocations', includeInactiveLocations],
    () => api.getLocations({ includeInactive: includeInactiveLocations }),
    {
      enabled: isAdmin && mode !== null,
    }
  );

  const locationsList = locationsData ?? [];
  const locationOptions = useMemo(
    () =>
      locationsList.map((location) => ({
        value: location.id,
        label: `${location.name}${location.is_online ? ' (Online)' : ''}${
          location.active ? '' : ' (Inactive)'
        }`,
        details: location.is_online ? 'Online location' : location.address || 'Physical location',
        location,
      })),
    [locationsList]
  );
  const selectableLocationIds = useMemo(
    () =>
      locationsList
        .filter((location) => !isDefaultLocationRecord(location))
        .map((location) => location.id),
    [locationsList]
  );
  const taskLocationSelectOptions = useMemo(
    () =>
      locationOptions.filter(
        (option) => option.location?.active || option.value === taskForm.locationId
      ),
    [locationOptions, taskForm.locationId]
  );
  const rewardLocationSelectOptions = useMemo(
    () =>
      locationOptions.filter(
        (option) => option.location?.active || option.value === rewardForm.locationId
      ),
    [locationOptions, rewardForm.locationId]
  );
  const hasTaskLocationOptions = taskLocationSelectOptions.length > 0;
  const hasRewardLocationOptions = rewardLocationSelectOptions.length > 0;
  const hasLocationSelection = selectedLocationIds.length > 0;
  const allLocationsSelected =
    selectableLocationIds.length > 0 &&
    selectedLocationIds.length === selectableLocationIds.length;

  const rewardValidation = useMemo(
    () => validateRewardFormState({ rewardSource, selectedRewardTemplate, rewardForm, isEditing: isEditingReward }),
    [rewardSource, selectedRewardTemplate, rewardForm, isEditingReward]
  );

  const locationValidation = useMemo(
    () => validateLocationFormState(locationForm),
    [locationForm]
  );

  const publishTaskMutation = useMutation((payload: any) => api.createCustomTask(payload), {
    onSuccess: () => {
      setTaskMessage({ type: 'success', text: 'Task published successfully.' });
      showToast({
        type: 'success',
        title: t('admin.toasts.taskCreatedTitle'),
        message: t('admin.toasts.taskCreatedMessage'),
      });
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
      showToast({
        type: 'success',
        title: t('admin.toasts.rewardCreatedTitle'),
        message: t('admin.toasts.rewardCreatedMessage'),
      });
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

  const createLocationMutation = useMutation((payload: any) => api.createLocation(payload), {
    onSuccess: () => {
      setLocationMessage({ type: 'success', text: 'Location created successfully.' });
      setLocationForm(defaultLocationForm());
      setHasAttemptedLocationSubmit(false);
      void refetchLocations();
    },
    onError: (error: any) => {
      setLocationMessage({ type: 'error', text: error?.message || 'Failed to create location.' });
    },
  });

  const updateLocationMutation = useMutation(
    ({ id, payload }: { id: string; payload: any }) => api.updateLocation(id, payload),
    {
      onSuccess: () => {
        setLocationMessage({ type: 'success', text: 'Location updated successfully.' });
        setIsEditingLocation(false);
        setEditingLocationId(null);
        setHasAttemptedLocationSubmit(false);
        setLocationForm(defaultLocationForm());
        void refetchLocations();
      },
      onError: (error: any) => {
        setLocationMessage({ type: 'error', text: error?.message || 'Failed to update location.' });
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
  const isLocationSubmitDisabled =
    createLocationMutation.isLoading ||
    updateLocationMutation.isLoading ||
    !locationValidation.isValid;

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
    } else if (taskSource === 'video' || taskSource === 'quiz' || taskSource === 'article_quiz' || taskSource === 'qr' || taskSource === 'photo' || taskSource === 'visit_location') {
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
      (template.type === 'video' || template.type === 'quiz' || template.type === 'article_quiz')
        ? normalizeQuizQuestions(template.quiz_questions ?? [])
        : [],
      qr_code: template.qr_code ?? '',
    photo_required: template.type === 'photo',
      co2_savings_kg: template.co2_savings_kg ?? 0,
      allowedRoles: normalizeEnumArray(template.allowed_roles),
      allowedUserTypes: normalizeEnumArray(template.allowed_user_types),
      allowedHotelIds: normalizeEnumArray(template.allowed_hotel_ids),
      locationId: template.location_id ?? template.location?.id ?? '',
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
      locationId: template.location_id ?? template.location?.id ?? '',
      active: template.active ?? true,
      recurrence: (template.recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
    });
  }, [rewardSource, selectedRewardTemplate, normalizedRewardTemplates, isEditingReward]);

  useEffect(() => {
    if (mode !== 'location') {
      return;
    }
    if (isEditingLocation) {
      return;
    }
    setLocationMessage(null);
    setHasAttemptedLocationSubmit(false);
    setLocationForm(defaultLocationForm());
  }, [mode, isEditingLocation]);

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
        if (taskType === 'quiz' || taskType === 'article_quiz') {
          const quizPayload = buildQuizPayload(taskForm.quizQuestions);
          return { videoUrl: undefined as string | undefined, quizPayload };
        }
        
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
          recurrence: taskForm.recurrence,
        };
        payload.location_id = taskForm.locationId;

        if (taskForm.type === 'video') {
          if (!videoUrl) {
            throw new Error('Video URL is required for video tasks.');
          }
          payload.video_url = videoUrl;
          payload.quiz_questions = quizPayload;
        }
        if (taskForm.type === 'quiz') {
          payload.quiz_questions = quizPayload;
        }
        if (taskForm.type === 'article_quiz') {
          if (taskForm.articleSource === 'url') {
            payload.article_url = taskForm.article_url.trim();
            payload.article_content = null;
          } else {
            payload.article_content = taskForm.article_content.trim();
            payload.article_url = null;
          }
          payload.quiz_questions = quizPayload;
        }
        if (taskForm.type === 'qr') {
          payload.qr_code = taskForm.qr_code.trim();
        }
        if (taskForm.type === 'photo') {
          payload.photo_required = true;
        }
        if (taskForm.type === 'visit_location') {
          payload.target_latitude = parseFloat(taskForm.target_latitude || '0');
          payload.target_longitude = parseFloat(taskForm.target_longitude || '0');
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
        payload.location_id = taskForm.locationId;

        if (template.type === 'video') {
          if (!videoUrl) {
            throw new Error('Video URL is required for video tasks.');
          }
          payload.video_url = videoUrl;
          payload.quiz_questions = quizPayload;
        }
        if (template.type === 'quiz') {
          payload.quiz_questions = quizPayload;
        }
        if (template.type === 'article_quiz') {
          if (taskForm.articleSource === 'url') {
            payload.article_url = taskForm.article_url.trim();
            payload.article_content = null;
          } else {
            payload.article_content = taskForm.article_content.trim();
            payload.article_url = null;
          }
          payload.quiz_questions = quizPayload;
        }
        if (template.type === 'qr') {
          payload.qr_code = taskForm.qr_code.trim();
        }
        if (template.type === 'photo') {
          payload.photo_required = true;
        }
        if (template.type === 'visit_location') {
          payload.target_latitude = parseFloat(taskForm.target_latitude || '0');
          payload.target_longitude = parseFloat(taskForm.target_longitude || '0');
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
        recurrence: taskForm.recurrence,
      };
      payload.location_id = taskForm.locationId;

      if (taskSource === 'video') {
        if (!videoUrl) {
          throw new Error('Video URL is required for video tasks.');
        }
        payload.video_url = videoUrl;
        payload.quiz_questions = quizPayload;
      }
      if (taskSource === 'quiz') {
        payload.quiz_questions = quizPayload;
      }
      if (taskSource === 'article_quiz') {
        if (taskForm.articleSource === 'url') {
          payload.article_url = taskForm.article_url.trim();
          payload.article_content = null;
        } else {
          payload.article_content = taskForm.article_content.trim();
          payload.article_url = null;
        }
        payload.quiz_questions = quizPayload;
      }
      if (taskSource === 'qr') {
        payload.qr_code = taskForm.qr_code.trim();
      }
      if (taskSource === 'photo') {
        payload.photo_required = true;
      }
      if (taskSource === 'visit_location') {
        payload.target_latitude = parseFloat(taskForm.target_latitude || '0');
        payload.target_longitude = parseFloat(taskForm.target_longitude || '0');
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
        recurrence: rewardForm.recurrence,
      };
      basePayload.location_id = rewardForm.locationId;

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

  const handleLocationSubmit = async () => {
    try {
      setLocationMessage(null);
      setHasAttemptedLocationSubmit(true);

      if (!locationValidation.isValid) {
        setLocationMessage({
          type: 'error',
          text: locationValidation.message ?? 'Please complete the required fields.',
        });
        return;
      }

      const payload: any = {
        name: locationForm.name.trim(),
        description: locationForm.description.trim(),
        mode: locationForm.mode,
        active: Boolean(locationForm.active),
      };

      if (locationForm.mode === 'physical') {
        payload.address = locationForm.address.trim();
        payload.latitude = Number.parseFloat(locationForm.latitude);
        payload.longitude = Number.parseFloat(locationForm.longitude);
      }

      if (isEditingLocation && editingLocationId) {
        await updateLocationMutation.mutateAsync({ id: editingLocationId, payload });
      } else {
        await createLocationMutation.mutateAsync(payload);
        if (locationReturnMode) {
          setMode(locationReturnMode);
          setLocationReturnMode(null);
        }
      }
    } catch (error: any) {
      setLocationMessage({
        type: 'error',
        text: error?.message || 'Failed to save location.',
      });
    }
  };

  // Track previous template/location IDs to avoid infinite loops
  const prevTaskTemplateIdsRef = useRef<string>('');
  const prevRewardTemplateIdsRef = useRef<string>('');
  const prevLocationIdsRef = useRef<string>('');

  // Store latest arrays in refs to avoid dependency issues
  const existingTemplatesRef = useRef(existingTemplates);
  const normalizedRewardTemplatesRef = useRef(normalizedRewardTemplates);
  const locationsListRef = useRef(locationsList);

  useEffect(() => {
    existingTemplatesRef.current = existingTemplates;
  }, [existingTemplates]);

  useEffect(() => {
    normalizedRewardTemplatesRef.current = normalizedRewardTemplates;
  }, [normalizedRewardTemplates]);

  useEffect(() => {
    locationsListRef.current = locationsList;
  }, [locationsList]);

  // Create stable ID strings for dependency tracking
  const taskTemplateIdsKey = useMemo(() => existingTemplates.map((t) => t.id).sort().join(','), [existingTemplates]);
  const rewardTemplateIdsKey = useMemo(() => normalizedRewardTemplates.map((r) => r.id).sort().join(','), [normalizedRewardTemplates]);
  const locationIdsKey = useMemo(() => locationsList.map((l) => l.id).sort().join(','), [locationsList]);

  useEffect(() => {
    if (prevTaskTemplateIdsRef.current === taskTemplateIdsKey) {
      return; // No change in template IDs
    }
    prevTaskTemplateIdsRef.current = taskTemplateIdsKey;

    setSelectedTaskIds((prev) => {
      const validIds = new Set(existingTemplatesRef.current.map((task) => task.id));
      const filtered = prev.filter((id) => validIds.has(id));
      // Only update if changed
      if (filtered.length !== prev.length || !filtered.every((id, idx) => prev[idx] === id)) {
        return filtered;
      }
      return prev;
    });
  }, [taskTemplateIdsKey]);

  useEffect(() => {
    if (prevRewardTemplateIdsRef.current === rewardTemplateIdsKey) {
      return; // No change in template IDs
    }
    prevRewardTemplateIdsRef.current = rewardTemplateIdsKey;

    setSelectedRewardIds((prev) => {
      const validIds = new Set(normalizedRewardTemplatesRef.current.map((reward) => reward.id));
      const filtered = prev.filter((id) => validIds.has(id));
      // Only update if changed
      if (filtered.length !== prev.length || !filtered.every((id, idx) => prev[idx] === id)) {
        return filtered;
      }
      return prev;
    });
  }, [rewardTemplateIdsKey]);

  useEffect(() => {
    if (prevLocationIdsRef.current === locationIdsKey) {
      return; // No change in location IDs
    }
    prevLocationIdsRef.current = locationIdsKey;

    setSelectedLocationIds((prev) => {
      const validIds = new Set(locationsListRef.current.map((location) => location.id));
      const filtered = prev.filter((id) => validIds.has(id));
      // Only update if changed
      if (filtered.length !== prev.length || !filtered.every((id, idx) => prev[idx] === id)) {
        return filtered;
      }
      return prev;
    });
  }, [locationIdsKey]);

  useEffect(() => {
    if (
      taskForm.locationId &&
      !locationsList.some((location) => location.id === taskForm.locationId)
    ) {
      setTaskForm((prev) => ({ ...prev, locationId: '' }));
    }
    if (
      rewardForm.locationId &&
      !locationsList.some((location) => location.id === rewardForm.locationId)
    ) {
      setRewardForm((prev) => ({ ...prev, locationId: '' }));
    }
  }, [locationsList, taskForm.locationId, rewardForm.locationId]);

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

  const toggleLocationSelection = (locationId: string, checked: boolean) => {
    setSelectedLocationIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(locationId);
      } else {
        next.delete(locationId);
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
        text: active ? t('admin.messages.selectedTasksActivated') : t('admin.messages.selectedTasksDeactivated'),
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
      title: t('admin.confirm.deleteSelectedTasks.title'),
      description: t('admin.confirm.deleteSelectedTasks.description'),
      confirmLabel: t('admin.confirm.deleteTasks'),
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setTaskManagementMessage(null);
          await api.bulkDeleteTasks(selectedTaskIds);
          setTaskManagementMessage({
            type: 'success',
            text: t('admin.messages.selectedTasksDeleted'),
          });
          setSelectedTaskIds([]);
          void refetchTasks();
        } catch (error: any) {
          setTaskManagementMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteTasks'),
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
        text: active ? t('admin.messages.taskActivated') : t('admin.messages.taskDeactivated'),
      });
      void refetchTasks();
    } catch (error: any) {
      setTaskManagementMessage({
        type: 'error',
        text: error?.message || t('admin.messages.failedToUpdateTask'),
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    setTaskConfirm({
      visible: true,
      title: t('admin.confirm.deleteTaskSingle.title'),
      description: t('admin.confirm.deleteTaskSingle.description'),
      confirmLabel: t('admin.confirm.deleteTask'),
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
            text: error?.message || t('admin.messages.failedToDeleteTask'),
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
        text: active ? t('admin.messages.selectedRewardsActivated') : t('admin.messages.selectedRewardsDeactivated'),
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
      title: t('admin.confirm.deleteSelectedRewards.title'),
      description: t('admin.confirm.deleteSelectedRewards.description'),
      confirmLabel: t('admin.confirm.deleteRewards'),
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setRewardManagementMessage(null);
          await api.bulkDeleteRewards(selectedRewardIds);
          setRewardManagementMessage({
            type: 'success',
            text: t('admin.messages.selectedRewardsDeleted'),
          });
          setSelectedRewardIds([]);
          void refetchRewardTemplates();
        } catch (error: any) {
          setRewardManagementMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteRewards'),
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
        text: active ? t('admin.messages.rewardActivated') : t('admin.messages.rewardDeactivated'),
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
      title: t('admin.confirm.deleteRewardSingle.title'),
      description: t('admin.confirm.deleteRewardSingle.description'),
      confirmLabel: t('admin.confirm.deleteReward'),
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
            text: error?.message || t('admin.messages.failedToDeleteReward'),
          });
        } finally {
          setRewardConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  const handleLocationStatusChange = async (locationId: string, active: boolean) => {
    try {
      setLocationManagementMessage(null);
      await api.bulkUpdateLocationsStatus([locationId], active);
      setLocationManagementMessage({
        type: 'success',
        text: active ? t('admin.messages.locationActivated') : t('admin.messages.locationDeactivated'),
      });
      void refetchLocations();
    } catch (error: any) {
      setLocationManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update location.',
      });
    }
  };

  const handleLocationBulkStatus = async (active: boolean) => {
    if (!selectedLocationIds.length) return;
    try {
      setLocationManagementMessage(null);
      await api.bulkUpdateLocationsStatus(selectedLocationIds, active);
      setLocationManagementMessage({
        type: 'success',
        text: active ? t('admin.messages.selectedLocationsActivated') : t('admin.messages.selectedLocationsDeactivated'),
      });
      setSelectedLocationIds([]);
      void refetchLocations();
    } catch (error: any) {
      setLocationManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update selected locations.',
      });
    }
  };

  const handleLocationBulkDelete = () => {
    if (!selectedLocationIds.length) return;
    setLocationConfirm({
      visible: true,
      title: t('admin.confirm.deleteSelectedLocations.title'),
      description: t('admin.confirm.deleteSelectedLocations.description'),
      confirmLabel: t('admin.confirm.deleteLocations'),
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setLocationManagementMessage(null);
          await api.bulkDeleteLocations(selectedLocationIds);
          setLocationManagementMessage({
            type: 'success',
            text: t('admin.messages.selectedLocationsDeleted'),
          });
          setSelectedLocationIds([]);
          void refetchLocations();
        } catch (error: any) {
          setLocationManagementMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteLocations'),
          });
        } finally {
          setLocationConfirm(defaultConfirmDialogState);
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
      task.type === 'video' ? 'video' 
      : task.type === 'quiz' ? 'quiz'
      : task.type === 'article_quiz' ? 'article_quiz'
      : task.type === 'qr' ? 'qr' 
      : task.type === 'photo' ? 'photo'
      : task.type === 'visit_location' ? 'visit_location'
      : '';
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
        (task.type === 'video' || task.type === 'quiz' || task.type === 'article_quiz') ? normalizeQuizQuestions(task.quiz_questions ?? []) : [],
      article_url: (task as any).article_url ?? '',
      article_content: (task as any).article_content ?? '',
      articleSource: (task as any).article_url ? 'url' : 'content',
      qr_code: task.qr_code ?? '',
      photo_required: task.type === 'photo',
      co2_savings_kg: task.co2_savings_kg ?? 0,
      target_latitude: task.target_latitude ? String(task.target_latitude) : '',
      target_longitude: task.target_longitude ? String(task.target_longitude) : '',
      target_address: '',
      allowedRoles: normalizeEnumArray(task.allowed_roles),
      allowedUserTypes: normalizeEnumArray(task.allowed_user_types),
      allowedHotelIds: normalizeEnumArray(task.allowed_hotel_ids),
      locationId: task.location_id ?? task.location?.id ?? '',
      active: task.active ?? true,
      recurrence: ((task as any).recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
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
      locationId: template.location_id ?? template.location?.id ?? '',
      active: template.active ?? true,
      recurrence: (template.recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
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

  const startLocationEdit = (location: AdminLocation) => {
    setLocationReturnMode(mode === 'locationManage' ? 'locationManage' : null);
    setMode('location');
    setLocationManagementMessage(null);
    setLocationMessage(null);
    setLocationForm({
      name: location.name ?? '',
      description: location.description ?? '',
      mode: location.is_online ? 'online' : 'physical',
      address: location.address ?? '',
      latitude:
        location.latitude !== null && location.latitude !== undefined
          ? String(location.latitude)
          : '',
      longitude:
        location.longitude !== null && location.longitude !== undefined
          ? String(location.longitude)
          : '',
      active: location.active ?? true,
    });
    setIsEditingLocation(true);
    setEditingLocationId(location.id);
    setHasAttemptedLocationSubmit(false);
  };

  const cancelLocationEdit = () => {
    setIsEditingLocation(false);
    setEditingLocationId(null);
    setLocationForm(defaultLocationForm());
    setLocationMessage(null);
    setHasAttemptedLocationSubmit(false);
    if (locationReturnMode) {
      setMode(locationReturnMode);
    } else {
      setMode(null);
    }
    setLocationReturnMode(null);
  };

  const goToLocationCreation = () => {
    setLocationReturnMode(mode);
    setLocationMessage(null);
    setLocationForm(defaultLocationForm());
    setIsEditingLocation(false);
    setEditingLocationId(null);
    setMode('location');
  };

const goToTaskCreation = () => {
  setTaskReturnMode('taskManage');
  setMode('task');
  setTaskManagementMessage(null);
  setTaskMessage(null);
  setIsEditingTask(false);
  setEditingTaskId(null);
  setTaskSource('');
  setSelectedExistingTaskId('');
  setTaskForm(defaultTaskForm('video'));
  setHasAttemptedPublish(false);
};

const goToRewardCreation = () => {
  setRewardReturnMode('rewardManage');
  setMode('reward');
  setRewardManagementMessage(null);
  setRewardMessage(null);
  setIsEditingReward(false);
  setEditingRewardId(null);
  setRewardSource('');
  setSelectedRewardTemplate('');
  setRewardForm(defaultRewardForm('discount'));
  setHasAttemptedRewardPublish(false);
};

  const handleLocationDelete = (location: AdminLocation) => {
    const isDefaultLocation =
      location.is_online &&
      (!location.address || location.address.trim() === '') &&
      location.name.toLowerCase() === 'online';
    if (isDefaultLocation) {
      setLocationManagementMessage({
        type: 'error',
        text: 'The default online location cannot be deleted.',
      });
      return;
    }
    setLocationConfirm({
      visible: true,
      title: t('admin.confirm.deleteLocationWithName.title', { name: location.name }),
      description: t('admin.confirm.deleteLocationWithName.description'),
      confirmLabel: t('admin.confirm.deleteLocation'),
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setLocationManagementMessage(null);
          await api.deleteLocation(location.id);
          setLocationManagementMessage({
            type: 'success',
            text: t('admin.messages.locationDeletedSuccessfully'),
          });
          if (isEditingLocation && editingLocationId === location.id) {
            cancelLocationEdit();
          }
          setSelectedLocationIds((prev) => prev.filter((id) => id !== location.id));
          void refetchLocations();
        } catch (error: any) {
          setLocationManagementMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteLocation'),
          });
        } finally {
          setLocationConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  const allTasksSelected =
    filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length;
  const allRewardsSelected =
    filteredRewards.length > 0 &&
    selectedRewardIds.length === filteredRewards.length;
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
        <h1 className="admin-title">{t('admin.title')}</h1>
        <p className="admin-info">{t('admin.requiresPrivileges')}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <nav className="admin-navbar">
          <div className="admin-navbar-space" aria-hidden="true" />
          <LanguageSwitcher compact className="admin-navbar-language" />
          <button className="admin-icon-button admin-navbar-action" onClick={logout} title={t('admin.logout')}>
            <Icon name="logout" />
            <span className="sr-only">{t('admin.logout')}</span>
          </button>
        </nav>

        <div className="admin-hero">
          <h1 className="admin-hero-title">{t('admin.home.title')}</h1>
          <p className="admin-hero-subtitle">{t('admin.home.subtitle')}</p>
        </div>
      </header>

      {mode === null && (
        <div className="admin-choice-grid">
          <button className="admin-choice-card" onClick={() => setMode('task')}>
            <span className="admin-choice-icon">✅</span>
            <h2>{t('admin.actions.createTask.title')}</h2>
            <p>{t('admin.actions.createTask.description')}</p>
          </button>
          <button className="admin-choice-card" onClick={() => setMode('reward')}>
            <span className="admin-choice-icon">🎁</span>
            <h2>{t('admin.actions.createReward.title')}</h2>
            <p>{t('admin.actions.createReward.description')}</p>
          </button>
          <button className="admin-choice-card" onClick={() => setMode('taskManage')}>
            <span className="admin-choice-icon">🗂️</span>
            <h2>{t('admin.actions.manageTasks.title')}</h2>
            <p>{t('admin.actions.manageTasks.description')}</p>
          </button>
          <button className="admin-choice-card" onClick={() => setMode('rewardManage')}>
            <span className="admin-choice-icon">🧾</span>
            <h2>{t('admin.actions.manageRewards.title')}</h2>
            <p>{t('admin.actions.manageRewards.description')}</p>
          </button>
          <button
            className="admin-choice-card"
            onClick={() => {
              setLocationReturnMode(null);
              setMode('location');
            }}
          >
            <span className="admin-choice-icon">📍</span>
            <h2>{t('admin.actions.createLocation.title')}</h2>
            <p>{t('admin.actions.createLocation.description')}</p>
          </button>
          <button className="admin-choice-card" onClick={() => setMode('locationManage')}>
            <span className="admin-choice-icon">🗺️</span>
            <h2>{t('admin.actions.manageLocations.title')}</h2>
            <p>{t('admin.actions.manageLocations.description')}</p>
          </button>
          <button className="admin-choice-card" onClick={() => setMode('qrScanner')}>
            <span className="admin-choice-icon">📷</span>
            <h2>{t('admin.actions.redeemRewards.title')}</h2>
            <p>{t('admin.actions.redeemRewards.description')}</p>
          </button>
          <button
            className="admin-choice-card"
            onClick={() => {
              void loadForestStats();
              setMode('forestStats');
            }}
          >
            <span className="admin-choice-icon">🌲</span>
            <h2>{t('admin.actions.forestDebugStats.title')}</h2>
            <p>{t('admin.actions.forestDebugStats.description')}</p>
          </button>
        </div>
      )}

      {mode === 'forestStats' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{t('admin.forestStats.title')}</h2>
              <p>{t('admin.forestStats.subtitle')}</p>
            </div>
            <div className="admin-actions">
              <button
                className="admin-icon-button"
                onClick={() => void loadForestStats()}
                title={t('admin.forestStats.refresh')}
                disabled={forestStatsLoading}
              >
                <Icon name="refresh" />
                <span className="sr-only">{t('admin.forestStats.refresh')}</span>
              </button>
              <button
                className="admin-icon-button"
                onClick={() => setMode(null)}
                title={t('admin.forestStats.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{t('admin.forestStats.back')}</span>
              </button>
            </div>
          </header>

          {forestStatsLoading && <p>{t('admin.forestStats.loading')}</p>}
          {forestStatsError && <p className="admin-error">{forestStatsError}</p>}
          {!forestStatsLoading && !forestStatsError && forestStats.length === 0 && (
            <p className="admin-field-note">{t('admin.forestStats.noUsers')}</p>
          )}
          {!forestStatsLoading && !forestStatsError && forestStats.length > 0 && (
            <div className="admin-form-card">
              <div className="admin-form-section-header">
                <div>
                  <h3>{t('admin.forestStats.table.title')}</h3>
                  <p className="admin-field-note">{t('admin.forestStats.table.subtitle')}</p>
                </div>
              </div>
              <div className="admin-table-wrapper" style={{ marginTop: '0.75rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('admin.forestStats.table.email')}</th>
                      <th>{t('admin.forestStats.table.points')}</th>
                      <th>{t('admin.forestStats.table.trees')}</th>
                      <th>{t('admin.forestStats.table.completedTasks')}</th>
                      <th>{t('admin.forestStats.table.consistent')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forestStats.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{row.email || '(no email)'}</span>
                            <span className="admin-field-note" style={{ fontSize: '0.75rem' }}>
                              {row.id}
                            </span>
                          </div>
                        </td>
                        <td>{row.points}</td>
                        <td>{row.tree_count}</td>
                        <td>{row.completed_tasks}</td>
                        <td>
                          {row.is_count_consistent ? (
                            <span style={{ color: '#15803d', fontWeight: 500 }}>Yes</span>
                          ) : (
                            <span style={{ color: '#b91c1c', fontWeight: 500 }}>No (check user)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Forest Validation Section */}
          <div className="admin-form-card" style={{ marginTop: '1.5rem' }}>
            <div className="admin-form-section-header">
              <div>
                <h3>{t('admin.forestStats.validation.title')}</h3>
                <p className="admin-field-note">{t('admin.forestStats.validation.subtitle')}</p>
              </div>
            </div>

            {validationJobId && validationJobStatus ? (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 500 }}>
                      {validationJobStatus.status === 'pending' && t('admin.forestStats.validation.status.pending')}
                      {validationJobStatus.status === 'running' && t('admin.forestStats.validation.status.running')}
                      {validationJobStatus.status === 'completed' && t('admin.forestStats.validation.status.completed')}
                      {validationJobStatus.status === 'failed' && t('admin.forestStats.validation.status.failed')}
                    </span>
                    {validationJobStatus.status === 'running' && (
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                        {validationJobStatus.progress.currentUser} / {validationJobStatus.progress.totalUsers}
                        {validationJobStatus.progress.currentUserEmail && ` (${validationJobStatus.progress.currentUserEmail})`}
                      </span>
                    )}
                  </div>
                  {validationJobStatus.status === 'running' && (
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--color-border)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${validationJobStatus.progress.totalUsers > 0 ? (validationJobStatus.progress.currentUser / validationJobStatus.progress.totalUsers) * 100 : 0}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-primary)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  )}
                </div>

                {validationJobStatus.status === 'completed' && validationJobStatus.result && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>
                      {t('admin.forestStats.validation.results.title')}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                          {t('admin.forestStats.validation.results.usersProcessed')}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {validationJobStatus.result.usersProcessed}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                          {t('admin.forestStats.validation.results.treesMoved')}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {validationJobStatus.result.totalMoved}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                          {t('admin.forestStats.validation.results.treesDeleted')}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {validationJobStatus.result.totalDeleted}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                          {t('admin.forestStats.validation.results.totalFixed')}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {validationJobStatus.result.totalFixed}
                        </div>
                      </div>
                    </div>
                    {validationJobStatus.result.errors && validationJobStatus.result.errors.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                          {t('admin.forestStats.validation.results.errors')}: {validationJobStatus.result.totalErrors}
                        </span>
                        <details style={{ marginTop: '0.5rem' }}>
                          <summary style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                            {t('admin.forestStats.validation.results.showErrors')}
                          </summary>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                            {validationJobStatus.result.errors.slice(0, 10).map((err: string, idx: number) => (
                              <li key={idx}>{err}</li>
                            ))}
                            {validationJobStatus.result.errors.length > 10 && (
                              <li>... and {validationJobStatus.result.errors.length - 10} more</li>
                            )}
                          </ul>
                        </details>
                      </div>
                    )}
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      style={{ marginTop: '1rem' }}
                      onClick={() => {
                        setValidationJobId(null);
                        setValidationJobStatus(null);
                      }}
                    >
                      {t('admin.forestStats.validation.closeResults')}
                    </button>
                  </div>
                )}

                {validationJobStatus.status === 'failed' && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                    <p className="admin-error">{validationJobStatus.error || t('admin.forestStats.validation.failed')}</p>
                    <button
                      type="button"
                      className="admin-button admin-button-secondary"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => {
                        setValidationJobId(null);
                        setValidationJobStatus(null);
                      }}
                    >
                      {t('common.actions.close')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="admin-form-section" style={{ marginTop: '1rem' }}>
                <div className="admin-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={validationDryRun}
                      onChange={(e) => setValidationDryRun(e.target.checked)}
                    />
                    <span>{t('admin.forestStats.validation.dryRun')}</span>
                  </label>
                  <p className="admin-field-note">{t('admin.forestStats.validation.dryRunHint')}</p>
                </div>

                <div className="admin-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={validationForceGeometry}
                      onChange={(e) => setValidationForceGeometry(e.target.checked)}
                    />
                    <span>{t('admin.forestStats.validation.forceGeometry')}</span>
                  </label>
                  <p className="admin-field-note">{t('admin.forestStats.validation.forceGeometryHint')}</p>
                </div>

                <div className="admin-field">
                  <label>
                    <span>{t('admin.forestStats.validation.userFilter')}</span>
                    <input
                      type="text"
                      value={validationUserFilter}
                      onChange={(e) => setValidationUserFilter(e.target.value)}
                      placeholder={t('admin.forestStats.validation.userFilterPlaceholder')}
                    />
                  </label>
                  <p className="admin-field-note">{t('admin.forestStats.validation.userFilterHint')}</p>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="admin-button admin-button-primary"
                    onClick={handleValidationConfirm}
                  >
                    {t('admin.forestStats.validation.run')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {mode === 'task' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{isEditingTask ? t('admin.task.edit.title') : t('admin.task.publish.title')}</h2>
              <p>
                {isEditingTask
                  ? t('admin.task.edit.subtitle')
                  : t('admin.task.publish.subtitle')}
              </p>
            </div>
            <div className="admin-actions">
              {!isEditingTask && (
                <button
                  className="admin-icon-button"
                  onClick={() => refetchTasks()}
                  title={t('admin.task.refresh')}
                >
                  <Icon name="refresh" />
                  <span className="sr-only">{t('admin.task.refresh')}</span>
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
                title={isEditingTask ? t('admin.task.cancelEditing') : t('admin.task.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{isEditingTask ? t('admin.task.cancelEditing') : t('admin.task.back')}</span>
              </button>
            </div>
          </header>

          {tasksLoading && <p>{t('admin.task.loading')}</p>}
          {Boolean(tasksError) && <p className="admin-error">{t('admin.task.loadError')}</p>}
          {Boolean(locationsError) && (
            <p className="admin-error">{t('admin.task.locationsError')}</p>
          )}

          <div className="admin-form-card">
            {!isEditingTask && (
              <label className="admin-field">
                <span>{t('admin.task.createFrom')}</span>
                <select
                  value={taskSource}
                  onChange={(event) => {
                    setTaskSource(event.target.value as TaskSource);
                  }}
                >
                  <option value="">{t('admin.task.selectOption')}</option>
                  <option value="existing">{t('admin.task.existingTask')}</option>
                  <option value="video">{t('admin.task.startFromScratch.video')}</option>
                  <option value="quiz">{t('admin.task.startFromScratch.quiz')}</option>
                  <option value="article_quiz">{t('admin.task.startFromScratch.articleQuiz')}</option>
                  <option value="qr">{t('admin.task.startFromScratch.qr')}</option>
                  <option value="photo">{t('admin.task.startFromScratch.photo')}</option>
                  <option value="visit_location">{t('admin.task.startFromScratch.visitLocation')}</option>
                </select>
              </label>
            )}

            {!isEditingTask && taskSource === 'existing' && (
              <label className="admin-field">
                <span>{t('admin.task.selectExisting')}</span>
                <select
                  value={selectedExistingTaskId}
                  onChange={(event) => setSelectedExistingTaskId(event.target.value)}
                >
                  <option value="">{t('admin.task.selectTask')}</option>
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
                      <h3>{t('admin.task.basics.title')}</h3>
                      <p>{t('admin.task.basics.subtitle')}</p>
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
                    <label className="admin-field">
                      <FieldLabel label="Location" required />
                      {locationsLoading ? (
                        <p className="admin-field-note">Loading locations…</p>
                      ) : hasTaskLocationOptions ? (
                        <select
                          value={taskForm.locationId}
                          onChange={(event) =>
                            setTaskForm((prev) => ({ ...prev, locationId: event.target.value }))
                          }
                        >
                          <option value="">Select location</option>
                          {taskLocationSelectOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="admin-field-note">
                          <p>{t('admin.task.noLocations')}</p>
                          <button type="button" className="link-button" onClick={goToLocationCreation}>
                            Create a location
                          </button>
                        </div>
                      )}
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
                          <FieldLabel label={t('admin.fields.videoSource')} required />
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
                            <FieldLabel label={t('admin.fields.videoFile')} required />
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
                        <FieldLabel label={t('admin.fields.photoRequirement')} readOnly />
                        <p className="admin-field-note">
                          A photo is always required for this task type.
                        </p>
                      </div>
                    )}
                    {taskForm.type === 'visit_location' && (
                      <div className="admin-form-full">
                        <FieldLabel label="Target Location (GPS Coordinates)" required />
                        <p className="admin-field-note" style={{ marginBottom: '12px' }}>
                          Set the GPS coordinates of the location users need to visit. Users will see a map and must be within 50 meters to complete the task.
                        </p>
                        <LocationMap
                          latitude={taskForm.target_latitude || ''}
                          longitude={taskForm.target_longitude || ''}
                          address={taskForm.target_address}
                          onLocationSelect={(lat, lng, address) => {
                            setTaskForm((prev) => ({
                              ...prev,
                              target_latitude: String(lat),
                              target_longitude: String(lng),
                              target_address: address || '',
                            }));
                          }}
                          height="300px"
                        />
                        <label className="admin-field" style={{ marginTop: '12px' }}>
                          <FieldLabel label="Address" />
                          <textarea
                            rows={3}
                            value={taskForm.target_address || ''}
                            onChange={(e) =>
                              setTaskForm((prev) => ({ ...prev, target_address: e.target.value }))
                            }
                            placeholder="Address will be auto-filled from map selection"
                          />
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                          <label className="admin-field">
                            <FieldLabel label="Latitude" required />
                            <input
                              type="number"
                              step="any"
                              value={taskForm.target_latitude || ''}
                              onChange={(e) =>
                                setTaskForm((prev) => ({ ...prev, target_latitude: e.target.value }))
                              }
                              placeholder="52.5200"
                              min="-90"
                              max="90"
                            />
                          </label>
                          <label className="admin-field">
                            <FieldLabel label="Longitude" required />
                            <input
                              type="number"
                              step="any"
                              value={taskForm.target_longitude || ''}
                              onChange={(e) =>
                                setTaskForm((prev) => ({ ...prev, target_longitude: e.target.value }))
                              }
                              placeholder="13.4050"
                              min="-180"
                              max="180"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                    {taskForm.type === 'article_quiz' && (
                      <>
                        <div className="admin-field admin-field-span-2">
                          <FieldLabel label="Article Source" required />
                          <div className="admin-video-source">
                            <label className="admin-video-option">
                              <input
                                type="radio"
                                className="admin-radio"
                                style={COMPACT_TOGGLE_STYLE}
                                name="article-source"
                                value="url"
                                checked={taskForm.articleSource === 'url'}
                                onChange={() =>
                                  setTaskForm((prev) => ({
                                    ...prev,
                                    articleSource: 'url',
                                    article_content: '',
                                  }))
                                }
                              />
                              <span>Use external article URL</span>
                            </label>
                            <label className="admin-video-option">
                              <input
                                type="radio"
                                className="admin-radio"
                                style={COMPACT_TOGGLE_STYLE}
                                name="article-source"
                                value="content"
                                checked={taskForm.articleSource === 'content'}
                                onChange={() =>
                                  setTaskForm((prev) => ({
                                    ...prev,
                                    articleSource: 'content',
                                    article_url: '',
                                  }))
                                }
                              />
                              <span>Enter article content</span>
                            </label>
                          </div>
                        </div>
                        {taskForm.articleSource === 'url' && (
                          <label className="admin-field admin-field-span-2">
                            <FieldLabel label="Article URL" required />
                            <input
                              type="url"
                              value={taskForm.article_url}
                              onChange={(event) =>
                                setTaskForm((prev) => ({ ...prev, article_url: event.target.value }))
                              }
                              placeholder="https://example.com/article"
                            />
                          </label>
                        )}
                        {taskForm.articleSource === 'content' && (
                          <label className="admin-field admin-field-span-2">
                            <FieldLabel label="Article Content" required />
                            <textarea
                              value={taskForm.article_content}
                              onChange={(event) =>
                                setTaskForm((prev) => ({ ...prev, article_content: event.target.value }))
                              }
                              rows={10}
                              placeholder="Enter the article content here..."
                            />
                          </label>
                        )}
                      </>
                    )}
                {(taskForm.type === 'video' || taskForm.type === 'quiz' || taskForm.type === 'article_quiz') && (
                  <div className="admin-form-full admin-quiz-block">
                      <FieldLabel label={t('admin.task.quiz.title')} required />
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
                      <FieldLabel label={t('admin.fields.allowedRoles')} />
                      <MultiSelectDropdown
                        options={ROLE_OPTIONS}
                        selectedValues={taskForm.allowedRoles}
                        onChange={(selected) =>
                          setTaskForm((prev) => ({ ...prev, allowedRoles: selected }))
                        }
                        placeholder={t('admin.task.audience.allRoles')}
                      />
                    </div>
                    <div className="admin-field">
                      <FieldLabel label={t('admin.fields.allowedUserTypes')} />
                      <MultiSelectDropdown
                        options={USER_TYPE_OPTIONS}
                        selectedValues={taskForm.allowedUserTypes}
                        onChange={(selected) =>
                          setTaskForm((prev) => ({ ...prev, allowedUserTypes: selected }))
                        }
                        placeholder={t('admin.task.audience.allUserTypes')}
                      />
                    </div>
                    <div className="admin-field">
                      <FieldLabel label={t('admin.fields.allowedHotels')} />
                      <MultiSelectDropdown
                        options={HOTEL_OPTIONS}
                        selectedValues={taskForm.allowedHotelIds}
                        onChange={(selected) =>
                          setTaskForm((prev) => ({ ...prev, allowedHotelIds: selected }))
                        }
                        placeholder={t('admin.task.audience.allHotels')}
                      />
                    </div>
                  </div>
                </section>
                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <h3>Recurrence</h3>
                    <p>Set how often this task should be automatically regenerated.</p>
                  </div>
                  <div className="admin-form-grid">
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label="Recurrence Type" />
                      <select
                        value={taskForm.recurrence}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            recurrence: event.target.value as 'once' | 'daily' | 'weekly' | 'monthly',
                          }))
                        }
                        className="admin-select"
                      >
                        <option value="once">Once - Task is created once and disappears when finished</option>
                        <option value="daily">Daily - Task appears once daily (if previous is finished, waits until next day)</option>
                        <option value="weekly">Weekly - Task appears once weekly (if previous is finished, waits until next week)</option>
                        <option value="monthly">Monthly - Task appears once monthly (if previous is finished, waits until next month)</option>
                      </select>
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
                          : t('admin.task.publishHint.completeRequired')}
                      </p>
                    ) : (
                      <p className="admin-publish-hint">{t('admin.task.publishHint.ready')}</p>
                    )}
                  </div>
                  <div className="admin-form-actions-buttons">
                    {isEditingTask && (
                      <button
                        type="button"
                        className="admin-action-button secondary"
                        onClick={cancelTaskEdit}
                      >
                        {t('common.actions.cancel')}
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
                title={isEditingReward ? t('admin.reward.cancelEditing') : t('admin.reward.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{isEditingReward ? t('admin.reward.cancelEditing') : t('admin.reward.back')}</span>
              </button>
            </div>
          </header>

          {rewardTemplatesLoading && <p>Loading reward templates…</p>}
          {Boolean(rewardTemplatesError) && (
            <p className="admin-error">Failed to load reward templates.</p>
          )}
          {Boolean(locationsError) && (
            <p className="admin-error">
              Failed to load locations. Create or refresh locations before publishing rewards.
            </p>
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
                    <label className="admin-field">
                      <FieldLabel label="Location" required />
                      {locationsLoading ? (
                        <p className="admin-field-note">Loading locations…</p>
                      ) : hasRewardLocationOptions ? (
                        <select
                          value={rewardForm.locationId}
                          onChange={(event) =>
                            setRewardForm((prev) => ({ ...prev, locationId: event.target.value }))
                          }
                        >
                          <option value="">Select location</option>
                          {rewardLocationSelectOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="admin-field-note">
                          <p>{t('admin.task.noLocations')}</p>
                          <button type="button" className="link-button" onClick={goToLocationCreation}>
                            Create a location
                          </button>
                        </div>
                      )}
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
                      <FieldLabel label={t('admin.fields.allowedRoles')} />
                      <MultiSelectDropdown
                        options={ROLE_OPTIONS}
                        selectedValues={rewardForm.allowedRoles}
                        onChange={(selected) =>
                          setRewardForm((prev) => ({ ...prev, allowedRoles: selected }))
                        }
                        placeholder={t('admin.reward.audience.allRoles')}
                      />
                    </div>
                    <div className="admin-field">
                      <FieldLabel label={t('admin.fields.allowedUserTypes')} />
                      <MultiSelectDropdown
                        options={USER_TYPE_OPTIONS}
                        selectedValues={rewardForm.allowedUserTypes}
                        onChange={(selected) =>
                          setRewardForm((prev) => ({ ...prev, allowedUserTypes: selected }))
                        }
                        placeholder={t('admin.reward.audience.allUserTypes')}
                      />
                    </div>
                    <div className="admin-field">
                      <FieldLabel label={t('admin.fields.allowedHotels')} />
                      <MultiSelectDropdown
                        options={HOTEL_OPTIONS}
                        selectedValues={rewardForm.allowedHotelIds}
                        onChange={(selected) =>
                          setRewardForm((prev) => ({ ...prev, allowedHotelIds: selected }))
                        }
                        placeholder={t('admin.reward.audience.allHotels')}
                      />
                    </div>
                  </div>
                </section>

                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <h3>Recurrence</h3>
                    <p>Set how often this reward should be automatically regenerated.</p>
                  </div>
                  <div className="admin-form-grid">
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label="Recurrence Type" />
                      <select
                        value={rewardForm.recurrence}
                        onChange={(event) =>
                          setRewardForm((prev) => ({
                            ...prev,
                            recurrence: event.target.value as 'once' | 'daily' | 'weekly' | 'monthly',
                          }))
                        }
                        className="admin-select"
                      >
                        <option value="once">Once - Reward is created once and disappears when finished</option>
                        <option value="daily">Daily - Reward appears once daily (if previous is finished, waits until next day)</option>
                        <option value="weekly">Weekly - Reward appears once weekly (if previous is finished, waits until next week)</option>
                        <option value="monthly">Monthly - Reward appears once monthly (if previous is finished, waits until next month)</option>
                      </select>
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
                          : t('admin.reward.publishHint.completeRequired')}
                      </p>
                    ) : (
                      <p className="admin-publish-hint">{t('admin.reward.publishHint.ready')}</p>
                    )}
                  </div>
                  <div className="admin-form-actions-buttons">
                    {isEditingReward && (
                      <button
                        type="button"
                        className="admin-action-button secondary"
                        onClick={cancelRewardEdit}
                      >
                        {t('common.actions.cancel')}
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

      {mode === 'location' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{isEditingLocation ? 'Edit Location' : 'Create Location'}</h2>
              <p>
                Define where tasks and rewards take place. Locations can be online or physical with an
                address and GPS coordinates.
              </p>
            </div>
            <div className="admin-actions">
              <button
                className="admin-icon-button"
                onClick={() => {
                  if (isEditingLocation) {
                    cancelLocationEdit();
                  } else if (locationReturnMode) {
                    setMode(locationReturnMode);
                    setLocationReturnMode(null);
                  } else {
                    setMode(null);
                  }
                }}
                title="Back"
              >
                <Icon name="back" />
                <span className="sr-only">Back</span>
              </button>
            </div>
          </header>

          <div className="admin-form-card">
            <div className="admin-form-layout">
              <section className="admin-form-section">
                <div className="admin-form-section-header">
                  <div>
                    <h3>Location details</h3>
                    <p>Provide the basic information for this location.</p>
                  </div>
                </div>
                <div className={`admin-form-grid admin-form-grid-two ${locationForm.mode === 'physical' ? 'admin-form-grid-location' : ''}`}>
                  <label className="admin-field admin-field-span-2">
                    <FieldLabel label="Name" required />
                    <input
                      type="text"
                      value={locationForm.name}
                      onChange={(event) =>
                        setLocationForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="admin-field admin-field-span-2">
                    <FieldLabel label="Description" required />
                    <textarea
                      rows={3}
                      value={locationForm.description}
                      onChange={(event) =>
                        setLocationForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </label>
                  <div className="admin-field">
                    <FieldLabel label="Active" />
                    <div className="admin-toggle">
                      <input
                        id="location-active-toggle"
                        type="checkbox"
                        className="admin-checkbox"
                        style={COMPACT_TOGGLE_STYLE}
                        checked={locationForm.active}
                        onChange={(event) =>
                          setLocationForm((prev) => ({ ...prev, active: event.target.checked }))
                        }
                      />
                      <label htmlFor="location-active-toggle">
                        {locationForm.active ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                  </div>
                  <div className="admin-field admin-field-span-2">
                    <FieldLabel label="Location type" required />
                    <div className="admin-toggle-group">
                      <label className="admin-radio-option">
                        <input
                          type="radio"
                          className="admin-radio"
                          style={COMPACT_TOGGLE_STYLE}
                          value="online"
                          checked={locationForm.mode === 'online'}
                          onChange={() =>
                            setLocationForm((prev) => ({
                              ...prev,
                              mode: 'online',
                              address: '',
                              latitude: '',
                              longitude: '',
                            }))
                          }
                        />
                        <span>Online</span>
                      </label>
                      <label className="admin-radio-option">
                        <input
                          type="radio"
                          className="admin-radio"
                          style={COMPACT_TOGGLE_STYLE}
                          value="physical"
                          checked={locationForm.mode === 'physical'}
                          onChange={() =>
                            setLocationForm((prev) => ({
                              ...prev,
                              mode: 'physical',
                            }))
                          }
                        />
                        <span>Physical</span>
                      </label>
                    </div>
                  </div>
                  {locationForm.mode === 'physical' && (
                    <>
                      <label className="admin-field">
                        <FieldLabel label="Address" required />
                        <textarea
                          rows={3}
                          value={locationForm.address}
                          onChange={(event) =>
                            setLocationForm((prev) => ({ ...prev, address: event.target.value }))
                          }
                          placeholder="Enter the full address"
                        />
                      </label>
                      <label className="admin-field">
                        <FieldLabel label="Latitude" required />
                        <input
                          type="number"
                          step="0.000001"
                          value={locationForm.latitude}
                          onChange={(event) =>
                            setLocationForm((prev) => ({ ...prev, latitude: event.target.value }))
                          }
                          placeholder="e.g. 52.520008"
                        />
                      </label>
                      <label className="admin-field">
                        <FieldLabel label="Longitude" required />
                        <input
                          type="number"
                          step="0.000001"
                          value={locationForm.longitude}
                          onChange={(event) =>
                            setLocationForm((prev) => ({ ...prev, longitude: event.target.value }))
                          }
                          placeholder="e.g. 13.404954"
                        />
                      </label>
                    </>
                  )}
                  {locationForm.mode === 'online' && (
                    <div className="admin-form-full">
                      <p className="admin-field-note">
                        Online locations do not require an address or coordinates.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <div className="admin-form-actions">
                <div className="admin-form-feedback">
                  {locationMessage ? (
                    <p className={locationMessage.type === 'error' ? 'admin-error' : 'admin-success'}>
                      {locationMessage.text}
                    </p>
                  ) : isEditingLocation ? (
                    <p className="admin-publish-hint">Editing existing location.</p>
                  ) : !locationValidation.isValid ? (
                    <p className="admin-publish-hint">
                      {hasAttemptedLocationSubmit && locationValidation.message
                        ? locationValidation.message
                        : t('admin.location.publishHint.completeRequired')}
                    </p>
                  ) : (
                    <p className="admin-publish-hint">{t('admin.location.publishHint.ready')}</p>
                  )}
                </div>
                <div className="admin-form-actions-buttons">
                  {isEditingLocation && (
                    <button
                      type="button"
                      className="admin-action-button secondary"
                      onClick={cancelLocationEdit}
                    >
                      {t('common.actions.cancel')}
                    </button>
                  )}
                  <button
                    className="admin-submit"
                    onClick={handleLocationSubmit}
                    disabled={isLocationSubmitDisabled}
                  >
                    {isEditingLocation ? 'Update Location' : 'Create Location'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {mode === 'qrScanner' && (
        <QrScannerPage onBack={() => setMode(null)} />
      )}

      {mode === 'locationManage' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>Manage Locations</h2>
              <p>Review existing locations, edit their details, or remove unused entries.</p>
            </div>
            <div className="admin-actions">
              <button
                className="admin-icon-button"
                onClick={() => refetchLocations()}
                title={t('admin.locationManage.refresh')}
              >
                <Icon name="refresh" />
                <span className="sr-only">{t('admin.locationManage.refresh')}</span>
              </button>
              <button
                className="admin-icon-button"
                onClick={() => setMode(null)}
                title={t('admin.locationManage.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{t('admin.locationManage.back')}</span>
              </button>
            </div>
          </header>

          {locationsLoading && <p>{t('admin.locationManage.loading')}</p>}
          {Boolean(locationsError) && (
            <p className="admin-error">{t('admin.locationManage.loadError')}</p>
          )}

          <div className="admin-management-card">
            <div className="admin-management-top">
              <div>
                <h3>{t('admin.locationManage.existing.title')}</h3>
                <p>{t('admin.locationManage.existing.subtitle')}</p>
              </div>
              <div className="admin-management-controls">
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    style={COMPACT_TOGGLE_STYLE}
                    checked={includeInactiveLocations}
                    onChange={(event) => {
                      setIncludeInactiveLocations(event.target.checked);
                      setSelectedLocationIds([]);
                    }}
                  />
                  <span>{t('admin.locationManage.showInactive')}</span>
                </label>
                <button className="admin-action-button" type="button" onClick={goToLocationCreation}>
                  New location
                </button>
              </div>
            </div>
            {locationManagementMessage && (
              <p
                className={
                  locationManagementMessage.type === 'error' ? 'admin-error' : 'admin-success'
                }
              >
                {locationManagementMessage.text}
              </p>
            )}
            <div className="admin-management-actions">
              <div className="admin-bulk-buttons">
                <button
                  className="admin-action-button"
                  onClick={() => handleLocationBulkStatus(true)}
                  disabled={!hasLocationSelection}
                  type="button"
                >
                  Activate
                </button>
                <button
                  className="admin-action-button"
                  onClick={() => handleLocationBulkStatus(false)}
                  disabled={!hasLocationSelection}
                  type="button"
                >
                  Deactivate
                </button>
                <button
                  className="admin-action-button danger"
                  onClick={handleLocationBulkDelete}
                  disabled={!hasLocationSelection}
                  type="button"
                >
                  Delete
                </button>
              </div>
              <span className="admin-selection-count">
                {hasLocationSelection
                  ? `${selectedLocationIds.length} selected`
                  : 'No locations selected'}
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
                        checked={allLocationsSelected && locationsList.length > 0}
                        disabled={!locationsList.length}
                        onChange={(event) =>
                          setSelectedLocationIds(
                            event.target.checked
                              ? selectableLocationIds
                              : []
                          )
                        }
                        aria-label={t('admin.locationManage.selectAll')}
                      />
                    </th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th style={{ width: '22rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locationsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="admin-table-empty">
                        No locations found.
                      </td>
                    </tr>
                  ) : (
                    locationsList.map((location) => {
                      const isDefaultLocation = isDefaultLocationRecord(location);
                      const isSelected = selectedLocationIds.includes(location.id);
                      return (
                        <tr key={location.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="admin-checkbox"
                              style={COMPACT_TOGGLE_STYLE}
                              checked={isSelected}
                              onChange={(event) =>
                                toggleLocationSelection(location.id, event.target.checked)
                              }
                              aria-label={`Select location ${location.name}`}
                            />
                          </td>
                          <td data-label="Name">
                            <div className="admin-table-primary">
                              <span className="admin-table-title">{location.name}</span>
                              {location.description && (
                                <span className="admin-table-subtitle">{location.description}</span>
                              )}
                            </div>
                          </td>
                          <td data-label="Type">
                            <span className="admin-status-badge">
                              {location.is_online ? 'Online' : 'Physical'}
                            </span>
                          </td>
                          <td data-label="Details">
                            {location.is_online ? (
                              <span className="admin-table-subtitle">Accessible online</span>
                            ) : (
                              <div className="admin-table-secondary">
                                {location.address && (
                                  <span className="admin-table-subtitle">{location.address}</span>
                                )}
                                <span className="admin-table-subtitle">
                                  {location.latitude}, {location.longitude}
                                </span>
                              </div>
                            )}
                          </td>
                          <td data-label="Status">
                            <span
                              className={`admin-status-badge ${
                                location.active ? 'active' : 'inactive'
                              }`}
                            >
                              {location.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td data-label="Actions" className="admin-table-actions">
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => startLocationEdit(location)}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => handleLocationStatusChange(location.id, !location.active)}
                              disabled={isDefaultLocation}
                            >
                              {location.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              className="admin-action-button danger"
                              type="button"
                              onClick={() => handleLocationDelete(location)}
                              disabled={isDefaultLocation}
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
                  title={t('admin.taskManage.refresh')}
                >
                  <Icon name="refresh" />
                  <span className="sr-only">{t('admin.taskManage.refresh')}</span>
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
                title={isEditingTask ? t('admin.task.cancelEditing') : t('admin.taskManage.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{isEditingTask ? t('admin.task.cancelEditing') : t('admin.taskManage.back')}</span>
              </button>
            </div>
          </header>

          {tasksLoading && <p>{t('admin.taskManage.loading')}</p>}
          {Boolean(tasksError) && <p className="admin-error">{t('admin.taskManage.loadError')}</p>}

          <button 
            className="admin-action-button admin-mobile-new-task-button" 
            type="button" 
            onClick={goToTaskCreation}
          >
            New task
          </button>

          <div className="admin-management-card">
            <div className="admin-management-top">
              <div>
                <h3>{t('admin.taskManage.existing.title')}</h3>
                <p>Review, edit, activate, deactivate, or delete tasks directly.</p>
              </div>
              <div className="admin-management-controls">
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
                  <span>{t('admin.taskManage.showInactive')}</span>
                </label>
                <button
                  className="admin-mobile-filter-button"
                  type="button"
                  onClick={() => setIsMobileTaskFilterOpen(true)}
                  aria-label={t('admin.taskManage.openFilters')}
                >
                  <Icon name="filter" />
                  {(taskFilterLocation || taskFilterStatus || taskFilterRecurrence || taskFilterType) && (
                    <span className="admin-mobile-filter-badge">
                      {[taskFilterLocation, taskFilterStatus, taskFilterRecurrence, taskFilterType].filter(Boolean).length}
                    </span>
                  )}
                </button>
                <button className="admin-action-button admin-desktop-new-task-button" type="button" onClick={goToTaskCreation}>
                  New task
                </button>
              </div>
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
                        checked={allTasksSelected && filteredTasks.length > 0}
                        disabled={!filteredTasks.length}
                        onChange={(event) =>
                          setSelectedTaskIds(
                            event.target.checked
                              ? filteredTasks.map((task) => task.id)
                              : []
                          )
                        }
                        aria-label={t('admin.taskManage.selectAll')}
                      />
                    </th>
                    <th>Task</th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTaskFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTaskFilterDropdown('type');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Type {taskFilterType && '✓'}
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTaskFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTaskFilterDropdown('location');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Location {taskFilterLocation && '✓'}
                    </th>
                    <th>Points</th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTaskFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTaskFilterDropdown('status');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Status {taskFilterStatus && '✓'}
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTaskFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTaskFilterDropdown('recurrence');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Recurrence {taskFilterRecurrence && '✓'}
                    </th>
                    <th style={{ width: '24rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="admin-table-empty">
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
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
                          <td data-label="Location">
                            <div className="admin-table-secondary">
                              <span className="admin-table-title">
                                {task.location?.name || '—'}
                              </span>
                              {task.location?.is_online ? (
                                <span className="admin-table-subtitle">Online</span>
                              ) : task.location?.address ? (
                                <span className="admin-table-subtitle">{task.location.address}</span>
                              ) : null}
                            </div>
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
                          <td data-label="Recurrence">
                            <span className="admin-table-secondary">
                              {((task as any).recurrence || 'once').charAt(0).toUpperCase() + 
                               ((task as any).recurrence || 'once').slice(1)}
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
              {taskFilterDropdown && taskFilterDropdownPosition && (
                <FilterDropdown
                  isOpen={true}
                  onClose={() => setTaskFilterDropdown(null)}
                  position={taskFilterDropdownPosition}
                  options={
                    taskFilterDropdown === 'location'
                      ? taskFilterOptions.locations
                      : taskFilterDropdown === 'status'
                      ? taskFilterOptions.statuses
                      : taskFilterDropdown === 'recurrence'
                      ? taskFilterOptions.recurrences
                      : taskFilterOptions.types
                  }
                  selectedValue={
                    taskFilterDropdown === 'location'
                      ? taskFilterLocation
                      : taskFilterDropdown === 'status'
                      ? taskFilterStatus
                      : taskFilterDropdown === 'recurrence'
                      ? taskFilterRecurrence
                      : taskFilterType
                  }
                  onSelect={(value) => {
                    if (taskFilterDropdown === 'location') {
                      setTaskFilterLocation(value);
                    } else if (taskFilterDropdown === 'status') {
                      setTaskFilterStatus(value as 'active' | 'inactive' | null);
                    } else if (taskFilterDropdown === 'recurrence') {
                      setTaskFilterRecurrence(value);
                    } else {
                      setTaskFilterType(value);
                    }
                  }}
                  type={taskFilterDropdown === 'type' ? 'type' : taskFilterDropdown}
                />
              )}
            </div>
          </div>
          <MobileFilterModal
            isOpen={isMobileTaskFilterOpen}
            onClose={() => setIsMobileTaskFilterOpen(false)}
            filterOptions={taskFilterOptions}
            filters={{
              location: taskFilterLocation,
              status: taskFilterStatus,
              recurrence: taskFilterRecurrence,
              type: taskFilterType,
            }}
            onFilterChange={(filterType, value) => {
              if (filterType === 'location') {
                setTaskFilterLocation(value);
              } else if (filterType === 'status') {
                setTaskFilterStatus(value as 'active' | 'inactive' | null);
              } else if (filterType === 'recurrence') {
                setTaskFilterRecurrence(value);
              } else if (filterType === 'type') {
                setTaskFilterType(value);
              }
            }}
            onClearAll={() => {
              setTaskFilterLocation(null);
              setTaskFilterStatus(null);
              setTaskFilterRecurrence(null);
              setTaskFilterType(null);
            }}
          />
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
                  title={t('admin.rewardManage.refresh')}
                >
                  <Icon name="refresh" />
                  <span className="sr-only">{t('admin.rewardManage.refresh')}</span>
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
                title={isEditingReward ? t('admin.reward.cancelEditing') : t('admin.rewardManage.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{isEditingReward ? t('admin.reward.cancelEditing') : t('admin.rewardManage.back')}</span>
              </button>
            </div>
          </header>

          {rewardTemplatesLoading && <p>{t('admin.rewardManage.loading')}</p>}
          {Boolean(rewardTemplatesError) && (
            <p className="admin-error">{t('admin.rewardManage.loadError')}</p>
          )}

          <div className="admin-management-card">
            <div className="admin-management-top">
              <div>
                <h3>{t('admin.rewardManage.existing.title')}</h3>
                <p>{t('admin.rewardManage.existing.subtitle')}</p>
              </div>
              <div className="admin-management-controls">
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
                <button
                  className="admin-mobile-filter-button"
                  type="button"
                  onClick={() => setIsMobileRewardFilterOpen(true)}
                  aria-label="Open filters"
                >
                  <Icon name="filter" />
                  {(rewardFilterLocation || rewardFilterStatus || rewardFilterRecurrence || rewardFilterType) && (
                    <span className="admin-mobile-filter-badge">
                      {[rewardFilterLocation, rewardFilterStatus, rewardFilterRecurrence, rewardFilterType].filter(Boolean).length}
                    </span>
                  )}
                </button>
                <button className="admin-action-button" type="button" onClick={goToRewardCreation}>
                  New reward
                </button>
              </div>
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
                        checked={allRewardsSelected && filteredRewards.length > 0}
                        disabled={!filteredRewards.length}
                        onChange={(event) =>
                          setSelectedRewardIds(
                            event.target.checked
                              ? filteredRewards.map((reward) => reward.id)
                              : []
                          )
                        }
                        aria-label={t('admin.rewardManage.selectAll')}
                      />
                    </th>
                    <th>Reward</th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setRewardFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setRewardFilterDropdown('type');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Type {rewardFilterType && '✓'}
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setRewardFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setRewardFilterDropdown('location');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Location {rewardFilterLocation && '✓'}
                    </th>
                    <th>Cost</th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setRewardFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setRewardFilterDropdown('status');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Status {rewardFilterStatus && '✓'}
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setRewardFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setRewardFilterDropdown('recurrence');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Recurrence {rewardFilterRecurrence && '✓'}
                    </th>
                    <th style={{ width: '24rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRewards.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="admin-table-empty">
                        No rewards found.
                      </td>
                    </tr>
                  ) : (
                    filteredRewards.map((reward) => {
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
                          <td data-label="Location">
                            <div className="admin-table-secondary">
                              <span className="admin-table-title">
                                {reward.location?.name || '—'}
                              </span>
                              {reward.location?.is_online ? (
                                <span className="admin-table-subtitle">Online</span>
                              ) : reward.location?.address ? (
                                <span className="admin-table-subtitle">{reward.location.address}</span>
                              ) : null}
                            </div>
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
                          <td data-label="Recurrence">
                             <span className="admin-table-type">
                               {reward.recurrence === 'daily' && 'Daily'}
                               {reward.recurrence === 'weekly' && 'Weekly'}
                               {reward.recurrence === 'monthly' && 'Monthly'}
                               {(!reward.recurrence || reward.recurrence === 'once') && 'Once'}
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
              {rewardFilterDropdown && rewardFilterDropdownPosition && (
                <FilterDropdown
                  isOpen={true}
                  onClose={() => setRewardFilterDropdown(null)}
                  position={rewardFilterDropdownPosition}
                  options={
                    rewardFilterDropdown === 'location'
                      ? rewardFilterOptions.locations
                      : rewardFilterDropdown === 'status'
                      ? rewardFilterOptions.statuses
                      : rewardFilterDropdown === 'recurrence'
                      ? rewardFilterOptions.recurrences
                      : rewardFilterOptions.types
                  }
                  selectedValue={
                    rewardFilterDropdown === 'location'
                      ? rewardFilterLocation
                      : rewardFilterDropdown === 'status'
                      ? rewardFilterStatus
                      : rewardFilterDropdown === 'recurrence'
                      ? rewardFilterRecurrence
                      : rewardFilterType
                  }
                  onSelect={(value) => {
                    if (rewardFilterDropdown === 'location') {
                      setRewardFilterLocation(value);
                    } else if (rewardFilterDropdown === 'status') {
                      setRewardFilterStatus(value as 'active' | 'inactive' | null);
                    } else if (rewardFilterDropdown === 'recurrence') {
                      setRewardFilterRecurrence(value);
                    } else {
                      setRewardFilterType(value);
                    }
                  }}
                  type={rewardFilterDropdown === 'type' ? 'type' : rewardFilterDropdown}
                />
              )}
            </div>
          </div>
          <MobileFilterModal
            isOpen={isMobileRewardFilterOpen}
            onClose={() => setIsMobileRewardFilterOpen(false)}
            filterOptions={rewardFilterOptions}
            filters={{
              location: rewardFilterLocation,
              status: rewardFilterStatus,
              recurrence: rewardFilterRecurrence,
              type: rewardFilterType,
            }}
            onFilterChange={(filterType, value) => {
              if (filterType === 'location') {
                setRewardFilterLocation(value);
              } else if (filterType === 'status') {
                setRewardFilterStatus(value as 'active' | 'inactive' | null);
              } else if (filterType === 'recurrence') {
                setRewardFilterRecurrence(value);
              } else if (filterType === 'type') {
                setRewardFilterType(value);
              }
            }}
            onClearAll={() => {
              setRewardFilterLocation(null);
              setRewardFilterStatus(null);
              setRewardFilterRecurrence(null);
              setRewardFilterType(null);
            }}
          />
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
      <ConfirmDialog
        {...locationConfirm}
        onCancel={() => setLocationConfirm(defaultConfirmDialogState)}
      />
      <ConfirmDialog
        {...validationConfirm}
        onCancel={() => setValidationConfirm(defaultConfirmDialogState)}
      />
    </div>
  );
}

export default AdminPage;

