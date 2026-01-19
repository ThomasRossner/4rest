import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
import { TaskTypeIcon } from '../../components/TypeIcons/TaskTypeIcon';
import { RewardTypeIcon } from '../../components/TypeIcons/RewardTypeIcon';
import QrScannerPage from './QrScannerPage';
import { LocationMap } from '../../components/LocationMap/LocationMap';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import { SurveyAnalytics } from './SurveyAnalytics';
import { DebugTools } from './DebugTools';
import { UserManagement } from './UserManagement';
import { TeamCreator } from '../../components/Teams/TeamCreator';
import { ContestCreator } from '../../components/Contests/ContestCreator';
import { UserSelectionModal } from '../../components/Admin/UserSelectionModal';
import { TeamManagement } from '../../components/Admin/TeamManagement';
import { ContestManagement } from '../../components/Admin/ContestManagement';
import { PhotoValidation } from '../../components/Admin/PhotoValidation';
import QRCode from 'qrcode.react';
import { useSelection } from '../../hooks/useSelection';
import { useEntityFilters, type FilterConfig } from '../../hooks/useEntityFilters';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { ManagementHeader } from '../../components/Management/ManagementHeader';
import { ManagementCard } from '../../components/Management/ManagementCard';
import { BulkActionsBar } from '../../components/Management/BulkActionsBar';
import { ManagementTable, type TableColumn } from '../../components/Management/ManagementTable';
import PointsBonusPage from '../Employee/PointsBonusPage';

type AdminMode =
  | 'task'
  | 'reward'
  | 'taskManage'
  | 'rewardManage'
  | 'location'
  | 'locationManage'
  | 'qrScanner'
  | 'forestStats'
  | 'surveyAnalytics'
  | 'debugTools'
  | 'parameterManage'
  | 'userManage'
  | 'teamManage'
  | 'contestManage'
  | 'photoValidation'
  | 'pointsBonus'
  | null;
type TaskSource = '' | 'existing' | 'video' | 'quiz' | 'article_quiz' | 'survey' | 'qr' | 'photo' | 'visit_location';

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
  allowed_teams?: string[] | null;
  allowed_contests?: string[] | null;
  allowed_user_types?: UserType[] | null;
  allowed_hotel_ids?: HotelId[] | null;
  location_id?: string | null;
  target_latitude?: number | null;
  target_longitude?: number | null;
  location?: AdminLocation | null;
  active?: boolean | null;
  created_at?: string | null;
  prerequisite_task_id?: string | null;
  prerequisite_task_count?: number | null;
  prerequisite_task_ids?: string[] | null;
  category?: string | null;
  difficulty?: string | null;
  time_required?: string | null;
  location_tool?: string | null;
  thumbnail_url?: string | null;
};

type RewardTemplate = {
  id: string;
  title: string;
  description?: string | null;
  reward_type: string;
  points_cost: number;
  voucher_code?: string | null;
  external_api_id?: string | null;
  allowed_teams?: string[] | null;
  allowed_contests?: string[] | null;
  allowed_user_types?: string[] | null;
  allowed_hotel_ids?: string[] | null;
  created_at?: string | null;
  location_id?: string | null;
  location?: AdminLocation | null;
  active?: boolean | null;
  reward_art?: string | null;
  kategorie?: string | null;
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
  category?: string | null;
  category_description?: string | null;
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
  locationId: string;
  active: boolean;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  article_url: string;
  article_content: string;
  articleSource: 'url' | 'content';
  surveyQuestions: any[];
  surveyType: 'single_choice' | 'multiple_choice' | 'text' | 'rating' | 'mixed';
  target_latitude?: string;
  target_longitude?: string;
  target_address?: string;
  prerequisite_task_id?: string;
  prerequisite_task_count?: number;
  prerequisite_task_ids?: string[];
  category?: 'Kommunikation & Netzwerke' | 'Mensch & soziales Umfeld' | 'Natur & Umweltschutz' | 'Ressourcenverbrauch & Materialeinsatz';
  difficulty?: 'sehr einfach' | 'einfach' | 'mittel' | 'schwer' | 'sehr schwer';
  time_required?: '1-3 Min' | '3-10 Min' | '10-30 Min' | '30-60 Min' | '60+ Min';
  location_tool?: 'Umgebung' | 'Hotel' | 'egal' | 'Smartphone/PC';
  thumbnailFile?: File | null;
  thumbnailUrl?: string | null;
  allowed_teams?: string[];
  allowed_contests?: string[];
};

type RewardFormState = {
  title: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  voucherCode: string;
  externalApiId: string;
  locationId: string;
  active: boolean;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  reward_art?: string;
  kategorie?: string;
  moegliche_punkte?: number | null;
  thumbnailFile?: File | null;
  thumbnailUrl?: string | null;
  allowed_teams?: string[];
  allowed_contests?: string[];
};

type LocationFormState = {
  name: string;
  description: string;
  mode: 'online' | 'physical';
  address: string;
  latitude: string;
  longitude: string;
  active: boolean;
  category: string;
  categoryDescription: string;
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

type SurveyQuestionDraft = {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'rating';
  options?: string[];
  required: boolean;
  minRating?: number;
  maxRating?: number;
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
  confirmTone?: 'default' | 'danger';
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

// TaskTypeIcon is now imported from shared component

// TaskTypeBadge for use in forms (shows icon + type text)
const TaskTypeBadge = ({ type, thumbnailUrl }: { type: string; thumbnailUrl?: string | null }) => {
  const typeIcon = TASK_TYPE_ICONS[type] ?? '🧩';
  const displayIcon = thumbnailUrl ? (
    <img src={thumbnailUrl} alt={type} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
  ) : (
    <span className="admin-type-icon" aria-hidden="true" style={{ fontSize: '48px', lineHeight: '1', display: 'inline-block' }}>
      {typeIcon}
    </span>
  );
  return (
    <div className="admin-type-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {displayIcon}
      <span>{type.toUpperCase()}</span>
    </div>
  );
};

// RewardTypeIcon is now imported from shared component

// RewardTypeBadge for use in forms (shows icon + type text)
const RewardTypeBadge = ({ type, thumbnailUrl }: { type: RewardType; thumbnailUrl?: string | null }) => {
  const typeIcon = REWARD_TYPE_ICONS[type] ?? '🎁';
  const displayIcon = thumbnailUrl ? (
    <img src={thumbnailUrl} alt={type} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
  ) : (
    <span className="admin-type-icon" aria-hidden="true" style={{ fontSize: '48px', lineHeight: '1', display: 'inline-block' }}>
      {typeIcon}
    </span>
  );
  return (
    <div className="admin-type-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {displayIcon}
      <span>{type.toUpperCase().replace(/_/g, ' ')}</span>
    </div>
  );
};

type FilterDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  options?: Array<{ id: string; name?: string } | string>;
  selectedValue?: string | null;
  onSelect?: (value: string | null) => void;
  type: 'location' | 'status' | 'recurrence' | 'type' | 'title' | 'points' | 'cost' | 'name' | 'creator' | 'endDate';
  // For text filters
  textValue?: string;
  onTextChange?: (value: string) => void;
  // For numeric filters
  minValue?: string;
  maxValue?: string;
  onMinChange?: (value: string) => void;
  onMaxChange?: (value: string) => void;
  // For date filters
  dateValue?: string;
  onDateChange?: (value: string) => void;
};

const FilterDropdown = ({
  isOpen,
  onClose,
  position,
  options,
  selectedValue,
  onSelect,
  type,
  textValue,
  onTextChange,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  dateValue,
  onDateChange,
}: FilterDropdownProps) => {
  const { t } = useTranslation();
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

  // Text input filter (for title or name)
  if ((type === 'title' || type === 'name') && onTextChange !== undefined) {
    return (
      <div
        ref={dropdownRef}
        className="admin-filter-dropdown"
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1000,
          minWidth: '200px',
        }}
      >
        <div className="admin-filter-dropdown-header">
          <span>{t('admin.filters.filterBy', { type: t(`admin.filters.${type}`) })}</span>
          <button
            type="button"
            onClick={() => {
              onTextChange('');
              onClose();
            }}
            className="admin-filter-clear"
            style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem' }}
          >
            {t('admin.filters.clear')}
          </button>
        </div>
        <div className="admin-filter-dropdown-content" style={{ padding: '0.75rem' }}>
          <input
            type="text"
            value={textValue || ''}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={t(`admin.filters.${type}Placeholder`, { defaultValue: t('admin.filters.titlePlaceholder') })}
            style={{ width: '100%', padding: '0.5rem' }}
            autoFocus
          />
        </div>
      </div>
    );
  }

  // Date filter (for endDate)
  if (type === 'endDate' && onDateChange !== undefined) {
    return (
      <div
        ref={dropdownRef}
        className="admin-filter-dropdown"
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1000,
          minWidth: '200px',
        }}
      >
        <div className="admin-filter-dropdown-header">
          <span>{t('admin.filters.filterBy', { type: t('admin.filters.endDate') })}</span>
          <button
            type="button"
            onClick={() => {
              onDateChange('');
              onClose();
            }}
            className="admin-filter-clear"
            style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem' }}
          >
            {t('admin.filters.clear')}
          </button>
        </div>
        <div className="admin-filter-dropdown-content" style={{ padding: '0.75rem' }}>
          <input
            type="date"
            value={dateValue || ''}
            onChange={(e) => onDateChange(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
            autoFocus
          />
        </div>
      </div>
    );
  }

  // Numeric range filter (for points/cost)
  if ((type === 'points' || type === 'cost') && onMinChange !== undefined && onMaxChange !== undefined) {
    return (
      <div
        ref={dropdownRef}
        className="admin-filter-dropdown"
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1000,
          minWidth: '220px',
        }}
      >
        <div className="admin-filter-dropdown-header">
          <span>{t('admin.filters.filterBy', { type: t(`admin.filters.${type}`) })}</span>
          <button
            type="button"
            onClick={() => {
              onMinChange('');
              onMaxChange('');
              onClose();
            }}
            className="admin-filter-clear"
            style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem' }}
          >
            {t('admin.filters.clear')}
          </button>
        </div>
        <div className="admin-filter-dropdown-content" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              {t('admin.filters.min')}
            </label>
            <input
              type="number"
              value={minValue || ''}
              onChange={(e) => onMinChange(e.target.value)}
              placeholder={t('admin.filters.minPlaceholder')}
              style={{ width: '100%', padding: '0.5rem' }}
              min="0"
              step="1"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              {t('admin.filters.max')}
            </label>
            <input
              type="number"
              value={maxValue || ''}
              onChange={(e) => onMaxChange(e.target.value)}
              placeholder={t('admin.filters.maxPlaceholder')}
              style={{ width: '100%', padding: '0.5rem' }}
              min="0"
              step="1"
            />
          </div>
        </div>
      </div>
    );
  }

  // Dropdown filter (existing behavior for location, status, recurrence, type)
  const formatValue = (value: string): string => {
    if (type === 'status') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (type === 'recurrence') {
      const recurrenceKey = value as 'once' | 'daily' | 'weekly' | 'monthly';
      return t(`admin.task.recurrence.${recurrenceKey}`).split(' - ')[0]; // Get just the first part before the dash
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
          onClick={() => onSelect?.(null)}
          className="admin-filter-clear"
          style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem' }}
        >
          {t('admin.filters.clear')}
        </button>
      </div>
      <div className="admin-filter-dropdown-list">
        <button
          type="button"
          className={`admin-filter-option ${selectedValue === null ? 'active' : ''}`}
          onClick={() => {
            onSelect?.(null);
            onClose();
          }}
        >
          All
        </button>
        {options?.map((option) => {
          const value = getOptionValue(option);
          const label = getOptionLabel(option);
          return (
            <button
              key={value}
              type="button"
              className={`admin-filter-option ${selectedValue === value ? 'active' : ''}`}
              onClick={() => {
                onSelect?.(value);
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
    locations?: Array<{ id: string; name?: string } | string>;
    statuses?: Array<string>;
    recurrences?: Array<string>;
    types?: Array<string>;
    creators?: Array<{ id: string; name: string }>;
  };
  filters: {
    location?: string | null;
    status?: 'active' | 'inactive' | null;
    recurrence?: string | null;
    type?: string | null;
    title?: string;
    name?: string;
    creator?: string | null;
    pointsMin?: string;
    pointsMax?: string;
    costMin?: string;
    costMax?: string;
    endDate?: string;
  };
  onFilterChange: (filterType: 'location' | 'status' | 'recurrence' | 'type' | 'creator', value: string | null) => void;
  onTitleChange?: (value: string) => void;
  onPointsMinChange?: (value: string) => void;
  onPointsMaxChange?: (value: string) => void;
  onCostMinChange?: (value: string) => void;
  onCostMaxChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  onClearAll: () => void;
  filterType?: 'task' | 'reward' | 'team' | 'contest';
};

const MobileFilterModal = ({
  isOpen,
  onClose,
  filterOptions,
  filters,
  onFilterChange,
  onTitleChange,
  onPointsMinChange,
  onPointsMaxChange,
  onCostMinChange,
  onCostMaxChange,
  onEndDateChange,
  onClearAll,
  filterType = 'task',
}: MobileFilterModalProps) => {
  const { t } = useTranslation();
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
    if (type === 'status') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (type === 'recurrence') {
      const recurrenceKey = value as 'once' | 'daily' | 'weekly' | 'monthly';
      return t(`admin.task.recurrence.${recurrenceKey}`).split(' - ')[0]; // Get just the first part before the dash
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

  const activeFilterCount = [
    filters.location,
    filters.status,
    filters.recurrence,
    filters.type,
    filters.title?.trim(),
    filters.name?.trim(),
    filters.creator,
    filters.endDate?.trim(),
    filters.pointsMin?.trim() || filters.pointsMax?.trim(),
    filters.costMin?.trim() || filters.costMax?.trim(),
  ].filter(Boolean).length;

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
          {filterOptions.locations && filterOptions.locations.length > 0 && (
            <div className="admin-mobile-filter-section">
              <h4>Location</h4>
              <div className="admin-mobile-filter-options">
                <button
                  type="button"
                  className={`admin-mobile-filter-option ${!filters.location ? 'active' : ''}`}
                  onClick={() => onFilterChange('location', null)}
                >
                  {t('admin.filters.allLocations')}
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
          )}

          {/* Status Filter */}
          {filterOptions.statuses && filterOptions.statuses.length > 0 && (
            <div className="admin-mobile-filter-section">
              <h4>Status</h4>
              <div className="admin-mobile-filter-options">
                <button
                  type="button"
                  className={`admin-mobile-filter-option ${!filters.status ? 'active' : ''}`}
                  onClick={() => onFilterChange('status', null)}
                >
                  {t('admin.filters.allStatuses')}
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
          )}

          {/* Recurrence Filter */}
          {filterOptions.recurrences && filterOptions.recurrences.length > 0 && (
            <div className="admin-mobile-filter-section">
              <h4>{t('admin.filters.recurrence')}</h4>
              <div className="admin-mobile-filter-options">
                <button
                  type="button"
                  className={`admin-mobile-filter-option ${!filters.recurrence ? 'active' : ''}`}
                  onClick={() => onFilterChange('recurrence', null)}
                >
                  {t('admin.filters.allRecurrences')}
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
          )}

          {/* Type Filter */}
          {filterOptions.types && filterOptions.types.length > 0 && (
            <div className="admin-mobile-filter-section">
              <h4>Type</h4>
              <div className="admin-mobile-filter-options">
                <button
                  type="button"
                  className={`admin-mobile-filter-option ${!filters.type ? 'active' : ''}`}
                  onClick={() => onFilterChange('type', null)}
                >
                  {t('admin.filters.allTypes')}
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
          )}

          {/* Title Filter */}
          {onTitleChange && (
            <div className="admin-mobile-filter-section">
              <h4>{t('admin.filters.title')}</h4>
              <div className="admin-mobile-filter-options">
                <input
                  type="text"
                  value={filters.title || ''}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder={t('admin.filters.titlePlaceholder')}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
            </div>
          )}

          {/* Name Filter (for teams/contests) */}
          {filterType === 'team' || filterType === 'contest' ? (
            <div className="admin-mobile-filter-section">
              <h4>{t('admin.filters.name')}</h4>
              <div className="admin-mobile-filter-options">
                <input
                  type="text"
                  value={filters.name || ''}
                  onChange={(e) => {
                    if (filterType === 'team' && onTitleChange) {
                      onTitleChange(e.target.value);
                    } else if (filterType === 'contest' && onTitleChange) {
                      onTitleChange(e.target.value);
                    }
                  }}
                  placeholder={t('admin.filters.namePlaceholder')}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
            </div>
          ) : null}

          {/* Creator Filter (for teams/contests) */}
          {filterOptions.creators && filterOptions.creators.length > 0 && (
            <div className="admin-mobile-filter-section">
              <h4>{t('admin.filters.creator')}</h4>
              <div className="admin-mobile-filter-options">
                <button
                  type="button"
                  className={`admin-mobile-filter-option ${!filters.creator ? 'active' : ''}`}
                  onClick={() => onFilterChange('creator', null)}
                >
                  {t('admin.filters.allCreators')}
                </button>
                {filterOptions.creators.map((creator) => (
                  <button
                    key={creator.id}
                    type="button"
                    className={`admin-mobile-filter-option ${filters.creator === creator.id ? 'active' : ''}`}
                    onClick={() => onFilterChange('creator', filters.creator === creator.id ? null : creator.id)}
                  >
                    {creator.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End Date Filter (for contests) */}
          {filterType === 'contest' && onEndDateChange && (
            <div className="admin-mobile-filter-section">
              <h4>{t('admin.filters.endDate')}</h4>
              <div className="admin-mobile-filter-options">
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
            </div>
          )}

          {/* Points/Cost Filter */}
          {(onPointsMinChange || onCostMinChange) && (
            <div className="admin-mobile-filter-section">
              <h4>{t(`admin.filters.${filterType === 'task' ? 'points' : 'cost'}`)}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    {t('admin.filters.min')}
                  </label>
                  <input
                    type="number"
                    value={filterType === 'task' ? (filters.pointsMin || '') : (filters.costMin || '')}
                    onChange={(e) => {
                      if (filterType === 'task' && onPointsMinChange) {
                        onPointsMinChange(e.target.value);
                      } else if (filterType === 'reward' && onCostMinChange) {
                        onCostMinChange(e.target.value);
                      }
                    }}
                    placeholder={t('admin.filters.minPlaceholder')}
                    style={{ width: '100%', padding: '0.5rem' }}
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    {t('admin.filters.max')}
                  </label>
                  <input
                    type="number"
                    value={filterType === 'task' ? (filters.pointsMax || '') : (filters.costMax || '')}
                    onChange={(e) => {
                      if (filterType === 'task' && onPointsMaxChange) {
                        onPointsMaxChange(e.target.value);
                      } else if (filterType === 'reward' && onCostMaxChange) {
                        onCostMaxChange(e.target.value);
                      }
                    }}
                    placeholder={t('admin.filters.maxPlaceholder')}
                    style={{ width: '100%', padding: '0.5rem' }}
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="admin-mobile-filter-footer">
          <button
            type="button"
            className="admin-action-button secondary"
            onClick={onClearAll}
            disabled={activeFilterCount === 0}
          >
            {t('admin.filters.clearAll')}
          </button>
          <button
            type="button"
            className="admin-action-button"
            onClick={onClose}
          >
            {t('admin.filters.applyFilters')}
          </button>
        </div>
      </div>
    </div>
  );
};

type TaskSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'multi';
  tasks: AdminTaskTemplate[];
  selectedTaskIds: string[];
  onApply: (selectedIds: string[]) => void;
  excludeTaskId?: string;
};

const TaskSelectionModal = ({
  isOpen,
  onClose,
  mode,
  tasks,
  selectedTaskIds,
  onApply,
  excludeTaskId,
}: TaskSelectionModalProps) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedTaskIds);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      // Reset temp selection when modal opens
      setTempSelectedIds(selectedTaskIds);
      setSearchTerm('');
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose, selectedTaskIds]);

  // Filter and sort tasks - MUST be before early return (React Hooks rule)
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      // Exclude the current task being edited
      if (excludeTaskId && task.id === excludeTaskId) {
        return false;
      }
      // Exclude tasks that have circular dependency (they already have this task as prerequisite)
      if (excludeTaskId) {
        if (task.prerequisite_task_id === excludeTaskId) {
          return false;
        }
        if (task.prerequisite_task_ids?.includes(excludeTaskId)) {
          return false;
        }
      }
      // Filter by search term (title or type)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const searchUpper = searchTerm.toUpperCase();
        const searchNormalized = searchUpper.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
        
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        
        // Check if search term matches task type
        // Support: "quiz", "QUIZ", "visit_location", "VISIT_LOCATION", "VISIT LOCATION"
        const taskTypeUpper = task.type.toUpperCase();
        const taskTypeNormalized = taskTypeUpper.replace(/_/g, ' ');
        const typeMatch = 
          task.type.toLowerCase().includes(searchLower) ||
          taskTypeUpper.includes(searchUpper) ||
          taskTypeNormalized.includes(searchNormalized);
        
        return titleMatch || typeMatch;
      }
      return true;
    });

    // Sort by created_at DESC (newest first), then alphabetically by title
    filtered.sort((a, b) => {
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (bCreated !== aCreated) {
        return bCreated - aCreated; // DESC
      }
      return a.title.localeCompare(b.title);
    });

    return filtered;
  }, [tasks, excludeTaskId, searchTerm]);

  // Early return AFTER all hooks
  if (!isOpen) {
    return null;
  }

  const handleTaskToggle = (taskId: string) => {
    if (mode === 'single') {
      setTempSelectedIds(tempSelectedIds.includes(taskId) ? [] : [taskId]);
    } else {
      setTempSelectedIds(
        tempSelectedIds.includes(taskId)
          ? tempSelectedIds.filter((id) => id !== taskId)
          : [...tempSelectedIds, taskId]
      );
    }
  };

  const handleClear = () => {
    setTempSelectedIds([]);
  };

  const handleApply = () => {
    onApply(tempSelectedIds);
    onClose();
  };

  const selectedCount = tempSelectedIds.length;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="task-selection-title">
      <div ref={modalRef} className="admin-mobile-filter-modal">
        <div className="admin-mobile-filter-header">
          <h3 id="task-selection-title">
            {mode === 'single' ? t('admin.task.prerequisites.modal.title') : t('admin.task.prerequisites.modal.titleMulti')}
            {selectedCount > 0 && mode === 'multi' && ` (${selectedCount})`}
          </h3>
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
          {/* Search Input */}
          <div className="admin-mobile-filter-section">
            <h4>{mode === 'single' ? t('admin.task.prerequisites.modal.selectTask') : t('admin.task.prerequisites.modal.selectTasks')}</h4>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.task.prerequisites.modal.searchPlaceholder')}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius)',
                marginBottom: 'var(--spacing-sm)',
              }}
            />
          </div>

          {/* Task List */}
          <div className="admin-mobile-filter-section">
            <h4>{t('admin.task.prerequisites.modal.title')}</h4>
            <div className="admin-mobile-filter-options">
              {filteredAndSortedTasks.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                  {t('admin.task.prerequisites.modal.noTasksFound')}
                </div>
              ) : (
                filteredAndSortedTasks.map((task) => {
                  const isSelected = tempSelectedIds.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      className={`admin-mobile-filter-option ${isSelected ? 'active' : ''}`}
                      onClick={() => handleTaskToggle(task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ flexShrink: 0 }}>
                        <TaskTypeBadge type={task.type} thumbnailUrl={(task as any).thumbnail_url} />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left' }}>{task.title}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="admin-mobile-filter-footer">
          <button
            type="button"
            className="admin-action-button secondary"
            onClick={handleClear}
            disabled={selectedCount === 0}
          >
            {t('admin.task.prerequisites.modal.clear')}
          </button>
          <button
            type="button"
            className="admin-action-button"
            onClick={handleApply}
          >
            {t('admin.task.prerequisites.modal.apply')}
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

const createEmptySurveyQuestion = (order = 1): SurveyQuestionDraft => {
  return {
    id: generateId(),
    question: '',
    type: 'single_choice',
    options: ['', ''],
    required: true,
    order,
  };
};

const reindexSurveyQuestions = (questions: SurveyQuestionDraft[]): SurveyQuestionDraft[] =>
  questions.map((question, index) => ({
    ...question,
    order: index + 1,
  }));

const ROLE_OPTIONS = USER_ROLES.map((role) => ({ value: role, label: role }));
const USER_TYPE_OPTIONS = USER_TYPES.map((type) => ({ value: type, label: type }));
const HOTEL_OPTIONS = HOTEL_IDS.map((id) => ({ value: id, label: id }));
// Combined role options for rewards (roles + user types)
const REWARD_ROLE_OPTIONS = [
  ...USER_ROLES.map((role) => ({ value: role, label: role })),
  ...USER_TYPES.map((type) => ({ value: type, label: type })),
];
const formatRewardType = (type: RewardType) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const REWARD_TYPE_OPTIONS = REWARD_TYPES.map((type) => ({
  value: type,
  label: formatRewardType(type),
}));

const defaultTaskForm = (type: 'video' | 'quiz' | 'article_quiz' | 'survey' | 'qr' | 'photo' | 'visit_location'): TaskFormState => ({
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
  locationId: '',
  active: true,
  recurrence: 'once',
  article_url: type === 'article_quiz' ? '' : '',
  article_content: type === 'article_quiz' ? '' : '',
  articleSource: 'url',
  surveyQuestions: type === 'survey' ? [createEmptySurveyQuestion(1)] : [],
  surveyType: 'mixed',
  target_latitude: type === 'visit_location' ? '' : undefined,
  target_longitude: type === 'visit_location' ? '' : undefined,
  target_address: type === 'visit_location' ? '' : undefined,
  prerequisite_task_id: undefined,
  prerequisite_task_count: undefined,
  prerequisite_task_ids: undefined,
  category: undefined,
  difficulty: undefined,
  time_required: undefined,
  location_tool: undefined,
  allowed_teams: [],
  allowed_contests: [],
  thumbnailFile: null,
  thumbnailUrl: null,
});

const defaultRewardForm = (type: RewardType): RewardFormState => ({
  title: '',
  description: '',
  type,
  pointsCost: 0,
  voucherCode: '',
  externalApiId: '',
  locationId: '',
  active: true,
  recurrence: 'once',
  reward_art: undefined,
  kategorie: undefined,
  moegliche_punkte: undefined,
  allowed_teams: [],
  allowed_contests: [],
  thumbnailFile: null,
  thumbnailUrl: null,
});

const defaultLocationForm = (): LocationFormState => ({
  name: '',
  description: '',
  mode: 'online',
  address: '',
  latitude: '',
  longitude: '',
  active: true,
  category: '',
  categoryDescription: '',
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

const normalizeSurveyQuestions = (payload: unknown): SurveyQuestionDraft[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.map((q, index) => ({
      id: q.id || generateId(),
      question: q.question || '',
      type: q.type || 'single_choice',
      options: q.options || (q.type === 'single_choice' || q.type === 'multiple_choice' ? ['', ''] : undefined),
      required: q.required !== undefined ? q.required : true,
      minRating: q.minRating || 1,
      maxRating: q.maxRating || 5,
      order: q.order || index + 1,
    }));
  }
  return [createEmptySurveyQuestion()];
};

const buildSurveyPayload = (questions: SurveyQuestionDraft[]) => {
  if (!questions.length) {
    throw new Error('Add at least one survey question for a survey task.');
  }

  return questions.map((question) => {
    const q = {
      id: question.id,
      question: question.question.trim(),
      type: question.type,
      required: question.required,
    };

    if (question.type === 'single_choice' || question.type === 'multiple_choice') {
      if (!question.options || question.options.length < 2) {
        throw new Error(`Question "${question.question || 'Untitled'}" must have at least 2 options.`);
      }
      const validOptions = question.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        throw new Error(`Question "${question.question || 'Untitled'}" must have at least 2 non-empty options.`);
      }
      return { ...q, options: validOptions };
    }

    if (question.type === 'rating') {
      return {
        ...q,
        minRating: question.minRating || 1,
        maxRating: question.maxRating || 5,
      };
    }

    return q;
  });
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
  t,
}: ValidateTaskFormParams & { t: (key: string, options?: any) => string }): ValidationResult => {
  if (!taskSource && !isEditing) {
    return { isValid: false, message: 'Choose how you want to start creating your task.' };
  }

  if (!isEditing && taskSource === 'existing' && !selectedExistingTaskId) {
    return { isValid: false, message: 'Select an existing task to continue.' };
  }

  if (!taskForm.title || !taskForm.title.trim()) {
    return { isValid: false, message: 'Title is required.' };
  }

  if (!taskForm.description || !taskForm.description.trim()) {
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
      if (!taskForm.video_url || !taskForm.video_url.trim()) {
        return { isValid: false, message: 'Video URL is required for video tasks.' };
      }
    } else {
      // For upload source: require videoFile (new upload) OR existing video_url (already uploaded)
      // If video_url exists (even if it's a local upload URL), the video is already uploaded and valid
      const hasVideoUrl = !!(taskForm.video_url && taskForm.video_url.trim());
      const hasVideoFile = !!taskForm.videoFile;
      // Accept if either a new file is uploaded OR an existing video_url is present
      if (!hasVideoFile && !hasVideoUrl) {
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

  if (taskForm.type === 'survey') {
    try {
      buildSurveyPayload(taskForm.surveyQuestions);
    } catch (error: any) {
      return {
        isValid: false,
        message: error?.message ?? 'Check the survey questions for missing details.',
      };
    }
  }

    // QR code is optional - will be auto-generated if not provided
    // if (taskForm.type === 'qr' && !taskForm.qr_code.trim()) {
    //   return { isValid: false, message: 'Enter the QR code value for QR tasks.' };
    // }

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

  // Validate prerequisites
  if (taskForm.prerequisite_task_id) {
    // Type 1 prerequisite is set - no additional validation needed (existence will be checked on backend)
  }
  
  if (taskForm.prerequisite_task_ids) {
    const taskIdsArray = Array.isArray(taskForm.prerequisite_task_ids) 
      ? taskForm.prerequisite_task_ids 
      : [];
    
    if (taskIdsArray.length === 0) {
      return { isValid: false, message: t('admin.task.prerequisites.validation.idsEmpty') };
    }
    
    if (taskForm.prerequisite_task_count !== undefined && taskForm.prerequisite_task_count !== null) {
      if (!Number.isInteger(taskForm.prerequisite_task_count) || taskForm.prerequisite_task_count < 1) {
        return { isValid: false, message: t('admin.task.prerequisites.validation.countInvalid') };
      }
      if (taskForm.prerequisite_task_count > taskIdsArray.length) {
        return { isValid: false, message: t('admin.task.prerequisites.validation.countTooLarge', { count: taskForm.prerequisite_task_count, total: taskIdsArray.length }) };
      }
    } else {
      return { isValid: false, message: t('admin.task.prerequisites.validation.countRequired') };
    }
  } else if (taskForm.prerequisite_task_count !== undefined && taskForm.prerequisite_task_count !== null) {
    return { isValid: false, message: t('admin.task.prerequisites.validation.idsRequired') };
  }

  if (!taskForm.locationId || !taskForm.locationId.trim()) {
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
              {t('admin.filters.clearSelection')}
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
          {t('admin.task.quiz.addQuestion')}
        </button>
      </div>
    );
  }

  return (
    <div className="admin-quiz-builder">
      <div className="admin-quiz-header">
        <h3>{t('admin.task.quiz.title')}</h3>
        <p>
          {t('admin.task.quiz.description')}
        </p>
      </div>

      <div className="admin-quiz-list">
        {questions.map((question, questionIndex) => {
          const answerGroupName = `correct-answer-${question.id}`;
          return (
            <div key={question.id} className="admin-quiz-question">
              <div className="admin-quiz-question-header">
                <h4>
                  {t('admin.task.quiz.question', { number: question.order })}
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
                      {t('admin.task.quiz.remove')}
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
                      placeholder={t('admin.task.quiz.answerOption', { number: answerIndex + 1 })}
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
                        {t('admin.task.quiz.remove')}
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
                {t('admin.task.quiz.addAnswer')}
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="admin-quiz-add-question" onClick={addQuestion}>
        {t('admin.task.quiz.addQuestion')}
      </button>
    </div>
  );
};

type SurveyBuilderProps = {
  questions: SurveyQuestionDraft[];
  onChange: (questions: SurveyQuestionDraft[]) => void;
};

const SurveyBuilder = ({ questions, onChange }: SurveyBuilderProps) => {
  const { t } = useTranslation();

  const updateQuestions = (
    updater: (current: SurveyQuestionDraft[]) => SurveyQuestionDraft[]
  ): void => {
    const next = reindexSurveyQuestions(updater(questions));
    onChange(next);
  };

  const handleQuestionChange = (questionId: string, field: keyof SurveyQuestionDraft, value: any) => {
    updateQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, [field]: value } : question
      )
    );
  };

  const addQuestion = () => {
    updateQuestions((current) => [...current, createEmptySurveyQuestion(current.length + 1)]);
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

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    updateQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || !question.options) return question;
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        return { ...question, options: newOptions };
      })
    );
  };

  const addOption = (questionId: string) => {
    updateQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          options: [...(question.options || []), ''],
        };
      })
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    updateQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || !question.options) return question;
        if (question.options.length <= 2) return question;
        const newOptions = question.options.filter((_, idx) => idx !== optionIndex);
        return { ...question, options: newOptions };
      })
    );
  };

  const moveOption = (questionId: string, optionIndex: number, offset: number) => {
    updateQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || !question.options) return question;
        return { ...question, options: moveItem(question.options, optionIndex, offset) };
      })
    );
  };

  if (!questions.length) {
    return (
      <div className="admin-quiz-builder">
        <p className="admin-quiz-empty">{t('admin.task.survey.empty')}</p>
        <button type="button" className="admin-quiz-add-question" onClick={addQuestion}>
          {t('admin.task.survey.addQuestion')}
        </button>
      </div>
    );
  }

  return (
    <div className="admin-quiz-builder">
      <div className="admin-quiz-header">
        <h3>{t('admin.task.survey.title')}</h3>
        <p>{t('admin.task.survey.description')}</p>
      </div>

      <div className="admin-quiz-list">
        {questions.map((question, questionIndex) => (
          <div key={question.id} className="admin-quiz-question">
            <div className="admin-quiz-question-header">
              <h4>
                {t('admin.task.survey.questionNumber', { number: question.order })}
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
                    {t('admin.task.survey.remove')}
                  </button>
                </span>
              </h4>
            </div>

            <label className="admin-field">
              <span>{t('admin.task.survey.questionText')}</span>
              <input
                type="text"
                value={question.question}
                onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                placeholder={t('admin.task.survey.questionPlaceholder')}
              />
            </label>

            <div className="admin-field">
              <span>{t('admin.task.survey.questionType')}</span>
              <select
                value={question.type}
                onChange={(e) => {
                  const newType = e.target.value as SurveyQuestionDraft['type'];
                  const updates: Partial<SurveyQuestionDraft> = { type: newType };
                  if (newType === 'single_choice' || newType === 'multiple_choice') {
                    updates.options = question.options && question.options.length >= 2 
                      ? question.options 
                      : ['', ''];
                  } else if (newType === 'rating') {
                    updates.minRating = 1;
                    updates.maxRating = 5;
                    updates.options = undefined;
                  } else {
                    updates.options = undefined;
                  }
                  updateQuestions((current) =>
                    current.map((q) =>
                      q.id === question.id ? { ...q, ...updates } : q
                    )
                  );
                }}
              >
                <option value="single_choice">{t('admin.task.survey.typeSingleChoice')}</option>
                <option value="multiple_choice">{t('admin.task.survey.typeMultipleChoice')}</option>
                <option value="text">{t('admin.task.survey.typeText')}</option>
                <option value="rating">{t('admin.task.survey.typeRating')}</option>
              </select>
            </div>

            {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
              <div className="admin-quiz-answers">
                <label className="admin-field">
                  <span>{t('admin.task.survey.options')}</span>
                </label>
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="admin-quiz-answer-row">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(question.id, optionIndex, e.target.value)}
                      placeholder={t('admin.task.survey.optionPlaceholder', { number: optionIndex + 1 })}
                    />
                    <div className="admin-quiz-answer-controls">
                      <button
                        type="button"
                        onClick={() => moveOption(question.id, optionIndex, -1)}
                        disabled={optionIndex === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOption(question.id, optionIndex, 1)}
                        disabled={optionIndex === (question.options?.length || 0) - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOption(question.id, optionIndex)}
                        disabled={(question.options?.length || 0) <= 2}
                      >
                        {t('admin.task.survey.remove')}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="admin-quiz-add-answer"
                  onClick={() => addOption(question.id)}
                >
                  {t('admin.task.survey.addOption')}
                </button>
              </div>
            )}

            {question.type === 'rating' && (
              <div className="admin-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  <span>{t('admin.task.survey.minRating')}</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={question.minRating ?? 1}
                    onChange={(e) =>
                      handleQuestionChange(question.id, 'minRating', parseInt(e.target.value) || 1)
                    }
                  />
                </label>
                <label>
                  <span>{t('admin.task.survey.maxRating')}</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={question.maxRating ?? 5}
                    onChange={(e) =>
                      handleQuestionChange(question.id, 'maxRating', parseInt(e.target.value) || 5)
                    }
                  />
                </label>
              </div>
            )}

            <label className="admin-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => handleQuestionChange(question.id, 'required', e.target.checked)}
                style={COMPACT_TOGGLE_STYLE}
              />
              <span>{t('admin.task.survey.required')}</span>
            </label>
          </div>
        ))}
      </div>

      <button type="button" className="admin-quiz-add-question" onClick={addQuestion}>
        {t('admin.task.survey.addQuestion')}
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
            {t('common.actions.cancel', 'Abbrechen')}
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
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const showToast = useToastStore((s) => s.showToast);
  const isAdmin = user?.role === 'administrator';
  const [mode, setMode] = useState<AdminMode>(null);

  // Get pending photo tasks count for badge
  const { data: pendingPhotoTasks = [] } = useQuery(
    ['pendingPhotoTasks'],
    () => api.getPendingPhotoTasks(),
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: isAdmin || user?.role === 'rezeption',
    }
  );

  // Listen for WebSocket photo task updates
  React.useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'photo:task:update') {
        queryClient.invalidateQueries(['pendingPhotoTasks']);
      }
    };

    window.addEventListener('data:update', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('data:update', handleUpdate as EventListener);
    };
  }, [queryClient]);

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
  const [showTaskQrModal, setShowTaskQrModal] = useState(false);
  const [taskQrCode, setTaskQrCode] = useState<string | null>(null);
  const [loadingTaskQr, setLoadingTaskQr] = useState(false);
  const [isPrerequisiteModalOpen, setIsPrerequisiteModalOpen] = useState(false);
  const [prerequisiteModalMode, setPrerequisiteModalMode] = useState<'single' | 'multi'>('single');
  // taskManagementMessage is now handled by taskBulkOperations hook
  const [includeInactiveTasks, setIncludeInactiveTasks] = useState(false);
  const [taskConfirm, setTaskConfirm] = useState<ConfirmDialogState>(defaultConfirmDialogState);
  const [taskFilterLocation, setTaskFilterLocation] = useState<string | null>(null);
  const [taskFilterStatus, setTaskFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [taskFilterRecurrence, setTaskFilterRecurrence] = useState<string | null>(null);
  const [taskFilterType, setTaskFilterType] = useState<string | null>(null);
  const [taskFilterTitle, setTaskFilterTitle] = useState<string>('');
  const [taskFilterPointsMin, setTaskFilterPointsMin] = useState<string>('');
  const [taskFilterPointsMax, setTaskFilterPointsMax] = useState<string>('');
  const [taskFilterDropdown, setTaskFilterDropdown] = useState<'location' | 'status' | 'recurrence' | 'type' | 'title' | 'points' | null>(null);
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
  const [rewardConfirm, setRewardConfirm] = useState<ConfirmDialogState>(defaultConfirmDialogState);
  const [rewardFilterLocation, setRewardFilterLocation] = useState<string | null>(null);
  const [rewardFilterStatus, setRewardFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [rewardFilterRecurrence, setRewardFilterRecurrence] = useState<string | null>(null);
  const [rewardFilterType, setRewardFilterType] = useState<string | null>(null);
  const [rewardFilterTitle, setRewardFilterTitle] = useState<string>('');
  const [rewardFilterCostMin, setRewardFilterCostMin] = useState<string>('');

  // Team management state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamManagementMessage, setTeamManagementMessage] = useState<
    { type: 'error' | 'success'; text: string } | null
  >(null);
  const [teamRegistrationEnabled, setTeamRegistrationEnabled] = useState<boolean>(false);
  const [teamRegistrationQrCode, setTeamRegistrationQrCode] = useState<string | null>(null);
  const [teamJoinQrCode, setTeamJoinQrCode] = useState<string | null>(null);
  const [includeInactiveTeams, setIncludeInactiveTeams] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [teamConfirm, setTeamConfirm] = useState<ConfirmDialogState>(defaultConfirmDialogState);
  const [teamFilterStatus, setTeamFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [teamFilterName, setTeamFilterName] = useState<string>('');
  const [teamFilterCreator, setTeamFilterCreator] = useState<string | null>(null);
  const [teamFilterDropdown, setTeamFilterDropdown] = useState<'status' | 'name' | 'creator' | null>(null);
  const [teamFilterDropdownPosition, setTeamFilterDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const teamFilterDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileTeamFilterOpen, setIsMobileTeamFilterOpen] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [showTeamAddUsersModal, setShowTeamAddUsersModal] = useState(false);
  const [showTeamRemoveUsersModal, setShowTeamRemoveUsersModal] = useState(false);
  const [showTeamJoinQrModal, setShowTeamJoinQrModal] = useState(false);
  const [showTeamRegistrationQrModal, setShowTeamRegistrationQrModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamJoinQrToken, setTeamJoinQrToken] = useState<string | null>(null);
  const [teamRegistrationQrData, setTeamRegistrationQrData] = useState<{ qrToken: string; registrationUrl: string } | null>(null);

  // Contest management state
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [contestManagementMessage, setContestManagementMessage] = useState<
    { type: 'error' | 'success'; text: string } | null
  >(null);
  const [contestRegistrationEnabled, setContestRegistrationEnabled] = useState<boolean>(false);
  const [contestRegistrationQrCode, setContestRegistrationQrCode] = useState<string | null>(null);
  const [contestJoinQrCode, setContestJoinQrCode] = useState<string | null>(null);
  const [includeInactiveContests, setIncludeInactiveContests] = useState(false);
  const [selectedContestIds, setSelectedContestIds] = useState<string[]>([]);
  const [contestConfirm, setContestConfirm] = useState<ConfirmDialogState>(defaultConfirmDialogState);
  const [contestFilterStatus, setContestFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [contestFilterName, setContestFilterName] = useState<string>('');
  const [contestFilterCreator, setContestFilterCreator] = useState<string | null>(null);
  const [contestFilterEndDate, setContestFilterEndDate] = useState<string>('');
  const [contestFilterDropdown, setContestFilterDropdown] = useState<'status' | 'name' | 'creator' | 'endDate' | null>(null);
  const [contestFilterDropdownPosition, setContestFilterDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const contestFilterDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileContestFilterOpen, setIsMobileContestFilterOpen] = useState(false);
  const [isCreatingContest, setIsCreatingContest] = useState(false);
  const [showContestAddUsersModal, setShowContestAddUsersModal] = useState(false);
  const [showContestRemoveUsersModal, setShowContestRemoveUsersModal] = useState(false);
  const [showContestJoinQrModal, setShowContestJoinQrModal] = useState(false);
  const [showContestRegistrationQrModal, setShowContestRegistrationQrModal] = useState(false);
  const [contestParticipants, setContestParticipants] = useState<any[]>([]);
  const [contestJoinQrToken, setContestJoinQrToken] = useState<string | null>(null);
  const [contestRegistrationQrData, setContestRegistrationQrData] = useState<{ qrToken: string; registrationUrl: string } | null>(null);
  const [rewardFilterCostMax, setRewardFilterCostMax] = useState<string>('');
  const [rewardFilterDropdown, setRewardFilterDropdown] = useState<'location' | 'status' | 'recurrence' | 'type' | 'title' | 'cost' | null>(null);
  const [rewardFilterDropdownPosition, setRewardFilterDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  // Parameter management state
  const [taskParameters, setTaskParameters] = useState<any[]>([]);
  const [rewardParameters, setRewardParameters] = useState<any[]>([]);
  const [parameterLoading, setParameterLoading] = useState(false);
  const [parameterMessage, setParameterMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [editingParameter, setEditingParameter] = useState<{ id: string; type: 'task' | 'reward'; parameterType: string; value: string; displayOrder: number; weight?: number } | null>(null);
  const [newParameter, setNewParameter] = useState<{ type: 'task' | 'reward'; parameterType: string; value: string; displayOrder: number; weight?: number } | null>(null);
  const [pointsCalculationFactor, setPointsCalculationFactor] = useState<number>(1.0);
  const [editingFactorValue, setEditingFactorValue] = useState<string>('1.0');
  const [isEditingFactor, setIsEditingFactor] = useState(false);
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
      // Error already handled by setForestStatsError
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
        // Error handled by clearing poll interval
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
      // Error handled by validation confirm state
      setValidationConfirm({
        ...defaultConfirmDialogState,
        visible: true,
        title: t('admin.forestStats.validation.error'),
        description: error?.message || t('admin.forestStats.validation.startFailed'),
        confirmLabel: t('common.actions.close', 'Schließen'),
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

  const taskValidation = useMemo(
    () => validateTaskFormState({ taskSource, selectedExistingTaskId, taskForm, isEditing: isEditingTask, t }),
    [taskSource, selectedExistingTaskId, taskForm, isEditingTask, t]
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
    return list.map((task) => {
      // Zielgruppe is always null - tasks are visible to all users by default
      
      return {
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
        allowed_teams: normalizeEnumArray((task as any).allowed_teams) as string[],
        allowed_contests: normalizeEnumArray((task as any).allowed_contests) as string[],
        allowed_user_types: normalizeEnumArray(task.allowed_user_types) as UserType[],
        allowed_hotel_ids: normalizeEnumArray(task.allowed_hotel_ids) as HotelId[],
        zielgruppe: null, // Tasks are visible to all users by default
        location_id: (task as any).location_id ?? (task as any).location?.id ?? null,
        location: (task as any).location ?? null,
        active: task.active ?? true,
        recurrence: ((task as any).recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
        thumbnail_url: (task as any).thumbnail_url ?? null,
      };
    });
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
    
    if (taskFilterTitle.trim()) {
      const searchTerm = taskFilterTitle.toLowerCase().trim();
      filtered = filtered.filter((task) => 
        task.title?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (taskFilterPointsMin.trim() || taskFilterPointsMax.trim()) {
      filtered = filtered.filter((task) => {
        const points = task.points ?? 0;
        const min = taskFilterPointsMin.trim() ? Number.parseFloat(taskFilterPointsMin) : -Infinity;
        const max = taskFilterPointsMax.trim() ? Number.parseFloat(taskFilterPointsMax) : Infinity;
        // Handle NaN cases
        if (!Number.isFinite(min) && !Number.isFinite(max)) return true;
        if (!Number.isFinite(min)) return points <= max;
        if (!Number.isFinite(max)) return points >= min;
        return points >= min && points <= max;
      });
    }
    
    return filtered;
  }, [existingTemplates, taskFilterLocation, taskFilterStatus, taskFilterRecurrence, taskFilterType, taskFilterTitle, taskFilterPointsMin, taskFilterPointsMax]);

  // Use selection hook for tasks - must be after filteredTasks
  const taskSelection = useSelection(filteredTasks || []);
  const allTasksSelected = taskSelection.allSelected;
  const hasTaskSelection = taskSelection.hasSelection;

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

  // Teams and Contests queries - must be defined before use
  // Load teams and contests for both management and form selection
  const {
    data: adminTeams,
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useQuery<any[]>(
    ['adminTeams', includeInactiveTeams],
    () => api.getAllTeams({ includeInactive: includeInactiveTeams }),
    {
      enabled: isAdmin && (mode === 'teamManage' || mode === 'task' || mode === 'reward'),
    }
  );

  const {
    data: adminContests,
    isLoading: contestsLoading,
    error: contestsError,
    refetch: refetchContests,
  } = useQuery<any[]>(
    ['adminContests', includeInactiveContests],
    () => api.getAllContests({ includeInactive: includeInactiveContests }),
    {
      enabled: isAdmin && (mode === 'contestManage' || mode === 'task' || mode === 'reward'),
    }
  );

  // Team members query
  const {
    data: teamMembersData,
    isLoading: teamMembersLoading,
    refetch: refetchTeamMembers,
  } = useQuery<any[]>(
    ['teamMembers', editingTeamId],
    () => api.getTeamMembers(editingTeamId!),
    {
      enabled: isAdmin && !!editingTeamId,
    }
  );

  // Contest participants query
  const {
    data: contestParticipantsData,
    isLoading: contestParticipantsLoading,
    refetch: refetchContestParticipants,
  } = useQuery<any[]>(
    ['contestParticipants', editingContestId],
    () => api.getContestParticipants(editingContestId!),
    {
      enabled: isAdmin && !!editingContestId,
    }
  );

  useEffect(() => {
    if (teamMembersData) {
      setTeamMembers(teamMembersData);
    }
  }, [teamMembersData]);

  useEffect(() => {
    if (contestParticipantsData) {
      setContestParticipants(contestParticipantsData);
    }
  }, [contestParticipantsData]);

  // Teams filter logic - inline like tasks
  const teamsList = adminTeams ?? [];
  const filteredTeams = useMemo(() => {
    let filtered = teamsList;
    
    if (teamFilterStatus) {
      filtered = filtered.filter((team) => 
        teamFilterStatus === 'active' ? team.active : !team.active
      );
    }
    
    if (teamFilterName.trim()) {
      const searchTerm = teamFilterName.toLowerCase().trim();
      filtered = filtered.filter((team) => 
        team.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (teamFilterCreator) {
      filtered = filtered.filter((team) => 
        team.creator_name === teamFilterCreator
      );
    }
    
    // Sort by created_at DESC (newest first), then alphabetically by name
    filtered.sort((a, b) => {
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (bCreated !== aCreated) {
        return bCreated - aCreated; // DESC
      }
      return (a.name || '').localeCompare(b.name || '');
    });
    
    return filtered;
  }, [teamsList, teamFilterStatus, teamFilterName, teamFilterCreator]);

  const teamFilterOptions = useMemo(() => {
    const creators = new Map<string, string>();
    
    teamsList.forEach((team) => {
      if (team.creator_name) {
        creators.set(team.creator_name, team.creator_name);
      }
    });
    
    return {
      creators: Array.from(creators.entries()).map(([name, value]) => ({ id: name, name: value })),
      statuses: ['active', 'inactive'] as ('active' | 'inactive')[],
    };
  }, [teamsList]);

  // Contests filter logic - inline like tasks
  const contestsList = adminContests ?? [];
  const filteredContests = useMemo(() => {
    let filtered = contestsList;
    
    if (contestFilterStatus) {
      filtered = filtered.filter((contest) => 
        contestFilterStatus === 'active' ? contest.active : !contest.active
      );
    }
    
    if (contestFilterName.trim()) {
      const searchTerm = contestFilterName.toLowerCase().trim();
      filtered = filtered.filter((contest) => 
        contest.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (contestFilterCreator) {
      filtered = filtered.filter((contest) => 
        contest.creator_name === contestFilterCreator
      );
    }
    
    if (contestFilterEndDate.trim()) {
      const filterDate = new Date(contestFilterEndDate);
      filtered = filtered.filter((contest) => {
        const contestEndDate = new Date(contest.end_date);
        return contestEndDate.toDateString() === filterDate.toDateString();
      });
    }
    
    // Sort by created_at DESC (newest first), then alphabetically by name
    filtered.sort((a, b) => {
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (bCreated !== aCreated) {
        return bCreated - aCreated; // DESC
      }
      return (a.name || '').localeCompare(b.name || '');
    });
    
    return filtered;
  }, [contestsList, contestFilterStatus, contestFilterName, contestFilterCreator, contestFilterEndDate]);

  const contestFilterOptions = useMemo(() => {
    const creators = new Map<string, string>();
    
    contestsList.forEach((contest) => {
      if (contest.creator_name) {
        creators.set(contest.creator_name, contest.creator_name);
      }
    });
    
    return {
      creators: Array.from(creators.entries()).map(([name, value]) => ({ id: name, name: value })),
      statuses: ['active', 'inactive'] as ('active' | 'inactive')[],
    };
  }, [contestsList]);

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
    return rewardTemplates.map((template) => {
      // Zielgruppe is always null - rewards are visible to all users by default
      
      return {
        ...template,
        allowed_teams: normalizeEnumArray((template as any).allowed_teams) as string[],
        allowed_contests: normalizeEnumArray((template as any).allowed_contests) as string[],
        allowed_user_types: normalizeEnumArray(template.allowed_user_types),
        allowed_hotel_ids: normalizeEnumArray(template.allowed_hotel_ids),
        zielgruppe: null, // Rewards are visible to all users by default
        location_id: template.location_id ?? template.location?.id ?? null,
        location: template.location ?? null,
        active: template.active ?? true,
        recurrence: ((template as any).recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
      };
    });
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
    
    if (rewardFilterTitle.trim()) {
      const searchTerm = rewardFilterTitle.toLowerCase().trim();
      filtered = filtered.filter((reward) => 
        reward.title?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (rewardFilterCostMin.trim() || rewardFilterCostMax.trim()) {
      filtered = filtered.filter((reward) => {
        const cost = reward.points_cost ?? 0;
        const min = rewardFilterCostMin.trim() ? Number.parseFloat(rewardFilterCostMin) : -Infinity;
        const max = rewardFilterCostMax.trim() ? Number.parseFloat(rewardFilterCostMax) : Infinity;
        // Handle NaN cases
        if (!Number.isFinite(min) && !Number.isFinite(max)) return true;
        if (!Number.isFinite(min)) return cost <= max;
        if (!Number.isFinite(max)) return cost >= min;
        return cost >= min && cost <= max;
      });
    }
    
    return filtered;
  }, [normalizedRewardTemplates, rewardFilterLocation, rewardFilterStatus, rewardFilterRecurrence, rewardFilterType, rewardFilterTitle, rewardFilterCostMin, rewardFilterCostMax]);

  // Use selection hook for rewards - must be after filteredRewards
  const rewardSelection = useSelection(filteredRewards || []);
  const allRewardsSelected = rewardSelection.allSelected;
  const hasRewardSelection = rewardSelection.hasSelection;

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

  // Load parameters for dynamic dropdowns
  const {
    data: taskParametersData,
    isLoading: taskParametersLoading,
    refetch: refetchTaskParameters,
  } = useQuery<any[]>(
    ['taskParameters'],
    () => api.getTaskParameters(),
    {
      enabled: isAdmin && (mode === 'task' || mode === 'taskManage' || mode === 'parameterManage'),
    }
  );

  const {
    data: rewardParametersData,
    isLoading: rewardParametersLoading,
    refetch: refetchRewardParameters,
  } = useQuery<any[]>(
    ['rewardParameters'],
    () => api.getRewardParameters(),
    {
      enabled: isAdmin && (mode === 'reward' || mode === 'rewardManage' || mode === 'parameterManage'),
    }
  );


  // Group parameters by type
  const taskParametersByType = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    (taskParametersData || []).forEach((param) => {
      if (!grouped[param.parameter_type]) {
        grouped[param.parameter_type] = [];
      }
      grouped[param.parameter_type].push(param);
    });
    return grouped;
  }, [taskParametersData]);

  const rewardParametersByType = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    (rewardParametersData || []).forEach((param) => {
      if (!grouped[param.parameter_type]) {
        grouped[param.parameter_type] = [];
      }
      grouped[param.parameter_type].push(param);
    });
    return grouped;
  }, [rewardParametersData]);

  const locationsList = locationsData ?? [];
  const selectableLocations = useMemo(
    () => locationsList.filter((location) => !isDefaultLocationRecord(location)),
    [locationsList]
  );
  
  // Use selection hook for locations - must be after selectableLocations
  const locationSelection = useSelection(selectableLocations);
  const allLocationsSelected = locationSelection.allSelected;
  const hasLocationSelection = locationSelection.hasSelection;
  
  const locationOptions = useMemo(
    () =>
      locationsList.map((location) => ({
        value: location.id,
        label: `${location.name}${location.is_online ? ' (Online)' : ''}${
          location.active ? '' : ' (Inactive)'
        }`,
        details: location.is_online ? t('admin.location.onlineLocation') : location.address || t('admin.location.physicalLocation'),
        location,
      })),
    [locationsList, t]
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
    } else if (taskSource === 'video' || taskSource === 'quiz' || taskSource === 'article_quiz' || taskSource === 'survey' || taskSource === 'qr' || taskSource === 'photo' || taskSource === 'visit_location') {
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
      surveyQuestions: template.type === 'survey' ? ((template as any).survey_questions ?? []) : [],
      surveyType: template.type === 'survey' ? ((template as any).survey_type ?? 'mixed') : 'mixed',
      qr_code: template.qr_code ?? '',
      photo_required: template.type === 'photo',
      co2_savings_kg: template.co2_savings_kg ?? 0,
      locationId: template.location_id ?? template.location?.id ?? '',
      active: template.active ?? true,
      recurrence: ((template as any).recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
      article_url: (template as any).article_url ?? '',
      article_content: (template as any).article_content ?? '',
      articleSource: (template as any).article_url ? 'url' : 'content',
      target_latitude: template.type === 'visit_location' ? String((template as any).target_latitude ?? '') : undefined,
      target_longitude: template.type === 'visit_location' ? String((template as any).target_longitude ?? '') : undefined,
      target_address: template.type === 'visit_location' ? (template as any).target_address ?? '' : undefined,
      prerequisite_task_id: (template as any).prerequisite_task_id ?? undefined,
      prerequisite_task_count: (template as any).prerequisite_task_count ?? undefined,
      prerequisite_task_ids: (template as any).prerequisite_task_ids ?? undefined,
      category: (template as any).category ?? undefined,
      difficulty: (template as any).difficulty ?? undefined,
      time_required: (template as any).time_required ?? undefined,
      location_tool: (template as any).location_tool ?? undefined,
 // Event/Gruppe removed
      zielgruppe: undefined, // Tasks/Rewards are visible to all users by default
      allowed_teams: normalizeEnumArray((template as any).allowed_teams) as string[] || [],
      allowed_contests: normalizeEnumArray((template as any).allowed_contests) as string[] || [],
    });
  }, [taskSource, selectedExistingTaskId, existingTemplates, isEditingTask]);

  useEffect(() => {
    if (!isEditingTask || !editingTaskId) return;
    const task = existingTemplates.find((t) => t.id === editingTaskId);
    if (!task) return;
    // Determine if video_url is an uploaded video (starts with /uploads/ or contains /uploads/)
    const isUploadedVideo = task.video_url?.includes('/uploads/') || task.video_url?.startsWith('/uploads/');
    setTaskForm((prev) => ({
      title: task.title ?? '',
      description: task.description ?? '',
      type: task.type,
      points: task.points ?? 0,
      video_url: task.video_url ?? '',
      videoSource: isUploadedVideo ? 'upload' : 'url',
      videoFile: null,
      quizQuestions:
        (task.type === 'video' || task.type === 'quiz' || task.type === 'article_quiz')
          ? normalizeQuizQuestions(task.quiz_questions ?? [])
          : [],
      surveyQuestions: task.type === 'survey' ? ((task as any).survey_questions ?? []) : [],
      surveyType: task.type === 'survey' ? ((task as any).survey_type ?? 'mixed') : 'mixed',
      qr_code: task.qr_code ?? '',
      photo_required: task.type === 'photo',
      co2_savings_kg: task.co2_savings_kg ?? 0,
      locationId: task.location_id ?? task.location?.id ?? '',
      active: task.active ?? true,
      recurrence: (task.recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
      article_url: (task as any).article_url ?? '',
      article_content: (task as any).article_content ?? '',
      articleSource: (task as any).article_url ? 'url' : 'content',
      target_latitude: task.type === 'visit_location' ? String((task as any).target_latitude ?? '') : undefined,
      target_longitude: task.type === 'visit_location' ? String((task as any).target_longitude ?? '') : undefined,
      target_address: task.type === 'visit_location' ? (task as any).target_address ?? '' : undefined,
      prerequisite_task_id: (task as any).prerequisite_task_id ?? undefined,
      prerequisite_task_count: (task as any).prerequisite_task_count ?? undefined,
      prerequisite_task_ids: (task as any).prerequisite_task_ids ?? undefined,
      category: (task as any).category ?? undefined,
      difficulty: (task as any).difficulty ?? undefined,
      time_required: (task as any).time_required ?? undefined,
      location_tool: (task as any).location_tool ?? undefined,
 // Event/Gruppe removed
      zielgruppe: undefined, // Tasks are visible to all users by default
      allowed_teams: normalizeEnumArray((task as any).allowed_teams) as string[] || [],
      allowed_contests: normalizeEnumArray((task as any).allowed_contests) as string[] || [],
      thumbnailFile: prev.thumbnailFile, // Behalte bestehende Datei
      thumbnailUrl: task.thumbnail_url ?? prev.thumbnailUrl ?? null, // Verwende task.thumbnail_url wenn vorhanden, sonst behalte bestehenden Wert
    }));
  }, [isEditingTask, editingTaskId, existingTemplates]);

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
    if (mode === 'parameterManage') {
      void loadParameters();
    }
  }, [mode]);

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
      locationId: template.location_id ?? template.location?.id ?? '',
      active: template.active ?? true,
      recurrence: (template.recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
      zielgruppe: undefined, // Tasks/Rewards are visible to all users by default
      allowed_teams: normalizeEnumArray((template as any).allowed_teams) as string[] || [],
      allowed_contests: normalizeEnumArray((template as any).allowed_contests) as string[] || [],
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

      // Upload thumbnail if a new file was selected
      let thumbnailUrl: string | null = taskForm.thumbnailUrl ?? null;
      if (taskForm.thumbnailFile) {
        try {
          const uploadResult = await api.uploadTaskThumbnail(taskForm.thumbnailFile);
          thumbnailUrl = uploadResult.thumbnail_url;
        } catch (error: any) {
          setTaskMessage({ type: 'error', text: error?.message || 'Failed to upload thumbnail.' });
          return;
        }
      }
      // If thumbnailFile is null and thumbnailUrl is null, explicitly set to null to allow deletion
      if (!taskForm.thumbnailFile && !taskForm.thumbnailUrl) {
        thumbnailUrl = null;
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
          if (file) {
            // New file uploaded - upload it
            setIsUploadingVideo(true);
            try {
              const uploadResponse = await api.uploadTaskVideo(file);
              const uploadedUrl = uploadResponse?.video_url || uploadResponse?.url;
              if (!uploadedUrl || typeof uploadedUrl !== 'string') {
                throw new Error('Video upload failed.');
              }
              videoUrl = uploadedUrl;
              setTaskForm((prev) => ({ ...prev, video_url: uploadedUrl }));
            } catch (error: any) {
              throw error;
            } finally {
              setIsUploadingVideo(false);
            }
          } else {
            // No new file, but video_url exists (already uploaded) - use existing URL
            // videoUrl is already set from taskForm.video_url.trim() above
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
        if (taskForm.type === 'survey') {
          payload.survey_questions = buildSurveyPayload(taskForm.surveyQuestions);
          payload.survey_type = taskForm.surveyType;
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
        
        // Add prerequisite fields
        if (taskForm.prerequisite_task_id) {
          payload.prerequisite_task_id = taskForm.prerequisite_task_id;
        }
        if (taskForm.prerequisite_task_ids && taskForm.prerequisite_task_ids.length > 0) {
          payload.prerequisite_task_ids = taskForm.prerequisite_task_ids;
          payload.prerequisite_task_count = taskForm.prerequisite_task_count || taskForm.prerequisite_task_ids.length;
        }

        // Add metadata fields
        if (taskForm.category) {
          payload.category = taskForm.category;
        }
        if (taskForm.difficulty) {
          payload.difficulty = taskForm.difficulty;
        }
        if (taskForm.time_required) {
          payload.time_required = taskForm.time_required;
        }
        if (taskForm.location_tool) {
          payload.location_tool = taskForm.location_tool;
        }
        // Event/Gruppe removed - always set to null
        // Zielgruppe is always null - tasks are visible to all users by default
        payload.zielgruppe = null;
        
        // Add team/contest assignments
        payload.allowed_teams = (taskForm.allowed_teams && taskForm.allowed_teams.length > 0) ? taskForm.allowed_teams : null;
        payload.allowed_contests = (taskForm.allowed_contests && taskForm.allowed_contests.length > 0) ? taskForm.allowed_contests : null;
        console.log('[DEBUG] Update Task - Full payload:', JSON.stringify(payload, null, 2));
        
        // Add thumbnail_url (null if no thumbnail, to allow deletion)
        payload.thumbnail_url = thumbnailUrl;

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
        if (template.type === 'survey') {
          payload.survey_questions = buildSurveyPayload(taskForm.surveyQuestions);
          payload.survey_type = taskForm.surveyType;
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
        
        // Add prerequisite fields
        if (taskForm.prerequisite_task_id) {
          payload.prerequisite_task_id = taskForm.prerequisite_task_id;
        }
        if (taskForm.prerequisite_task_ids && taskForm.prerequisite_task_ids.length > 0) {
          payload.prerequisite_task_ids = taskForm.prerequisite_task_ids;
          payload.prerequisite_task_count = taskForm.prerequisite_task_count || taskForm.prerequisite_task_ids.length;
        }

        // Add metadata fields
        if (taskForm.category) {
          payload.category = taskForm.category;
        }
        if (taskForm.difficulty) {
          payload.difficulty = taskForm.difficulty;
        }
        if (taskForm.time_required) {
          payload.time_required = taskForm.time_required;
        }
        if (taskForm.location_tool) {
          payload.location_tool = taskForm.location_tool;
        }
        // Event/Gruppe removed - always set to null
        // Zielgruppe is always null - tasks are visible to all users by default
        payload.zielgruppe = null;
        
        // Add team/contest assignments
        payload.allowed_teams = (taskForm.allowed_teams && taskForm.allowed_teams.length > 0) ? taskForm.allowed_teams : null;
        payload.allowed_contests = (taskForm.allowed_contests && taskForm.allowed_contests.length > 0) ? taskForm.allowed_contests : null;
        
        // Add thumbnail_url
        payload.thumbnail_url = thumbnailUrl;

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
      if (taskSource === 'survey') {
        payload.survey_questions = buildSurveyPayload(taskForm.surveyQuestions);
        payload.survey_type = taskForm.surveyType;
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
      
      // Add prerequisite fields
      if (taskForm.prerequisite_task_id) {
        payload.prerequisite_task_id = taskForm.prerequisite_task_id;
      }
      if (taskForm.prerequisite_task_ids && taskForm.prerequisite_task_ids.length > 0) {
        payload.prerequisite_task_ids = taskForm.prerequisite_task_ids;
        payload.prerequisite_task_count = taskForm.prerequisite_task_count || taskForm.prerequisite_task_ids.length;
      }

      // Add metadata fields
      if (taskForm.category) {
        payload.category = taskForm.category;
      }
      if (taskForm.difficulty) {
        payload.difficulty = taskForm.difficulty;
      }
      if (taskForm.time_required) {
        payload.time_required = taskForm.time_required;
      }
      if (taskForm.location_tool) {
        payload.location_tool = taskForm.location_tool;
      }
      // Always include zielgruppe, even if undefined/null, so it can be cleared
      payload.zielgruppe = null; // Tasks are visible to all users by default
      
      // Add team/contest assignments
      payload.allowed_teams = (taskForm.allowed_teams && taskForm.allowed_teams.length > 0) ? taskForm.allowed_teams : null;
      payload.allowed_contests = (taskForm.allowed_contests && taskForm.allowed_contests.length > 0) ? taskForm.allowed_contests : null;
      console.log('[DEBUG] Create Task - Full payload:', JSON.stringify(payload, null, 2));
      
      // Add thumbnail_url
      payload.thumbnail_url = thumbnailUrl;

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

      // Upload thumbnail if a new file was selected
      let thumbnailUrl: string | null = rewardForm.thumbnailUrl ?? null;
      if (rewardForm.thumbnailFile) {
        try {
          const uploadResult = await api.uploadRewardThumbnail(rewardForm.thumbnailFile);
          thumbnailUrl = uploadResult.thumbnail_url;
        } catch (error: any) {
          setRewardMessage({ type: 'error', text: error?.message || 'Failed to upload thumbnail.' });
          return;
        }
      }
      // If thumbnailFile is null and thumbnailUrl is null, explicitly set to null to allow deletion
      if (!rewardForm.thumbnailFile && !rewardForm.thumbnailUrl) {
        thumbnailUrl = null;
      }

      const pointsCost = Number(rewardForm.pointsCost) || 0;

      const basePayload: any = {
        title: rewardForm.title,
        description: rewardForm.description,
        pointsCost,
        rewardType: rewardForm.type,
        zielgruppe: null, // Rewards are visible to all users by default
        active: Boolean(rewardForm.active),
        recurrence: rewardForm.recurrence,
      };
      basePayload.location_id = rewardForm.locationId;
      
      // Add team/contest assignments
      basePayload.allowed_teams = (rewardForm.allowed_teams && rewardForm.allowed_teams.length > 0) ? rewardForm.allowed_teams : null;
      basePayload.allowed_contests = (rewardForm.allowed_contests && rewardForm.allowed_contests.length > 0) ? rewardForm.allowed_contests : null;

      if (rewardForm.voucherCode.trim()) {
        basePayload.voucherCode = rewardForm.voucherCode.trim();
      }
      if (rewardForm.externalApiId.trim()) {
        basePayload.externalApiId = rewardForm.externalApiId.trim();
      }
      if (rewardForm.reward_art) {
        basePayload.reward_art = rewardForm.reward_art;
      }
      if (rewardForm.kategorie) {
        basePayload.kategorie = rewardForm.kategorie;
      }
      // Event/Gruppe removed - always set to null
      if (rewardForm.moegliche_punkte !== undefined && rewardForm.moegliche_punkte !== null) {
        basePayload.moegliche_punkte = Number(rewardForm.moegliche_punkte) || null;
      }
      
      // Add thumbnail_url (null if no thumbnail, to allow deletion)
      basePayload.thumbnail_url = thumbnailUrl;

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

  const handleGeocodeAddress = async () => {
    if (!locationForm.address || !locationForm.address.trim()) {
      setLocationMessage({
        type: 'error',
        text: 'Please enter an address first.',
      });
      return;
    }

    try {
      setLocationMessage({ type: 'info', text: 'Looking up coordinates...' });
      const result = await api.geocodeAddress(locationForm.address.trim());
      
      setLocationForm((prev) => ({
        ...prev,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
        // Optionally update address with the formatted version from geocoding
        address: result.display_name || prev.address,
      }));

      setLocationMessage({
        type: 'success',
        text: `Coordinates found: ${result.latitude}, ${result.longitude}`,
      });
    } catch (error: any) {
      setLocationMessage({
        type: 'error',
        text: error?.message || 'Failed to geocode address. Please enter coordinates manually.',
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

      if (locationForm.category) {
        payload.category = locationForm.category.trim();
      }
      if (locationForm.categoryDescription) {
        payload.categoryDescription = locationForm.categoryDescription.trim();
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

    taskSelection.setSelectedIds((prev) => {
      const validIds = new Set(existingTemplatesRef.current.map((task) => task.id));
      const filtered = prev.filter((id) => validIds.has(id));
      // Only update if changed
      if (filtered.length !== prev.length || !filtered.every((id, idx) => prev[idx] === id)) {
        return filtered;
      }
      return prev;
    });
  }, [taskTemplateIdsKey, taskSelection]);

  useEffect(() => {
    if (prevRewardTemplateIdsRef.current === rewardTemplateIdsKey) {
      return; // No change in template IDs
    }
    prevRewardTemplateIdsRef.current = rewardTemplateIdsKey;

    // Reward selection is now handled by rewardSelection hook
    // No need to manually sync selectedRewardIds anymore
  }, [rewardTemplateIdsKey]);

  useEffect(() => {
    if (prevLocationIdsRef.current === locationIdsKey) {
      return; // No change in location IDs
    }
    prevLocationIdsRef.current = locationIdsKey;

    locationSelection.setSelectedIds((prev) => {
      const validIds = new Set(locationsListRef.current.map((location) => location.id));
      const filtered = prev.filter((id) => validIds.has(id));
      // Only update if changed
      if (filtered.length !== prev.length || !filtered.every((id, idx) => prev[idx] === id)) {
        return filtered;
      }
      return prev;
    });
  }, [locationIdsKey, locationSelection]);

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

  // toggleTaskSelection is now handled by taskSelection hook

  // toggleRewardSelection is now handled by rewardSelection hook

  // Removed: toggleLocationSelection - now using locationSelection.toggle

  // Use bulk operations hook for tasks
  const taskBulkOperations = useBulkOperations(taskSelection.selectedIds, {
    bulkUpdateStatus: async (ids, active) => {
      await api.bulkUpdateTasksStatus(ids, active);
    },
    bulkDelete: async (ids) => {
      await api.bulkDeleteTasks(ids);
    },
    refetch: async () => {
      await refetchTasks();
    },
    getSuccessMessage: (action, count) => {
      if (action === 'activate') return t('admin.messages.selectedTasksActivated');
      if (action === 'deactivate') return t('admin.messages.selectedTasksDeactivated');
      return t('admin.messages.selectedTasksDeleted');
    },
  });

  const handleTaskBulkStatus = async (active: boolean) => {
    await taskBulkOperations.handleBulkStatus(active);
    taskSelection.deselectAll();
  };

  const handleTaskBulkDelete = async () => {
    if (!taskSelection.selectedIds.length) return;
    setTaskConfirm({
      visible: true,
      title: t('admin.confirm.deleteSelectedTasks.title'),
      description: t('admin.confirm.deleteSelectedTasks.description'),
      confirmLabel: t('admin.confirm.deleteTasks'),
      confirmTone: 'danger',
      onConfirm: async () => {
        await taskBulkOperations.handleBulkDelete();
        taskSelection.deselectAll();
        setTaskConfirm(defaultConfirmDialogState);
      },
    });
  };

  const handleTaskStatusChange = async (taskId: string, active: boolean) => {
    try {
      taskBulkOperations.clearMessage();
      await api.bulkUpdateTasksStatus([taskId], active);
      taskBulkOperations.setMessage({
        type: 'success',
        text: active ? t('admin.messages.taskActivated') : t('admin.messages.taskDeactivated'),
      });
      void refetchTasks();
    } catch (error: any) {
      taskBulkOperations.setMessage({
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
          taskBulkOperations.clearMessage();
          await api.bulkDeleteTasks([taskId]);
          taskBulkOperations.setMessage({
            type: 'success',
            text: 'Task deleted.',
          });
          if (editingTaskId === taskId) {
            cancelTaskEdit();
          }
          void refetchTasks();
        } catch (error: any) {
          taskBulkOperations.setMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteTask'),
          });
        } finally {
          setTaskConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  // Use bulk operations hook for rewards - must be after rewardSelection
  const rewardBulkOperations = useBulkOperations(rewardSelection.selectedIds, {
    bulkUpdateStatus: async (ids, active) => {
      await api.bulkUpdateRewardsStatus(ids, active);
    },
    bulkDelete: async (ids) => {
      await api.bulkDeleteRewards(ids);
    },
    refetch: async () => {
      await refetchRewardTemplates();
    },
    getSuccessMessage: (action, count) => {
      if (action === 'activate') return t('admin.messages.selectedRewardsActivated');
      if (action === 'deactivate') return t('admin.messages.selectedRewardsDeactivated');
      return t('admin.messages.selectedRewardsDeleted');
    },
  });

  const handleRewardBulkStatus = async (active: boolean) => {
    await rewardBulkOperations.handleBulkStatus(active);
    rewardSelection.deselectAll();
  };

  const handleRewardBulkDelete = async () => {
    if (!rewardSelection.selectedIds.length) return;
    setRewardConfirm({
      visible: true,
      title: t('admin.confirm.deleteSelectedRewards.title'),
      description: t('admin.confirm.deleteSelectedRewards.description'),
      confirmLabel: t('admin.confirm.deleteRewards'),
      confirmTone: 'danger',
      onConfirm: async () => {
        await rewardBulkOperations.handleBulkDelete();
        rewardSelection.deselectAll();
        setRewardConfirm(defaultConfirmDialogState);
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
      locationBulkOperations.clearMessage();
      await api.bulkUpdateLocationsStatus([locationId], active);
      locationBulkOperations.setMessage({
        type: 'success',
        text: active ? t('admin.messages.locationActivated') : t('admin.messages.locationDeactivated'),
      });
      void refetchLocations();
    } catch (error: any) {
      locationBulkOperations.setMessage({
        type: 'error',
        text: error?.message || 'Failed to update location.',
      });
    }
  };

  // Use bulk operations hook for locations
  const locationBulkOperations = useBulkOperations(locationSelection.selectedIds, {
    bulkUpdateStatus: async (ids, active) => {
      await api.bulkUpdateLocationsStatus(ids, active);
    },
    bulkDelete: async (ids) => {
      await api.bulkDeleteLocations(ids);
    },
    refetch: async () => {
      await refetchLocations();
    },
    getSuccessMessage: (action, count) => {
      if (action === 'activate') return t('admin.messages.selectedLocationsActivated');
      if (action === 'deactivate') return t('admin.messages.selectedLocationsDeactivated');
      return t('admin.messages.selectedLocationsDeleted');
    },
    getErrorMessage: (action, error) => {
      if (action === 'delete') return error?.message || t('admin.messages.failedToDeleteLocations');
      return error?.message || 'Failed to update selected locations.';
    },
  });

  const handleLocationBulkStatus = async (active: boolean) => {
    await locationBulkOperations.handleBulkStatus(active);
    locationSelection.deselectAll();
  };

  const handleLocationBulkDelete = async () => {
    if (!locationSelection.selectedIds.length) return;
    setLocationConfirm({
      visible: true,
      title: t('admin.confirm.deleteSelectedLocations.title'),
      description: t('admin.confirm.deleteSelectedLocations.description'),
      confirmLabel: t('admin.confirm.deleteLocations'),
      confirmTone: 'danger',
      onConfirm: async () => {
        await locationBulkOperations.handleBulkDelete();
        locationSelection.deselectAll();
        setLocationConfirm(defaultConfirmDialogState);
      },
    });
  };

  const startTaskEdit = (task: AdminTaskTemplate) => {
    setTaskReturnMode(mode === 'taskManage' ? 'taskManage' : null);
    setMode('task');
    taskBulkOperations.clearMessage();
    setTaskMessage(null);
    const source: TaskSource =
      task.type === 'video' ? 'video' 
      : task.type === 'quiz' ? 'quiz'
      : task.type === 'article_quiz' ? 'article_quiz'
      : task.type === 'survey' ? 'survey'
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
      surveyQuestions: (task as any).survey_questions ?? [],
      surveyType: (task as any).survey_type ?? 'mixed',
      qr_code: task.qr_code ?? '',
      photo_required: task.type === 'photo',
      co2_savings_kg: task.co2_savings_kg ?? 0,
      target_latitude: task.target_latitude ? String(task.target_latitude) : '',
      target_longitude: task.target_longitude ? String(task.target_longitude) : '',
      target_address: '',
      locationId: task.location_id ?? task.location?.id ?? '',
      active: task.active ?? true,
      recurrence: ((task as any).recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
      prerequisite_task_id: (task as any).prerequisite_task_id ?? undefined,
      prerequisite_task_count: (task as any).prerequisite_task_count ?? undefined,
      prerequisite_task_ids: (task as any).prerequisite_task_ids ?? undefined,
      category: (task as any).category ?? undefined,
      difficulty: (task as any).difficulty ?? undefined,
      time_required: (task as any).time_required ?? undefined,
      location_tool: (task as any).location_tool ?? undefined,
 // Event/Gruppe removed
      zielgruppe: undefined, // Tasks are visible to all users by default
      thumbnailFile: null,
      thumbnailUrl: (task as any).thumbnail_url ?? null,
    });
    setIsEditingTask(true);
    setEditingTaskId(task.id);
    setHasAttemptedPublish(false);
  };

  // Helper functions for prerequisite modal
  const getSelectedTaskTitle = (taskId: string | undefined): string => {
    if (!taskId) return t('admin.task.prerequisites.modal.noSelection');
    const task = existingTemplates.find((t) => t.id === taskId);
    return task?.title || t('admin.task.prerequisites.modal.noSelection');
  };

  const getSelectedTask = (taskId: string | undefined): AdminTaskTemplate | undefined => {
    if (!taskId) return undefined;
    return existingTemplates.find((t) => t.id === taskId);
  };

  const getSelectedTasksCount = (taskIds: string[] | undefined): string => {
    if (!taskIds || taskIds.length === 0) {
      return t('admin.task.prerequisites.modal.noSelectionMulti');
    }
    return t('admin.task.prerequisites.modal.selectedCount', { count: taskIds.length });
  };

  const handleOpenPrerequisiteModal = (mode: 'single' | 'multi') => {
    setPrerequisiteModalMode(mode);
    setIsPrerequisiteModalOpen(true);
  };

  const handlePrerequisiteModalApply = (selectedIds: string[]) => {
    if (prerequisiteModalMode === 'single') {
      setTaskForm((prev) => ({
        ...prev,
        prerequisite_task_id: selectedIds.length > 0 ? selectedIds[0] : undefined,
      }));
    } else {
      setTaskForm((prev) => ({
        ...prev,
        prerequisite_task_ids: selectedIds.length > 0 ? selectedIds : undefined,
        prerequisite_task_count:
          selectedIds.length > 0 && prev.prerequisite_task_count
            ? Math.min(prev.prerequisite_task_count, selectedIds.length)
            : prev.prerequisite_task_count,
      }));
    }
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
      zielgruppe: null, // Rewards are visible to all users by default
      locationId: template.location_id ?? template.location?.id ?? '',
      active: template.active ?? true,
      recurrence: (template.recurrence as 'once' | 'daily' | 'weekly' | 'monthly') ?? 'once',
      reward_art: (template as any).reward_art ?? undefined,
      kategorie: (template as any).kategorie ?? undefined,
 // Event/Gruppe removed
      moegliche_punkte: (template as any).moegliche_punkte ?? undefined,
      allowed_teams: normalizeEnumArray((template as any).allowed_teams) as string[] || [],
      allowed_contests: normalizeEnumArray((template as any).allowed_contests) as string[] || [],
      thumbnailFile: null,
      thumbnailUrl: (template as any).thumbnail_url ?? null,
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
      category: (location as any).category ?? '',
      categoryDescription: (location as any).category_description ?? '',
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
    taskBulkOperations.clearMessage();
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

  const loadParameters = async () => {
    try {
      setParameterLoading(true);
      setParameterMessage(null);
      const [taskParams, rewardParams, factorData] = await Promise.all([
        api.getTaskParameters(),
        api.getRewardParameters(),
        api.getPointsCalculationFactor(),
      ]);
      setTaskParameters(taskParams);
      setRewardParameters(rewardParams);
      if (factorData?.factor !== undefined) {
        setPointsCalculationFactor(factorData.factor);
      }
    } catch (error: any) {
      setParameterMessage({ type: 'error', text: error?.message || t('admin.parameterManage.error') });
    } finally {
      setParameterLoading(false);
    }
  };

  const handleCreateParameter = async (type: 'task' | 'reward') => {
    if (!newParameter || newParameter.type !== type || !newParameter.value.trim()) {
      setParameterMessage({ type: 'error', text: t('admin.parameterManage.valueRequired') });
      return;
    }
    try {
      if (type === 'task') {
        await api.createTaskParameter(newParameter.parameterType, newParameter.value, newParameter.displayOrder, newParameter.weight);
      } else {
        await api.createRewardParameter(newParameter.parameterType, newParameter.value, newParameter.displayOrder, newParameter.weight);
      }
      setParameterMessage({ type: 'success', text: t('admin.parameterManage.created') });
      setNewParameter(null);
      void loadParameters();
    } catch (error: any) {
      setParameterMessage({ type: 'error', text: error?.message || t('admin.parameterManage.createError') });
    }
  };

  const handleUpdateParameter = async (type: 'task' | 'reward') => {
    if (!editingParameter || editingParameter.type !== type || !editingParameter.value.trim()) {
      setParameterMessage({ type: 'error', text: t('admin.parameterManage.valueRequired') });
      return;
    }
    try {
      if (type === 'task') {
        await api.updateTaskParameter(editingParameter.id, {
          value: editingParameter.value,
          display_order: editingParameter.displayOrder,
          weight: editingParameter.weight,
        });
      } else {
        await api.updateRewardParameter(editingParameter.id, {
          value: editingParameter.value,
          display_order: editingParameter.displayOrder,
          weight: editingParameter.weight,
        });
      }
      setParameterMessage({ type: 'success', text: t('admin.parameterManage.updated') });
      setEditingParameter(null);
      void loadParameters();
    } catch (error: any) {
      setParameterMessage({ type: 'error', text: error?.message || t('admin.parameterManage.updateError') });
    }
  };

  const handleDeleteParameter = async (type: 'task' | 'reward', id: string) => {
    if (!confirm(t('admin.parameterManage.confirmDelete'))) {
      return;
    }
    try {
      if (type === 'task') {
        await api.deleteTaskParameter(id);
      } else {
        await api.deleteRewardParameter(id);
      }
      setParameterMessage({ type: 'success', text: t('admin.parameterManage.deleted') });
      void loadParameters();
    } catch (error: any) {
      setParameterMessage({ type: 'error', text: error?.message || t('admin.parameterManage.deleteError') });
    }
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
          locationSelection.setSelectedIds(
            locationSelection.selectedIds.filter((id) => id !== location.id)
          );
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

  // Use selection hooks - must be defined after filteredTasks and filteredRewards
  // (moved to after filteredTasks definition)
  
  // rewardSelection is now defined after filteredRewards (see above)

  // Teams helper functions - inline like tasks
  const toggleTeamSelection = (teamId: string, checked: boolean) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(teamId);
      } else {
        next.delete(teamId);
      }
      return Array.from(next);
    });
  };

  const allTeamsSelected = filteredTeams.length > 0 && selectedTeamIds.length === filteredTeams.length;
  const hasTeamSelection = selectedTeamIds.length > 0;

  const handleTeamBulkStatus = async (active: boolean) => {
    if (!selectedTeamIds.length) return;
    try {
      setTeamManagementMessage(null);
      await api.bulkUpdateTeamsStatus(selectedTeamIds, active);
      setTeamManagementMessage({
        type: 'success',
        text: active ? t('admin.messages.selectedTeamsActivated') : t('admin.messages.selectedTeamsDeactivated'),
      });
      setSelectedTeamIds([]);
      void refetchTeams();
    } catch (error: any) {
      setTeamManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update selected teams.',
      });
    }
  };

  const handleTeamBulkDelete = async () => {
    if (!selectedTeamIds.length) return;
    setTeamConfirm({
      visible: true,
      title: t('admin.confirm.deleteSelectedTeams.title'),
      description: t('admin.confirm.deleteSelectedTeams.description'),
      confirmLabel: t('admin.confirm.deleteTeams'),
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setTeamManagementMessage(null);
          await api.bulkDeleteTeams(selectedTeamIds);
          setTeamManagementMessage({
            type: 'success',
            text: t('admin.messages.selectedTeamsDeleted'),
          });
          setSelectedTeamIds([]);
          void refetchTeams();
        } catch (error: any) {
          setTeamManagementMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteTeams'),
          });
        } finally {
          setTeamConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  const handleTeamStatusChange = async (teamId: string, active: boolean) => {
    try {
      setTeamManagementMessage(null);
      await api.bulkUpdateTeamsStatus([teamId], active);
      setTeamManagementMessage({
        type: 'success',
        text: active ? t('admin.messages.teamActivated') : t('admin.messages.teamDeactivated'),
      });
      void refetchTeams();
    } catch (error: any) {
      setTeamManagementMessage({
        type: 'error',
        text: error?.message || t('admin.messages.failedToUpdateTeam'),
      });
    }
  };

  const handleTeamDelete = async (teamId: string) => {
    setTeamConfirm({
      visible: true,
      title: t('admin.confirm.deleteTeamSingle.title'),
      description: t('admin.confirm.deleteTeamSingle.description'),
      confirmLabel: t('admin.confirm.deleteTeam'),
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setTeamManagementMessage(null);
          await api.bulkDeleteTeams([teamId]);
          setTeamManagementMessage({
            type: 'success',
            text: 'Team deleted.',
          });
          if (editingTeamId === teamId) {
            setEditingTeamId(null);
          }
          void refetchTeams();
        } catch (error: any) {
          setTeamManagementMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteTeam'),
          });
        } finally {
          setTeamConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  // Contests helper functions - inline like tasks
  const toggleContestSelection = (contestId: string, checked: boolean) => {
    setSelectedContestIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(contestId);
      } else {
        next.delete(contestId);
      }
      return Array.from(next);
    });
  };

  const allContestsSelected = filteredContests.length > 0 && selectedContestIds.length === filteredContests.length;
  const hasContestSelection = selectedContestIds.length > 0;

  const handleContestBulkStatus = async (active: boolean) => {
    if (!selectedContestIds.length) return;
    try {
      setContestManagementMessage(null);
      await api.bulkUpdateContestsStatus(selectedContestIds, active);
      setContestManagementMessage({
        type: 'success',
        text: active ? t('admin.messages.selectedContestsActivated') : t('admin.messages.selectedContestsDeactivated'),
      });
      setSelectedContestIds([]);
      void refetchContests();
    } catch (error: any) {
      setContestManagementMessage({
        type: 'error',
        text: error?.message || 'Failed to update selected contests.',
      });
    }
  };

  const handleContestBulkDelete = async () => {
    if (!selectedContestIds.length) return;
    setContestConfirm({
      visible: true,
      title: t('admin.confirm.deleteSelectedContests.title'),
      description: t('admin.confirm.deleteSelectedContests.description'),
      confirmLabel: t('admin.confirm.deleteContests'),
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setContestManagementMessage(null);
          await api.bulkDeleteContests(selectedContestIds);
          setContestManagementMessage({
            type: 'success',
            text: t('admin.messages.selectedContestsDeleted'),
          });
          setSelectedContestIds([]);
          void refetchContests();
        } catch (error: any) {
          setContestManagementMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteContests'),
          });
        } finally {
          setContestConfirm(defaultConfirmDialogState);
        }
      },
    });
  };

  const handleContestStatusChange = async (contestId: string, active: boolean) => {
    try {
      setContestManagementMessage(null);
      await api.bulkUpdateContestsStatus([contestId], active);
      setContestManagementMessage({
        type: 'success',
        text: active ? t('admin.messages.contestActivated') : t('admin.messages.contestDeactivated'),
      });
      void refetchContests();
    } catch (error: any) {
      setContestManagementMessage({
        type: 'error',
        text: error?.message || t('admin.messages.failedToUpdateContest'),
      });
    }
  };

  const handleContestDelete = async (contestId: string) => {
    setContestConfirm({
      visible: true,
      title: t('admin.confirm.deleteContestSingle.title'),
      description: t('admin.confirm.deleteContestSingle.description'),
      confirmLabel: t('admin.confirm.deleteContest'),
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          setContestManagementMessage(null);
          await api.bulkDeleteContests([contestId]);
          setContestManagementMessage({
            type: 'success',
            text: 'Contest deleted.',
          });
          if (editingContestId === contestId) {
            setEditingContestId(null);
          }
          void refetchContests();
        } catch (error: any) {
          setContestManagementMessage({
            type: 'error',
            text: error?.message || t('admin.messages.failedToDeleteContest'),
          });
        } finally {
          setContestConfirm(defaultConfirmDialogState);
        }
      },
    });
  };
  const isTaskSaving = publishTaskMutation.isLoading || updateTaskMutation.isLoading;
  const taskSubmitLabel = isEditingTask
    ? isTaskSaving
      ? t('admin.task.saving')
      : t('admin.task.saveChanges')
     : publishTaskMutation.isLoading
     ? t('admin.task.publishing')
     : t('admin.task.publishButton');
  const isRewardSaving = createRewardMutation.isLoading || updateRewardMutation.isLoading;
  const rewardSubmitLabel = isEditingReward
    ? isRewardSaving
      ? t('admin.reward.saving')
      : t('admin.reward.saveChanges')
    : createRewardMutation.isLoading
    ? t('admin.reward.publishing')
    : t('admin.reward.publishButton');

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
          <div className="admin-navbar-language">
            <LanguageSwitcher />
          </div>
          <button className="admin-logout-button" onClick={logout} type="button">
            {t('navigation.logout')}
          </button>
        </nav>

        <div className="admin-hero">
          <h1 className="admin-hero-title">{t('admin.home.title')}</h1>
          <p className="admin-hero-subtitle">{t('admin.home.subtitle')}</p>
        </div>
      </header>

      {mode === null && (
        <>
          {/* 1. Reihe: Parameter verwalten, Benutzer verwalten, Debug-Tools, Wald-Debug-Statistiken */}
          <div className="admin-choice-grid admin-choice-grid-compact">
            <button className="admin-choice-card" onClick={() => setMode('parameterManage')}>
              <span className="admin-choice-icon">⚙️</span>
              <h2>{t('admin.actions.manageParameters.title')}</h2>
              <p>{t('admin.actions.manageParameters.description')}</p>
            </button>
            <button className="admin-choice-card" onClick={() => setMode('userManage')}>
              <span className="admin-choice-icon">👥</span>
              <h2>{t('admin.actions.manageUsers.title')}</h2>
              <p>{t('admin.actions.manageUsers.description')}</p>
            </button>
            <button
              className="admin-choice-card"
              onClick={() => setMode('debugTools')}
            >
              <span className="admin-choice-icon">🔧</span>
              <h2>{t('admin.actions.debugTools.title')}</h2>
              <p>{t('admin.actions.debugTools.description')}</p>
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
          {/* 2. Reihe: Aufgaben, Belohnungen, Standorte, Teams, Wettbewerbe */}
          <div className="admin-choice-grid admin-choice-grid-compact">
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
            <button className="admin-choice-card" onClick={() => setMode('locationManage')}>
              <span className="admin-choice-icon">🗺️</span>
              <h2>{t('admin.actions.manageLocations.title')}</h2>
              <p>{t('admin.actions.manageLocations.description')}</p>
            </button>
            <button className="admin-choice-card" onClick={() => setMode('teamManage')}>
              <span className="admin-choice-icon">👨‍👩‍👧‍👦</span>
              <h2>{t('admin.actions.manageTeams.title')}</h2>
              <p>{t('admin.actions.manageTeams.description')}</p>
            </button>
            <button className="admin-choice-card" onClick={() => setMode('contestManage')}>
              <span className="admin-choice-icon">🏆</span>
              <h2>{t('admin.actions.manageContests.title')}</h2>
              <p>{t('admin.actions.manageContests.description')}</p>
            </button>
            <button className="admin-choice-card" onClick={() => setMode('photoValidation')} style={{ position: 'relative' }}>
              <span className="admin-choice-icon">📸</span>
              <h2>{t('admin.actions.photoValidation.title', 'Foto-Aufgaben verifizieren')}</h2>
              <p>{t('admin.actions.photoValidation.description', 'Foto-Aufgaben prüfen und freigeben oder ablehnen')}</p>
              {pendingPhotoTasks.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  borderRadius: '50%',
                  width: '1.75rem',
                  height: '1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}>
                  {pendingPhotoTasks.length}
                </span>
              )}
            </button>
          </div>
          {/* 3. Reihe: Der Rest */}
          <div className="admin-choice-grid">
            <button
              className="admin-choice-card"
              onClick={() => setMode('surveyAnalytics')}
            >
              <span className="admin-choice-icon">📊</span>
              <h2>{t('admin.actions.surveyAnalytics.title')}</h2>
              <p>{t('admin.actions.surveyAnalytics.description')}</p>
            </button>
            <button className="admin-choice-card" onClick={() => setMode('qrScanner')}>
              <span className="admin-choice-icon">📷</span>
              <h2>{t('admin.actions.redeemRewards.title')}</h2>
              <p>{t('admin.actions.redeemRewards.description')}</p>
            </button>
            <button className="admin-choice-card" onClick={() => setMode('pointsBonus')}>
              <span className="admin-choice-icon">🎫</span>
              <h2>{t('admin.actions.pointsBonus.title', 'Bonus-Codes generieren')}</h2>
              <p>{t('admin.actions.pointsBonus.description', 'QR-Codes für Bonuspunkte generieren')}</p>
            </button>
          </div>
        </>
      )}

      {mode === 'surveyAnalytics' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{t('admin.surveyAnalytics.title')}</h2>
            </div>
            <div className="admin-actions">
              <button
                className="admin-icon-button"
                onClick={() => setMode(null)}
                title={t('admin.common.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{t('admin.common.back')}</span>
              </button>
            </div>
          </header>
          <SurveyAnalytics />
        </section>
      )}

      {mode === 'debugTools' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{t('admin.debugTools.title')}</h2>
            </div>
            <div className="admin-actions">
              <button
                className="admin-icon-button"
                onClick={() => setMode(null)}
                title={t('admin.common.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{t('admin.common.back')}</span>
              </button>
            </div>
          </header>
          <DebugTools />
        </section>
      )}

      {mode === 'userManage' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{t('admin.users.title')}</h2>
              <p>{t('admin.users.subtitle')}</p>
            </div>
            <div className="admin-actions">
              <button
                className="admin-icon-button"
                onClick={() => setMode(null)}
                title={t('admin.common.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{t('admin.common.back')}</span>
              </button>
            </div>
          </header>
          <UserManagement />
        </section>
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
                      {t('common.actions.close', 'Schließen')}
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

      {mode === 'parameterManage' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{t('admin.actions.manageParameters.title')}</h2>
              <p>{t('admin.actions.manageParameters.description')}</p>
            </div>
            <div className="admin-actions">
              <button
                className="admin-icon-button"
                onClick={() => {
                  void loadParameters();
                  setParameterMessage(null);
                }}
                title={t('admin.common.refresh')}
              >
                <Icon name="refresh" />
                <span className="sr-only">{t('admin.common.refresh')}</span>
              </button>
              <button
                className="admin-icon-button"
                onClick={() => setMode(null)}
                title={t('admin.common.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{t('admin.common.back')}</span>
              </button>
            </div>
          </header>

          {parameterLoading && <p>{t('admin.parameterManage.loading')}</p>}
          {parameterMessage && (
            <p className={parameterMessage.type === 'error' ? 'admin-error' : 'admin-success'}>
              {parameterMessage.text}
            </p>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t('admin.parameterManage.taskParameters')}</h3>
            
            {['type', 'category', 'difficulty', 'time_required', 'location_tool', 'zielgruppe'].map((paramType) => {
              const params = taskParameters.filter((p) => p.parameter_type === paramType);
              const isEditing = editingParameter?.type === 'task' && editingParameter.parameterType === paramType;
              const isCreating = newParameter?.type === 'task' && newParameter.parameterType === paramType;
              
              return (
                <div key={paramType} className="admin-management-card" style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>
                    {t(`admin.parameterManage.fieldNames.${paramType}`)}
                  </h4>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('admin.parameterManage.value')}</th>
                          <th>{t('admin.parameterManage.displayOrder')}</th>
                          {(paramType === 'difficulty' || paramType === 'time_required') && (
                            <th>{t('admin.parameterManage.weight')}</th>
                          )}
                          <th>{t('admin.parameterManage.active')}</th>
                          <th style={{ width: '12rem' }}>{t('admin.parameterManage.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {params
                          .filter((p) => !isEditing || editingParameter.id !== p.id)
                          .map((param) => (
                            <tr key={param.id}>
                              <td>{param.value}</td>
                              <td>{param.display_order}</td>
                              {(paramType === 'difficulty' || paramType === 'time_required') && (
                                <td>{param.weight ?? param.display_order}</td>
                              )}
                              <td>
                                <span className={`admin-status-badge ${param.active ? 'active' : 'inactive'}`}>
                                  {param.active ? t('admin.parameterManage.active') : t('admin.parameterManage.inactive')}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="admin-action-button"
                                  onClick={() =>
                                    setEditingParameter({
                                      id: param.id,
                                      type: 'task',
                                      parameterType: param.parameter_type,
                                      value: param.value,
                                      displayOrder: param.display_order,
                                      weight: param.weight ?? param.display_order,
                                    })
                                  }
                                >
                                  {t('admin.parameterManage.edit')}
                                </button>
                                <button
                                  className="admin-action-button"
                                  onClick={() => handleDeleteParameter('task', param.id)}
                                >
                                  {t('admin.parameterManage.delete')}
                                </button>
                              </td>
                            </tr>
                          ))}
                        {isCreating && (
                          <tr>
                            <td>
                              <input
                                type="text"
                                value={newParameter.value}
                                onChange={(e) => setNewParameter({ ...newParameter, value: e.target.value })}
                                placeholder={t('admin.parameterManage.enterValue')}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={newParameter.displayOrder}
                                onChange={(e) =>
                                  setNewParameter({ ...newParameter, displayOrder: Number.parseInt(e.target.value || '0', 10) })
                                }
                              />
                            </td>
                            {(paramType === 'difficulty' || paramType === 'time_required') && (
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={newParameter.weight ?? newParameter.displayOrder}
                                  onChange={(e) =>
                                    setNewParameter({ ...newParameter, weight: Number.parseFloat(e.target.value || '0') })
                                  }
                                />
                              </td>
                            )}
                            <td colSpan={(paramType === 'difficulty' || paramType === 'time_required') ? 1 : 2}>
                              <button
                                className="admin-action-button"
                                onClick={() => handleCreateParameter('task')}
                              >
                                {t('admin.parameterManage.save')}
                              </button>
                              <button
                                className="admin-action-button"
                                onClick={() => setNewParameter(null)}
                              >
                                {t('admin.parameterManage.cancel')}
                              </button>
                            </td>
                          </tr>
                        )}
                        {isEditing && (
                          <tr>
                            <td>
                              <input
                                type="text"
                                value={editingParameter.value}
                                onChange={(e) =>
                                  setEditingParameter({ ...editingParameter, value: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editingParameter.displayOrder}
                                onChange={(e) =>
                                  setEditingParameter({
                                    ...editingParameter,
                                    displayOrder: Number.parseInt(e.target.value || '0', 10),
                                  })
                                }
                              />
                            </td>
                            {(paramType === 'difficulty' || paramType === 'time_required') && (
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingParameter.weight ?? editingParameter.displayOrder}
                                  onChange={(e) =>
                                    setEditingParameter({
                                      ...editingParameter,
                                      weight: Number.parseFloat(e.target.value || '0'),
                                    })
                                  }
                                />
                              </td>
                            )}
                            <td colSpan={(paramType === 'difficulty' || paramType === 'time_required') ? 1 : 2}>
                              <button
                                className="admin-action-button"
                                onClick={() => handleUpdateParameter('task')}
                              >
                                {t('admin.parameterManage.save')}
                              </button>
                              <button
                                className="admin-action-button"
                                onClick={() => setEditingParameter(null)}
                              >
                                {t('admin.parameterManage.cancel')}
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="admin-action-button"
                    onClick={() => setNewParameter({ type: 'task', parameterType: paramType, value: '', displayOrder: 0, weight: (paramType === 'difficulty' || paramType === 'time_required') ? 0 : undefined })}
                    style={{ marginTop: '1rem' }}
                  >
                    {t('admin.parameterManage.newParameter')}
                  </button>
                </div>
              );
            })}
          </div>

          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>{t('admin.parameterManage.rewardParameters')}</h3>
            
            {['reward_art', 'kategorie'].map((paramType) => {
              const params = rewardParameters.filter((p) => p.parameter_type === paramType);
              const isEditing = editingParameter?.type === 'reward' && editingParameter.parameterType === paramType;
              const isCreating = newParameter?.type === 'reward' && newParameter.parameterType === paramType;
              
              return (
                <div key={paramType} className="admin-management-card" style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>
                    {t(`admin.parameterManage.fieldNames.${paramType}`)}
                  </h4>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('admin.parameterManage.value')}</th>
                          <th>{t('admin.parameterManage.displayOrder')}</th>
                          {paramType === 'kosten' && (
                            <th>{t('admin.parameterManage.weight')}</th>
                          )}
                          <th>{t('admin.parameterManage.active')}</th>
                          <th style={{ width: '12rem' }}>{t('admin.parameterManage.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {params
                          .filter((p) => !isEditing || editingParameter.id !== p.id)
                          .map((param) => (
                            <tr key={param.id}>
                              <td>{param.value}</td>
                              <td>{param.display_order}</td>
                              {paramType === 'kosten' && (
                                <td>{param.weight ?? param.display_order}</td>
                              )}
                              <td>
                                <span className={`admin-status-badge ${param.active ? 'active' : 'inactive'}`}>
                                  {param.active ? t('admin.parameterManage.active') : t('admin.parameterManage.inactive')}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="admin-action-button"
                                  onClick={() =>
                                    setEditingParameter({
                                      id: param.id,
                                      type: 'reward',
                                      parameterType: param.parameter_type,
                                      value: param.value,
                                      displayOrder: param.display_order,
                                      weight: paramType === 'kosten' ? (param.weight ?? param.display_order) : undefined,
                                    })
                                  }
                                >
                                  {t('admin.parameterManage.edit')}
                                </button>
                                <button
                                  className="admin-action-button"
                                  onClick={() => handleDeleteParameter('reward', param.id)}
                                >
                                  {t('admin.parameterManage.delete')}
                                </button>
                              </td>
                            </tr>
                          ))}
                        {isCreating && (
                          <tr>
                            <td>
                              <input
                                type="text"
                                value={newParameter.value}
                                onChange={(e) => setNewParameter({ ...newParameter, value: e.target.value })}
                                placeholder={t('admin.parameterManage.enterValue')}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={newParameter.displayOrder}
                                onChange={(e) =>
                                  setNewParameter({ ...newParameter, displayOrder: Number.parseInt(e.target.value || '0', 10) })
                                }
                              />
                            </td>
                            {paramType === 'kosten' && (
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={newParameter.weight ?? newParameter.displayOrder}
                                  onChange={(e) =>
                                    setNewParameter({ ...newParameter, weight: Number.parseFloat(e.target.value || '0') })
                                  }
                                />
                              </td>
                            )}
                            <td colSpan={paramType === 'kosten' ? 1 : 2}>
                              <button
                                className="admin-action-button"
                                onClick={() => handleCreateParameter('reward')}
                              >
                                {t('admin.parameterManage.save')}
                              </button>
                              <button
                                className="admin-action-button"
                                onClick={() => setNewParameter(null)}
                              >
                                {t('admin.parameterManage.cancel')}
                              </button>
                            </td>
                          </tr>
                        )}
                        {isEditing && (
                          <tr>
                            <td>
                              <input
                                type="text"
                                value={editingParameter.value}
                                onChange={(e) =>
                                  setEditingParameter({ ...editingParameter, value: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editingParameter.displayOrder}
                                onChange={(e) =>
                                  setEditingParameter({
                                    ...editingParameter,
                                    displayOrder: Number.parseInt(e.target.value || '0', 10),
                                  })
                                }
                              />
                            </td>
                            {paramType === 'kosten' && (
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingParameter.weight ?? editingParameter.displayOrder}
                                  onChange={(e) =>
                                    setEditingParameter({
                                      ...editingParameter,
                                      weight: Number.parseFloat(e.target.value || '0'),
                                    })
                                  }
                                />
                              </td>
                            )}
                            <td colSpan={paramType === 'kosten' ? 1 : 2}>
                              <button
                                className="admin-action-button"
                                onClick={() => handleUpdateParameter('reward')}
                              >
                                {t('admin.parameterManage.save')}
                              </button>
                              <button
                                className="admin-action-button"
                                onClick={() => setEditingParameter(null)}
                              >
                                {t('admin.parameterManage.cancel')}
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="admin-action-button"
                    onClick={() => setNewParameter({ type: 'reward', parameterType: paramType, value: '', displayOrder: 0, weight: paramType === 'kosten' ? 0 : undefined })}
                    style={{ marginTop: '1rem' }}
                  >
                    {t('admin.parameterManage.newParameter')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Points Calculation Factor */}
          <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t('admin.parameterManage.pointsCalculationFactor')}</h3>
            <div className="admin-management-card">
              <p style={{ marginBottom: '1rem' }}>
                {t('admin.parameterManage.pointsCalculationFactorDescription')}
              </p>
              {isEditingFactor ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingFactorValue}
                    onChange={(e) => setEditingFactorValue(e.target.value)}
                    style={{ width: '150px', padding: '0.5rem' }}
                  />
                  <button
                    className="admin-action-button"
                    onClick={async () => {
                      try {
                        const factorValue = Number.parseFloat(editingFactorValue);
                        if (isNaN(factorValue) || factorValue <= 0) {
                          setParameterMessage({ type: 'error', text: 'Faktor muss eine positive Zahl sein' });
                          return;
                        }
                        await api.setSystemConfig('points_calculation_factor', String(factorValue), 'Factor for calculating task points: (difficulty_weight * time_required_weight) * factor');
                        setPointsCalculationFactor(factorValue);
                        setParameterMessage({ type: 'success', text: t('admin.parameterManage.factorUpdated') });
                        setIsEditingFactor(false);
                      } catch (error: any) {
                        setParameterMessage({ type: 'error', text: error?.message || t('admin.parameterManage.updateError') });
                      }
                    }}
                  >
                    {t('admin.parameterManage.save')}
                  </button>
                  <button
                    className="admin-action-button"
                    onClick={() => {
                      setIsEditingFactor(false);
                      setEditingFactorValue(String(pointsCalculationFactor)); // Reset to original value
                    }}
                  >
                    {t('admin.parameterManage.cancel')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{pointsCalculationFactor}</span>
                  <button
                    className="admin-action-button"
                    onClick={() => {
                      setEditingFactorValue(String(pointsCalculationFactor));
                      setIsEditingFactor(true);
                    }}
                  >
                    {t('admin.parameterManage.edit')}
                  </button>
                </div>
              )}
            </div>
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
                  <option value="survey">{t('admin.task.startFromScratch.survey')}</option>
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

            {(isEditingTask || (taskSource && (taskSource !== 'existing' || selectedExistingTaskId))) && (
              <div className="admin-form-layout">
                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <div>
                      <h3>{t('admin.task.basics.title')}</h3>
                      <p>{t('admin.task.basics.subtitle')}</p>
                    </div>
                    <TaskTypeBadge type={taskForm.type} thumbnailUrl={taskForm.thumbnailUrl} />
                  </div>
                  <div className="admin-form-grid admin-form-grid-two">
                    {isEditingTask && (
                      <label className="admin-field">
                        <FieldLabel label={t('admin.task.fields.type')} required />
                        <select
                          value={taskForm.type}
                          onChange={(event) =>
                            setTaskForm((prev) => ({
                              ...prev,
                              type: event.target.value as TaskFormState['type'],
                            }))
                          }
                          className="admin-select"
                        >
                          <option value="video">{t('admin.task.startFromScratch.video')}</option>
                          <option value="quiz">{t('admin.task.startFromScratch.quiz')}</option>
                          <option value="article_quiz">{t('admin.task.startFromScratch.articleQuiz')}</option>
                          <option value="survey">{t('admin.task.startFromScratch.survey')}</option>
                          <option value="qr">{t('admin.task.startFromScratch.qr')}</option>
                          <option value="photo">{t('admin.task.startFromScratch.photo')}</option>
                          <option value="visit_location">{t('admin.task.startFromScratch.visitLocation')}</option>
                        </select>
                      </label>
                    )}
                    <label className={`admin-field ${isEditingTask ? '' : 'admin-field-span-2'}`}>
                      <FieldLabel label={t('admin.task.fields.title')} required />
                      <input
                        type="text"
                        value={taskForm.title}
                        onChange={(event) =>
                          setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </label>
                    <label className="admin-field admin-field-span-2">
                      <FieldLabel label={t('admin.task.fields.description')} required />
                      <textarea
                        value={taskForm.description}
                        onChange={(event) =>
                          setTaskForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label="Thumbnail (optional)" />
                      <div className="admin-upload-field">
                        {(taskForm.thumbnailUrl || taskForm.thumbnailFile) && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <img
                              src={taskForm.thumbnailFile ? URL.createObjectURL(taskForm.thumbnailFile) : taskForm.thumbnailUrl || ''}
                              alt="Thumbnail preview"
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setTaskForm((prev) => ({ ...prev, thumbnailFile: null, thumbnailUrl: null }));
                              }}
                              style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <div className="admin-upload-control">
                          <label className="admin-upload-button">
                            <span>Choose Thumbnail</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                setTaskForm((prev) => ({
                                  ...prev,
                                  thumbnailFile: file,
                                  thumbnailUrl: file ? null : prev.thumbnailUrl,
                                }));
                              }}
                            />
                          </label>
                          <span className="admin-upload-filename">
                            {taskForm.thumbnailFile ? taskForm.thumbnailFile.name : taskForm.thumbnailUrl ? 'Current thumbnail' : 'No thumbnail selected'}
                          </span>
                        </div>
                        <p className="admin-field-note">PNG or JPG, max 2MB. Will be resized to 48x48px.</p>
                      </div>
                    </div>
                    <label className="admin-field">
                      <FieldLabel label={t('admin.task.fields.points')} required />
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
                      <FieldLabel label={t('admin.task.fields.location')} required />
                      {locationsLoading ? (
                        <p className="admin-field-note">{t('admin.task.loadingLocations')}</p>
                      ) : hasTaskLocationOptions ? (
                        <select
                          value={taskForm.locationId}
                          onChange={(event) =>
                            setTaskForm((prev) => ({ ...prev, locationId: event.target.value }))
                          }
                        >
                          <option value="">{t('admin.task.selectLocation')}</option>
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
                            {t('admin.task.createLocation')}
                          </button>
                        </div>
                      )}
                    </label>
                    <div className="admin-field">
                      <FieldLabel label={t('admin.task.prerequisites.type1.label')} />
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenPrerequisiteModal('single');
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          textAlign: 'left',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          position: 'relative',
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        {taskForm.prerequisite_task_id ? (
                          <>
                            <div style={{ flexShrink: 0 }}>
                              {(() => {
                                const selectedTask = getSelectedTask(taskForm.prerequisite_task_id);
                                return selectedTask ? <TaskTypeBadge type={selectedTask.type} thumbnailUrl={(selectedTask as any).thumbnail_url} /> : null;
                              })()}
                            </div>
                            <span style={{ flex: 1, textAlign: 'left' }}>
                              {getSelectedTaskTitle(taskForm.prerequisite_task_id)}
                            </span>
                          </>
                        ) : (
                          <span>{t('admin.task.prerequisites.type1.noPrerequisite')}</span>
                        )}
                      </button>
                      <p className="admin-field-note" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {t('admin.task.prerequisites.type1.description')}
                      </p>
                      <p className="admin-field-note" style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#666', fontStyle: 'italic' }}>
                        {t('admin.task.prerequisites.type1.searchHint')}
                      </p>
                    </div>
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label={t('admin.task.prerequisites.type2.label')} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenPrerequisiteModal('multi');
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          textAlign: 'left',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {taskForm.prerequisite_task_ids && taskForm.prerequisite_task_ids.length > 0
                          ? getSelectedTasksCount(taskForm.prerequisite_task_ids)
                          : t('admin.task.prerequisites.type2.placeholder')}
                      </button>
                      <p className="admin-field-note" style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#666', fontStyle: 'italic' }}>
                        {t('admin.task.prerequisites.type2.searchHint')}
                      </p>
                      {taskForm.prerequisite_task_ids && taskForm.prerequisite_task_ids.length > 0 && (
                        <label className="admin-field" style={{ marginTop: '0.5rem' }}>
                          <FieldLabel label={t('admin.task.prerequisites.type2.minCountLabel')} required />
                          <input
                            type="number"
                            min={1}
                            max={taskForm.prerequisite_task_ids.length}
                            value={taskForm.prerequisite_task_count || 1}
                            onChange={(event) =>
                              setTaskForm((prev) => ({
                                ...prev,
                                prerequisite_task_count: Number.parseInt(event.target.value || '1', 10),
                              }))
                            }
                          />
                          <p className="admin-field-note" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {t('admin.task.prerequisites.type2.description', { count: taskForm.prerequisite_task_ids.length })}
                          </p>
                        </label>
                      )}
                    </div>
                    <div className="admin-field">
                      <FieldLabel label={t('admin.task.fields.active')} />
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
                          {taskForm.active ? t('admin.task.fields.active') : t('admin.task.fields.inactive')}
                        </label>
                      </div>
                    </div>
                    <label className="admin-field">
                      <FieldLabel label={t('admin.task.fields.co2Savings')} />
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
                              <span>{t('admin.task.videoSource.url')}</span>
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
                              <span>{t('admin.task.videoSource.upload')}</span>
                            </label>
                          </div>
                        </div>
                        {taskForm.videoSource === 'url' && (
                          <label className="admin-field admin-field-span-2 admin-video-upload-block">
                            <FieldLabel label={t('admin.task.fields.videoUrl')} required />
                            <input
                              type="url"
                              value={taskForm.video_url}
                              onChange={(event) =>
                                setTaskForm((prev) => ({ ...prev, video_url: event.target.value }))
                              }
                              placeholder={t('admin.task.videoUrlPlaceholder')}
                            />
                          </label>
                        )}
                        {taskForm.videoSource === 'upload' && (
                          <div className="admin-field admin-field-span-2 admin-video-upload-block">
                            <FieldLabel label={t('admin.fields.videoFile')} required />
                            <div className="admin-upload-field">
                              <span>{t('admin.task.selectVideoFile')}</span>
                              <div className="admin-upload-control">
                                <label className="admin-upload-button">
                                  <span>{t('admin.task.chooseFile')}</span>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0] ?? null;
                                      setTaskForm((prev) => ({
                                        ...prev,
                                        videoFile: file,
                                        video_url: file ? '' : prev.video_url,
                                      }));
                                    }}
                                  />
                                </label>
                                <span className="admin-upload-filename">
                                  {taskForm.videoFile ? taskForm.videoFile.name : (taskForm.video_url && taskForm.video_url.includes('/uploads/') ? taskForm.video_url.split('/').pop() : t('admin.task.noFileSelected'))}
                                </span>
                                {(taskForm.videoFile || (taskForm.video_url && taskForm.video_url.includes('/uploads/'))) && (
                                  <button
                                    type="button"
                                    className="admin-action-button"
                                    onClick={() => {
                                      setTaskForm((prev) => ({
                                        ...prev,
                                        videoFile: null,
                                        video_url: '',
                                      }));
                                    }}
                                    style={{ marginLeft: 'auto' }}
                                  >
                                    {t('common.actions.delete', 'Löschen')}
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* Video Preview */}
                            {(taskForm.videoFile || (taskForm.video_url && taskForm.video_url.includes('/uploads/'))) && (
                              <div style={{ marginTop: '1rem' }}>
                                <FieldLabel label={t('admin.task.videoPreview', 'Video-Vorschau')} />
                                <div style={{ marginTop: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', overflow: 'hidden', maxWidth: '100%' }}>
                                  {taskForm.videoFile ? (
                                    <video
                                      controls
                                      src={URL.createObjectURL(taskForm.videoFile)}
                                      style={{ width: '100%', maxHeight: '400px', display: 'block' }}
                                    >
                                      {t('tasksComponents.video.notSupported')}
                                    </video>
                                  ) : taskForm.video_url && taskForm.video_url.includes('/uploads/') ? (
                                    <video
                                      controls
                                      src={taskForm.video_url.startsWith('http') ? taskForm.video_url : `${window.location.origin}${taskForm.video_url}`}
                                      style={{ width: '100%', maxHeight: '400px', display: 'block' }}
                                    >
                                      {t('tasksComponents.video.notSupported')}
                                    </video>
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {taskForm.type === 'qr' && (
                      <>
                        <label className="admin-field admin-field-span-2">
                          <FieldLabel label={t('admin.task.fields.qrCodeValue', 'QR-Code (optional - wird automatisch generiert)')} />
                          <input
                            type="text"
                            value={taskForm.qr_code}
                            onChange={(event) =>
                              setTaskForm((prev) => ({ ...prev, qr_code: event.target.value }))
                            }
                            placeholder={t('admin.task.fields.qrCodePlaceholder', 'Leer lassen für automatische Generierung')}
                          />
                          <p className="admin-field-note">
                            {t('admin.task.fields.qrCodeNote', 'Wenn kein QR-Code angegeben wird, wird automatisch ein eindeutiger Code generiert.')}
                          </p>
                        </label>
                        {taskForm.qr_code && taskForm.qr_code.trim() && (
                          <div className="admin-field admin-field-span-2" style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-lg)',
                            background: 'var(--color-background-light, #f9fafb)',
                            borderRadius: 'var(--border-radius)',
                            marginTop: 'var(--spacing-sm)'
                          }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)' }}>
                              {t('admin.task.fields.qrCodePreview', 'QR-Code Vorschau')}
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-md)', background: 'white', borderRadius: 'var(--border-radius)' }}>
                              <QRCode value={taskForm.qr_code.trim()} size={256} />
                            </div>
                            <div style={{ 
                              width: '100%',
                              padding: 'var(--spacing-md)', 
                              background: 'white', 
                              borderRadius: 'var(--border-radius)',
                              textAlign: 'center'
                            }}>
                              <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                                {t('admin.task.fields.qrCodeLabel', 'QR-Code:')}
                              </p>
                              <code style={{ 
                                fontSize: '0.85rem', 
                                wordBreak: 'break-all', 
                                color: 'var(--color-text)',
                                fontFamily: 'monospace'
                              }}>
                                {taskForm.qr_code.trim()}
                              </code>
                            </div>
                          </div>
                        )}
                      </>
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
                        <FieldLabel label={t('admin.task.fields.targetLocation')} required />
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
                          <FieldLabel label={t('admin.task.fields.address')} />
                          <textarea
                            rows={3}
                            value={taskForm.target_address || ''}
                            onChange={(e) =>
                              setTaskForm((prev) => ({ ...prev, target_address: e.target.value }))
                            }
                            placeholder={t('admin.task.targetLocation.addressPlaceholder')}
                          />
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                          <label className="admin-field">
                            <FieldLabel label={t('admin.task.fields.latitude')} required />
                            <input
                              type="number"
                              step="any"
                              value={taskForm.target_latitude || ''}
                              onChange={(e) =>
                                setTaskForm((prev) => ({ ...prev, target_latitude: e.target.value }))
                              }
                              placeholder={t('admin.task.targetLocation.latitudePlaceholder')}
                              min="-90"
                              max="90"
                            />
                          </label>
                          <label className="admin-field">
                            <FieldLabel label={t('admin.task.fields.longitude')} required />
                            <input
                              type="number"
                              step="any"
                              value={taskForm.target_longitude || ''}
                              onChange={(e) =>
                                setTaskForm((prev) => ({ ...prev, target_longitude: e.target.value }))
                              }
                              placeholder={t('admin.task.targetLocation.longitudePlaceholder')}
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
                          <FieldLabel label={t('admin.task.fields.articleSource')} required />
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
                              <span>{t('admin.task.articleSource.url')}</span>
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
                              <span>{t('admin.task.articleSource.content')}</span>
                            </label>
                          </div>
                        </div>
                        {taskForm.articleSource === 'url' && (
                          <label className="admin-field admin-field-span-2">
                            <FieldLabel label={t('admin.task.fields.articleUrl')} required />
                            <input
                              type="url"
                              value={taskForm.article_url}
                              onChange={(event) =>
                                setTaskForm((prev) => ({ ...prev, article_url: event.target.value }))
                              }
                              placeholder={t('admin.task.articleUrlPlaceholder')}
                            />
                          </label>
                        )}
                        {taskForm.articleSource === 'content' && (
                          <label className="admin-field admin-field-span-2">
                            <FieldLabel label={t('admin.task.fields.articleContent')} required />
                            <textarea
                              value={taskForm.article_content}
                              onChange={(event) =>
                                setTaskForm((prev) => ({ ...prev, article_content: event.target.value }))
                              }
                              rows={10}
                              placeholder={t('admin.task.articleContentPlaceholder')}
                            />
                          </label>
                        )}
                      </>
                    )}
                    {taskForm.type === 'survey' && (
                      <>
                        <div className="admin-field admin-field-span-2">
                          <FieldLabel label={t('admin.task.fields.surveyType')} />
                          <select
                            value={taskForm.surveyType}
                            onChange={(e) =>
                              setTaskForm((prev) => ({
                                ...prev,
                                surveyType: e.target.value as 'single_choice' | 'multiple_choice' | 'text' | 'rating' | 'mixed',
                              }))
                            }
                          >
                            <option value="mixed">{t('admin.task.survey.typeMixed')}</option>
                            <option value="single_choice">{t('admin.task.survey.typeSingleChoiceOnly')}</option>
                            <option value="multiple_choice">{t('admin.task.survey.typeMultipleChoiceOnly')}</option>
                            <option value="text">{t('admin.task.survey.typeTextOnly')}</option>
                            <option value="rating">{t('admin.task.survey.typeRatingOnly')}</option>
                          </select>
                        </div>
                      </>
                    )}
                {taskForm.type === 'survey' && (
                  <div className="admin-form-full admin-quiz-block">
                    <FieldLabel label={t('admin.task.survey.title')} required />
                    <SurveyBuilder
                      questions={taskForm.surveyQuestions}
                      onChange={(questions) =>
                        setTaskForm((prev) => ({
                          ...prev,
                          surveyQuestions: questions,
                        }))
                      }
                    />
                  </div>
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
                    <h3>{t('admin.task.recurrence.title')}</h3>
                    <p>{t('admin.task.recurrence.subtitle')}</p>
                  </div>
                  <div className="admin-form-grid">
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label={t('admin.task.recurrence.typeLabel')} />
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
                        <option value="once">{t('admin.task.recurrence.once')}</option>
                        <option value="daily">{t('admin.task.recurrence.daily')}</option>
                        <option value="weekly">{t('admin.task.recurrence.weekly')}</option>
                        <option value="monthly">{t('admin.task.recurrence.monthly')}</option>
                      </select>
                    </div>
                  </div>
                </section>
                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <h3>Metadaten & Zugriff</h3>
                    <p>Metadaten und zusätzliche Informationen zur Aufgabe</p>
                  </div>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <FieldLabel label="Kategorie" />
                      <select
                        value={taskForm.category || ''}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            category: event.target.value as TaskFormState['category'] || undefined,
                          }))
                        }
                        className="admin-select"
                      >
                        <option value="">-- Keine Auswahl --</option>
                        {(taskParametersByType['category'] || []).map((param) => (
                          <option key={param.id} value={param.value}>
                            {param.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Schwierigkeitsgrad" />
                      <select
                        value={taskForm.difficulty || ''}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            difficulty: event.target.value as TaskFormState['difficulty'] || undefined,
                          }))
                        }
                        className="admin-select"
                      >
                        <option value="">-- Keine Auswahl --</option>
                        {(taskParametersByType['difficulty'] || []).map((param) => (
                          <option key={param.id} value={param.value}>
                            {param.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Zeitaufwand" />
                      <select
                        value={taskForm.time_required || ''}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            time_required: event.target.value as TaskFormState['time_required'] || undefined,
                          }))
                        }
                        className="admin-select"
                      >
                        <option value="">-- Keine Auswahl --</option>
                        {(taskParametersByType['time_required'] || []).map((param) => (
                          <option key={param.id} value={param.value}>
                            {param.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Ort/Werkzeug" />
                      <select
                        value={taskForm.location_tool || ''}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            location_tool: event.target.value as TaskFormState['location_tool'] || undefined,
                          }))
                        }
                        className="admin-select"
                      >
                        <option value="">-- Keine Auswahl --</option>
                        {(taskParametersByType['location_tool'] || []).map((param) => (
                          <option key={param.id} value={param.value}>
                            {param.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label="Teams (optional)" />
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                        Wenn Teams ausgewählt werden, ist diese Aufgabe nur für Mitglieder dieser Teams sichtbar. Keine Auswahl = für alle sichtbar.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
                        {teamsLoading ? (
                          <div style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>Lade Teams...</div>
                        ) : teamsList.filter(t => t.active).length === 0 ? (
                          <div style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>Keine aktiven Teams verfügbar</div>
                        ) : (
                          teamsList.filter(t => t.active).map((team) => (
                            <label key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={(taskForm.allowed_teams || []).includes(team.id)}
                                onChange={(e) => {
                                  const currentTeams = taskForm.allowed_teams || [];
                                  if (e.target.checked) {
                                    const newTeams = [...currentTeams, team.id];
                                    setTaskForm((prev) => ({
                                      ...prev,
                                      allowed_teams: newTeams,
                                    }));
                                  } else {
                                    const newTeams = currentTeams.filter((id) => id !== team.id);
                                    setTaskForm((prev) => ({
                                      ...prev,
                                      allowed_teams: newTeams,
                                    }));
                                  }
                                }}
                              />
                              <span>{team.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label="Wettbewerbe (optional)" />
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                        Wenn Wettbewerbe ausgewählt werden, ist diese Aufgabe nur für Teilnehmer dieser Wettbewerbe sichtbar. Keine Auswahl = für alle sichtbar.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
                        {contestsLoading ? (
                          <div style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>Lade Wettbewerbe...</div>
                        ) : contestsList.filter(c => c.active).length === 0 ? (
                          <div style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>Keine aktiven Wettbewerbe verfügbar</div>
                        ) : (
                          contestsList.filter(c => c.active).map((contest) => (
                            <label key={contest.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={(taskForm.allowed_contests || []).includes(contest.id)}
                                onChange={(e) => {
                                  const currentContests = taskForm.allowed_contests || [];
                                  if (e.target.checked) {
                                    setTaskForm((prev) => ({
                                      ...prev,
                                      allowed_contests: [...currentContests, contest.id],
                                    }));
                                  } else {
                                    setTaskForm((prev) => ({
                                      ...prev,
                                      allowed_contests: currentContests.filter((id) => id !== contest.id),
                                    }));
                                  }
                                }}
                              />
                              <span>{contest.name}</span>
                            </label>
                          ))
                        )}
                      </div>
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
                      <p className="admin-publish-hint">{t('admin.task.publishHint.editing')}</p>
                    ) : isUploadingVideo ? (
                      <p className="admin-publish-hint">{t('admin.task.publishHint.uploading')}</p>
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
                        {t('common.actions.cancel', 'Abbrechen')}
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
              <h2>{isEditingReward ? t('admin.reward.edit.title') : t('admin.reward.create.title')}</h2>
              <p>
                {isEditingReward
                  ? t('admin.reward.edit.subtitle')
                  : t('admin.reward.create.subtitle')}
              </p>
            </div>
            <div className="admin-actions">
              {!isEditingReward && (
                <button
                  className="admin-icon-button"
                  onClick={() => refetchRewardTemplates()}
                  title={t('admin.reward.refresh')}
                >
                  <Icon name="refresh" />
                  <span className="sr-only">{t('admin.reward.refresh')}</span>
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
              {t('admin.reward.locationsError')}
            </p>
          )}

          <div className="admin-form-card">
            {!isEditingReward && (
              <label className="admin-field">
                <span>{t('admin.reward.createFrom')}</span>
                <select
                  value={rewardSource}
                  onChange={(event) => setRewardSource(event.target.value as RewardSource)}
                >
                  <option value="">{t('admin.reward.selectOption')}</option>
                  <option value="existing">{t('admin.reward.existingReward')}</option>
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
                  <option value="">{t('admin.reward.selectReward')}</option>
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
                      <h3>{t('admin.reward.details.title')}</h3>
                      <p>Define the reward content and optional integrations.</p>
                    </div>
                    <RewardTypeBadge type={rewardForm.type} thumbnailUrl={rewardForm.thumbnailUrl} />
                  </div>
                  <div className="admin-form-grid admin-form-grid-two">
                    {isEditingReward && (
                      <label className="admin-field">
                        <FieldLabel label={t('admin.reward.fields.type')} required />
                        <select
                          value={rewardForm.type}
                          onChange={(event) =>
                            setRewardForm((prev) => ({
                              ...prev,
                              type: event.target.value as RewardType,
                            }))
                          }
                          className="admin-select"
                        >
                          {REWARD_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label className={`admin-field ${isEditingReward ? '' : 'admin-field-span-2'}`}>
                      <FieldLabel label={t('admin.task.fields.title')} required />
                      <input
                        type="text"
                        value={rewardForm.title}
                        onChange={(event) =>
                          setRewardForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </label>
                    <label className="admin-field admin-field-span-2">
                      <FieldLabel label={t('admin.task.fields.description')} required />
                      <textarea
                        value={rewardForm.description}
                        onChange={(event) =>
                          setRewardForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label="Thumbnail (optional)" />
                      <div className="admin-upload-field">
                        {(rewardForm.thumbnailUrl || rewardForm.thumbnailFile) && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <img
                              src={rewardForm.thumbnailFile ? URL.createObjectURL(rewardForm.thumbnailFile) : rewardForm.thumbnailUrl || ''}
                              alt="Thumbnail preview"
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setRewardForm((prev) => ({ ...prev, thumbnailFile: null, thumbnailUrl: null }));
                              }}
                              style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <div className="admin-upload-control">
                          <label className="admin-upload-button">
                            <span>Choose Thumbnail</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                setRewardForm((prev) => ({
                                  ...prev,
                                  thumbnailFile: file,
                                  thumbnailUrl: file ? null : prev.thumbnailUrl,
                                }));
                              }}
                            />
                          </label>
                          <span className="admin-upload-filename">
                            {rewardForm.thumbnailFile ? rewardForm.thumbnailFile.name : rewardForm.thumbnailUrl ? 'Current thumbnail' : 'No thumbnail selected'}
                          </span>
                        </div>
                        <p className="admin-field-note">PNG or JPG, max 2MB. Will be resized to 48x48px.</p>
                      </div>
                    </div>
                    <label className="admin-field">
                      <FieldLabel label={t('admin.reward.fields.pointsCost')} required />
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
                      <FieldLabel label={t('admin.task.fields.location')} required />
                      {locationsLoading ? (
                        <p className="admin-field-note">{t('admin.task.loadingLocations')}</p>
                      ) : hasRewardLocationOptions ? (
                        <select
                          value={rewardForm.locationId}
                          onChange={(event) =>
                            setRewardForm((prev) => ({ ...prev, locationId: event.target.value }))
                          }
                        >
                          <option value="">{t('admin.task.selectLocation')}</option>
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
                            {t('admin.task.createLocation')}
                          </button>
                        </div>
                      )}
                    </label>
                    <div className="admin-field">
                      <FieldLabel label={t('admin.task.fields.active')} />
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
                          {rewardForm.active ? t('admin.task.fields.active') : t('admin.task.fields.inactive')}
                        </label>
                      </div>
                    </div>
                    <label className="admin-field">
                      <FieldLabel label={t('admin.reward.fields.voucherCode')} />
                      <input
                        type="text"
                        value={rewardForm.voucherCode}
                        onChange={(event) =>
                          setRewardForm((prev) => ({ ...prev, voucherCode: event.target.value }))
                        }
                        placeholder={t('admin.reward.voucherCodePlaceholder')}
                      />
                    </label>
                    <label className="admin-field admin-field-span-2">
                      <FieldLabel label={t('admin.reward.fields.externalApiId')} />
                      <input
                        type="text"
                        value={rewardForm.externalApiId}
                        onChange={(event) =>
                          setRewardForm((prev) => ({ ...prev, externalApiId: event.target.value }))
                        }
                        placeholder={t('admin.reward.externalApiPlaceholder')}
                      />
                    </label>
                  </div>
                </section>

                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <h3>{t('admin.reward.recurrence.title')}</h3>
                    <p>{t('admin.reward.recurrence.subtitle')}</p>
                  </div>
                  <div className="admin-form-grid">
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label={t('admin.reward.recurrence.typeLabel')} />
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
                        <option value="once">{t('admin.reward.recurrence.once')}</option>
                        <option value="daily">{t('admin.reward.recurrence.daily')}</option>
                        <option value="weekly">{t('admin.reward.recurrence.weekly')}</option>
                        <option value="monthly">{t('admin.reward.recurrence.monthly')}</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="admin-form-section">
                  <div className="admin-form-section-header">
                    <h3>Metadaten & Zugriff</h3>
                    <p>Metadaten und zusätzliche Informationen zur Belohnung</p>
                  </div>
                  <div className="admin-form-grid">
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label="Teams (optional)" />
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                        Wenn Teams ausgewählt werden, ist diese Belohnung nur für Mitglieder dieser Teams sichtbar. Keine Auswahl = für alle sichtbar.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
                        {teamsLoading ? (
                          <div style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>Lade Teams...</div>
                        ) : teamsList.filter(t => t.active).length === 0 ? (
                          <div style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>Keine aktiven Teams verfügbar</div>
                        ) : (
                          teamsList.filter(t => t.active).map((team) => (
                            <label key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={(rewardForm.allowed_teams || []).includes(team.id)}
                                onChange={(e) => {
                                  const currentTeams = rewardForm.allowed_teams || [];
                                  if (e.target.checked) {
                                    setRewardForm((prev) => ({
                                      ...prev,
                                      allowed_teams: [...currentTeams, team.id],
                                    }));
                                  } else {
                                    setRewardForm((prev) => ({
                                      ...prev,
                                      allowed_teams: currentTeams.filter((id) => id !== team.id),
                                    }));
                                  }
                                }}
                              />
                              <span>{team.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="admin-field admin-field-span-2">
                      <FieldLabel label="Wettbewerbe (optional)" />
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                        Wenn Wettbewerbe ausgewählt werden, ist diese Belohnung nur für Teilnehmer dieser Wettbewerbe sichtbar. Keine Auswahl = für alle sichtbar.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
                        {contestsLoading ? (
                          <div style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>Lade Wettbewerbe...</div>
                        ) : contestsList.filter(c => c.active).length === 0 ? (
                          <div style={{ padding: '0.5rem', color: 'var(--color-text-light)' }}>Keine aktiven Wettbewerbe verfügbar</div>
                        ) : (
                          contestsList.filter(c => c.active).map((contest) => (
                            <label key={contest.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={(rewardForm.allowed_contests || []).includes(contest.id)}
                                onChange={(e) => {
                                  const currentContests = rewardForm.allowed_contests || [];
                                  if (e.target.checked) {
                                    setRewardForm((prev) => ({
                                      ...prev,
                                      allowed_contests: [...currentContests, contest.id],
                                    }));
                                  } else {
                                    setRewardForm((prev) => ({
                                      ...prev,
                                      allowed_contests: currentContests.filter((id) => id !== contest.id),
                                    }));
                                  }
                                }}
                              />
                              <span>{contest.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Art" />
                      <select
                        value={rewardForm.reward_art || ''}
                        onChange={(event) =>
                          setRewardForm((prev) => ({
                            ...prev,
                            reward_art: event.target.value as RewardFormState['reward_art'] || undefined,
                          }))
                        }
                        className="admin-select"
                      >
                        <option value="">-- Keine Auswahl --</option>
                        {(rewardParametersByType['reward_art'] || []).map((param) => (
                          <option key={param.id} value={param.value}>
                            {param.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Kategorie" />
                      <select
                        value={rewardForm.kategorie || ''}
                        onChange={(event) =>
                          setRewardForm((prev) => ({
                            ...prev,
                            kategorie: event.target.value as RewardFormState['kategorie'] || undefined,
                          }))
                        }
                        className="admin-select"
                      >
                        <option value="">-- Keine Auswahl --</option>
                        {(rewardParametersByType['kategorie'] || []).map((param) => (
                          <option key={param.id} value={param.value}>
                            {param.value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-field">
                      <FieldLabel label="Mögliche Punkte" />
                      <input
                        type="number"
                        min={0}
                        value={rewardForm.moegliche_punkte !== undefined && rewardForm.moegliche_punkte !== null ? rewardForm.moegliche_punkte : ''}
                        onChange={(event) =>
                          setRewardForm((prev) => ({
                            ...prev,
                            moegliche_punkte: event.target.value ? Number.parseInt(event.target.value || '0', 10) : undefined,
                          }))
                        }
                        placeholder="Optional: Punkte beim Einlösen"
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
                      <p className="admin-publish-hint">{t('admin.reward.publishHint.editing')}</p>
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
                        {t('common.actions.cancel', 'Abbrechen')}
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
              <h2>{isEditingLocation ? t('admin.location.edit.title') : t('admin.location.create.title')}</h2>
              <p>
                {isEditingLocation ? t('admin.location.edit.subtitle') : t('admin.location.create.subtitle')}
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
                title={t('admin.location.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{t('admin.location.back')}</span>
              </button>
            </div>
          </header>

          <div className="admin-form-card">
            <div className="admin-form-layout">
              <section className="admin-form-section">
                <div className="admin-form-section-header">
                  <div>
                    <h3>{t('admin.location.details.title')}</h3>
                    <p>Provide the basic information for this location.</p>
                  </div>
                </div>
                <div className={`admin-form-grid admin-form-grid-two ${locationForm.mode === 'physical' ? 'admin-form-grid-location' : ''}`}>
                  <label className="admin-field admin-field-span-2">
                    <FieldLabel label={t('admin.location.fields.name')} required />
                    <input
                      type="text"
                      value={locationForm.name}
                      onChange={(event) =>
                        setLocationForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="admin-field admin-field-span-2">
                    <FieldLabel label={t('admin.location.fields.description')} required />
                    <textarea
                      rows={3}
                      value={locationForm.description}
                      onChange={(event) =>
                        setLocationForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </label>
                  <div className="admin-field">
                    <FieldLabel label={t('admin.location.fields.active')} />
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
                        {locationForm.active ? t('admin.location.fields.active') : t('admin.location.fields.inactive')}
                      </label>
                    </div>
                  </div>
                  <div className="admin-field admin-field-span-2">
                    <FieldLabel label={t('admin.location.fields.locationType')} required />
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
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <textarea
                            rows={3}
                            value={locationForm.address}
                            onChange={(event) =>
                              setLocationForm((prev) => ({ ...prev, address: event.target.value }))
                            }
                            placeholder="Enter the full address"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={handleGeocodeAddress}
                            className="admin-action-button"
                            style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem', marginTop: 0 }}
                            title="Generate coordinates from address"
                          >
                            📍 Geocode
                          </button>
                        </div>
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
                  <div className="admin-field admin-field-span-2">
                    <FieldLabel label={t('admin.location.fields.category')} />
                    <select
                      value={locationForm.category}
                      onChange={(event) =>
                        setLocationForm((prev) => ({ ...prev, category: event.target.value }))
                      }
                    >
                      <option value="">{t('admin.location.categorySelect')}</option>
                      <option value="online">{t('admin.location.categories.online')}</option>
                      <option value="hotel_reception">{t('admin.location.categories.hotel_reception')}</option>
                      <option value="hotel_restaurant">{t('admin.location.categories.hotel_restaurant')}</option>
                      <option value="external">{t('admin.location.categories.external')}</option>
                      <option value="physical">{t('admin.location.categories.physical')}</option>
                    </select>
                  </div>
                  <label className="admin-field admin-field-span-2">
                    <FieldLabel label={t('admin.location.fields.categoryDescription')} />
                    <textarea
                      rows={2}
                      value={locationForm.categoryDescription}
                      onChange={(event) =>
                        setLocationForm((prev) => ({ ...prev, categoryDescription: event.target.value }))
                      }
                      placeholder={t('admin.location.categoryDescriptionPlaceholder')}
                    />
                  </label>
                </div>
              </section>

              <div className="admin-form-actions">
                <div className="admin-form-feedback">
                  {locationMessage ? (
                    <p className={locationMessage.type === 'error' ? 'admin-error' : 'admin-success'}>
                      {locationMessage.text}
                    </p>
                  ) : isEditingLocation ? (
                    <p className="admin-publish-hint">{t('admin.location.publishHint.editing')}</p>
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
                      {t('common.actions.cancel', 'Abbrechen')}
                    </button>
                  )}
                  <button
                    className="admin-submit"
                    onClick={handleLocationSubmit}
                    disabled={isLocationSubmitDisabled}
                  >
                    {isEditingLocation ? t('admin.location.updateButton') : t('admin.location.createButton')}
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

      {mode === 'locationManage' && (() => {
        const locationColumns: TableColumn<AdminLocation>[] = [
          {
            key: 'name',
            label: 'Name',
            render: (location) => (
              <div className="admin-table-primary">
                <span className="admin-table-title">{location.name}</span>
                {location.description && (
                  <span className="admin-table-subtitle">{location.description}</span>
                )}
              </div>
            ),
          },
          {
            key: 'type',
            label: 'Type',
            render: (location) => (
              <span className="admin-status-badge">
                {location.is_online ? 'Online' : 'Physical'}
              </span>
            ),
          },
          {
            key: 'details',
            label: 'Details',
            render: (location) =>
              location.is_online ? (
                <span className="admin-table-subtitle">{t('admin.locationManage.online')}</span>
              ) : (
                <div className="admin-table-secondary">
                  {location.address && (
                    <span className="admin-table-subtitle">{location.address}</span>
                  )}
                  <span className="admin-table-subtitle">
                    {location.latitude}, {location.longitude}
                  </span>
                </div>
              ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (location) => (
              <span
                className={`admin-status-badge ${location.active ? 'active' : 'inactive'}`}
              >
                {location.active ? 'Active' : 'Inactive'}
              </span>
            ),
          },
        ];

        return (
          <section className="admin-section">
            <ManagementHeader
              title={t('admin.locationManage.title')}
              subtitle={t('admin.locationManage.existing.subtitle')}
              cssPrefix="admin"
              onBack={() => setMode(null)}
              onRefresh={() => refetchLocations()}
              showBack={true}
              showRefresh={!isEditingLocation}
              isEditing={isEditingLocation}
              onCancelEdit={cancelLocationEdit}
            />

            {locationsLoading && <p>{t('admin.locationManage.loading')}</p>}
            {Boolean(locationsError) && (
              <p className="admin-error">{t('admin.locationManage.loadError')}</p>
            )}

            <button
              className="admin-action-button admin-mobile-new-location-button"
              type="button"
              onClick={goToLocationCreation}
            >
              {t('admin.locationManage.newButton')}
            </button>

            <ManagementCard
              cssPrefix="admin"
              title={t('admin.locationManage.existing.title')}
              subtitle={t('admin.locationManage.existing.subtitle')}
              message={locationBulkOperations.message}
              topControls={
                <>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      style={COMPACT_TOGGLE_STYLE}
                      checked={includeInactiveLocations}
                      onChange={(event) => {
                        setIncludeInactiveLocations(event.target.checked);
                        locationSelection.deselectAll();
                      }}
                    />
                    <span>{t('admin.locationManage.showInactive')}</span>
                  </label>
                  <button
                    className="admin-action-button"
                    type="button"
                    onClick={goToLocationCreation}
                  >
                    {t('admin.locationManage.newButton')}
                  </button>
                </>
              }
            >
              <BulkActionsBar
                cssPrefix="admin"
                hasSelection={hasLocationSelection}
                selectionCount={locationSelection.selectedIds.length}
                onActivate={() => handleLocationBulkStatus(true)}
                onDeactivate={() => handleLocationBulkStatus(false)}
                onDelete={handleLocationBulkDelete}
                activateLabel={t('admin.locationManage.activate')}
                deactivateLabel={t('admin.locationManage.deactivate')}
                deleteLabel={t('common.actions.delete', 'Löschen')}
                selectionCountLabel={(count) =>
                  t('admin.locationManage.selectedCount', { count })
                }
                noSelectionLabel={t('admin.locationManage.noSelection')}
              />
              <ManagementTable
                items={locationsList}
                columns={locationColumns}
                cssPrefix="admin"
                selectedIds={locationSelection.selectedIds}
                onSelectAll={(checked) =>
                  checked ? locationSelection.selectAll() : locationSelection.deselectAll()
                }
                onSelectItem={(id, checked) => locationSelection.toggle(id, checked)}
                allSelected={allLocationsSelected}
                emptyMessage={t('admin.locationManage.noLocations', 'No locations found.')}
                actionsColumn={{
                  render: (location) => {
                    const isDefaultLocation = isDefaultLocationRecord(location);
                    return (
                      <>
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => startLocationEdit(location)}
                        >
                          {t('common.actions.edit', 'Bearbeiten')}
                        </button>
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => handleLocationStatusChange(location.id, !location.active)}
                          disabled={isDefaultLocation}
                        >
                          {location.active
                            ? t('admin.locationManage.deactivate')
                            : t('admin.locationManage.activate')}
                        </button>
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => handleLocationDelete(location)}
                          disabled={isDefaultLocation}
                        >
                          {t('common.actions.delete', 'Löschen')}
                        </button>
                      </>
                    );
                  },
                }}
              />
            </ManagementCard>
          </section>
        );
      })()}

      {mode === 'taskManage' && (() => {
        return (
          <section className="admin-section">
          <ManagementHeader
            title={t('admin.taskManage.title')}
            subtitle={t('admin.taskManage.subtitle')}
            cssPrefix="admin"
            onBack={() => setMode(null)}
            onRefresh={() => refetchTasks()}
            showBack={true}
            showRefresh={!isEditingTask}
            isEditing={isEditingTask}
            onCancelEdit={cancelTaskEdit}
          />

          {tasksLoading && <p>{t('admin.taskManage.loading')}</p>}
          {Boolean(tasksError) && <p className="admin-error">{t('admin.taskManage.loadError')}</p>}

          <button 
            className="admin-action-button admin-mobile-new-task-button" 
            type="button" 
            onClick={goToTaskCreation}
          >
            {t('admin.taskManage.newButton')}
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
                      taskSelection.deselectAll();
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
                  {(taskFilterLocation || taskFilterStatus || taskFilterRecurrence || taskFilterType || taskFilterTitle.trim() || taskFilterPointsMin.trim() || taskFilterPointsMax.trim()) && (
                    <span className="admin-mobile-filter-badge">
                      {[taskFilterLocation, taskFilterStatus, taskFilterRecurrence, taskFilterType, taskFilterTitle.trim() ? 'title' : null, (taskFilterPointsMin.trim() || taskFilterPointsMax.trim()) ? 'points' : null].filter(Boolean).length}
                    </span>
                  )}
                </button>
                <button className="admin-action-button admin-desktop-new-task-button" type="button" onClick={goToTaskCreation}>
                  {t('admin.taskManage.newButton')}
                </button>
              </div>
            </div>
            {taskBulkOperations.message && (
              <p
                className={
                  taskBulkOperations.message.type === 'error' ? 'admin-error' : 'admin-success'
                }
              >
                {taskBulkOperations.message.text}
              </p>
            )}
            <BulkActionsBar
              cssPrefix="admin"
              hasSelection={hasTaskSelection}
              selectionCount={taskSelection.selectedIds.length}
              onActivate={() => handleTaskBulkStatus(true)}
              onDeactivate={() => handleTaskBulkStatus(false)}
              onDelete={handleTaskBulkDelete}
            />
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
                          event.target.checked
                            ? taskSelection.selectAll()
                            : taskSelection.deselectAll()
                        }
                        aria-label={t('admin.taskManage.selectAll')}
                      />
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTaskFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTaskFilterDropdown('title');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Task {taskFilterTitle && '✓'}
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTaskFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTaskFilterDropdown('type');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {t('admin.filters.typeIcon')} {taskFilterType && '✓'}
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
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTaskFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTaskFilterDropdown('points');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Points {(taskFilterPointsMin || taskFilterPointsMax) && '✓'}
                    </th>
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
                      {t('admin.filters.recurrence')} {taskFilterRecurrence && '✓'}
                    </th>
                    <th>Kategorie</th>
                    <th>Schwierigkeit</th>
                    <th>Zeitaufwand</th>
                    <th>Ort/Werkzeug</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="admin-table-empty">
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isSelected = taskSelection.isSelected(task.id);
                      return (
                        <tr key={task.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="admin-checkbox"
                              style={COMPACT_TOGGLE_STYLE}
                              checked={isSelected}
                              onChange={(event) =>
                                taskSelection.toggleSelection(task.id, event.target.checked)
                              }
                              aria-label={`Select task ${task.title}`}
                            />
                          </td>
                          <td data-label="Task">
                            <div className="admin-table-primary">
                              <span className="admin-table-title">
                                {task.title || t('admin.task.untitled')}
                              </span>
                              {task.description && (
                                <span className="admin-table-subtitle">{task.description}</span>
                              )}
                            </div>
                          </td>
                          <td data-label={t('admin.filters.typeIcon')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <TaskTypeIcon type={task.type} thumbnailUrl={(task as any).thumbnail_url} />
                              <span>{task.type}</span>
                            </div>
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
                          <td data-label={t('admin.filters.recurrence')}>
                            <span className="admin-table-secondary">
                              {(() => {
                                const recurrence = ((task as any).recurrence || 'once') as 'once' | 'daily' | 'weekly' | 'monthly';
                                return t(`admin.task.recurrence.${recurrence}`).split(' - ')[0];
                              })()}
                            </span>
                          </td>
                          <td data-label="Kategorie">
                            <span className="admin-table-secondary">
                              {(task as any).category || '—'}
                            </span>
                          </td>
                          <td data-label="Schwierigkeit">
                            <span className="admin-table-secondary">
                              {(task as any).difficulty || '—'}
                            </span>
                          </td>
                          <td data-label="Zeitaufwand">
                            <span className="admin-table-secondary">
                              {(task as any).time_required || '—'}
                            </span>
                          </td>
                          <td data-label="Ort/Werkzeug">
                            <span className="admin-table-secondary">
                              {(task as any).location_tool || '—'}
                            </span>
                          </td>
                          <td data-label="Actions" className="admin-table-actions">
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => startTaskEdit(task)}
                            >
                              {t('common.actions.edit', 'Bearbeiten')}
                            </button>
                            {task.type === 'qr' && (
                              <button
                                className="admin-action-button"
                                type="button"
                                onClick={async () => {
                                  setLoadingTaskQr(true);
                                  try {
                                    const response = await api.getTaskQrCode(task.id);
                                    setTaskQrCode(response.qrCode);
                                    setShowTaskQrModal(true);
                                  } catch (error: any) {
                                    showToast({
                                      type: 'error',
                                      title: t('admin.task.qrCodeError', 'Fehler'),
                                      message: error?.response?.data?.error || t('admin.task.qrCodeErrorMessage', 'QR-Code konnte nicht geladen werden'),
                                    });
                                  } finally {
                                    setLoadingTaskQr(false);
                                  }
                                }}
                                disabled={loadingTaskQr}
                              >
                                {loadingTaskQr ? t('common.loading', 'Lädt...') : t('admin.task.showQrCode', 'QR-Code anzeigen')}
                              </button>
                            )}
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => handleTaskStatusChange(task.id, !task.active)}
                            >
                              {task.active ? t('admin.taskManage.deactivate') : t('admin.taskManage.activate')}
                            </button>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => handleTaskDelete(task.id)}
                            >
                              {t('common.actions.delete', 'Löschen')}
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
                      : taskFilterDropdown === 'type'
                      ? taskFilterOptions.types
                      : undefined
                  }
                  selectedValue={
                    taskFilterDropdown === 'location'
                      ? taskFilterLocation
                      : taskFilterDropdown === 'status'
                      ? taskFilterStatus
                      : taskFilterDropdown === 'recurrence'
                      ? taskFilterRecurrence
                      : taskFilterDropdown === 'type'
                      ? taskFilterType
                      : undefined
                  }
                  onSelect={(value) => {
                    if (taskFilterDropdown === 'location') {
                      setTaskFilterLocation(value);
                    } else if (taskFilterDropdown === 'status') {
                      setTaskFilterStatus(value as 'active' | 'inactive' | null);
                    } else if (taskFilterDropdown === 'recurrence') {
                      setTaskFilterRecurrence(value);
                    } else if (taskFilterDropdown === 'type') {
                      setTaskFilterType(value);
                    }
                  }}
                  type={taskFilterDropdown}
                  textValue={taskFilterDropdown === 'title' ? taskFilterTitle : undefined}
                  onTextChange={taskFilterDropdown === 'title' ? setTaskFilterTitle : undefined}
                  minValue={taskFilterDropdown === 'points' ? taskFilterPointsMin : undefined}
                  maxValue={taskFilterDropdown === 'points' ? taskFilterPointsMax : undefined}
                  onMinChange={taskFilterDropdown === 'points' ? setTaskFilterPointsMin : undefined}
                  onMaxChange={taskFilterDropdown === 'points' ? setTaskFilterPointsMax : undefined}
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
              title: taskFilterTitle,
              pointsMin: taskFilterPointsMin,
              pointsMax: taskFilterPointsMax,
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
            onTitleChange={setTaskFilterTitle}
            onPointsMinChange={setTaskFilterPointsMin}
            onPointsMaxChange={setTaskFilterPointsMax}
            onClearAll={() => {
              setTaskFilterLocation(null);
              setTaskFilterStatus(null);
              setTaskFilterRecurrence(null);
              setTaskFilterType(null);
              setTaskFilterTitle('');
              setTaskFilterPointsMin('');
              setTaskFilterPointsMax('');
            }}
            filterType="task"
          />
        </section>
        );
      })()}

      {mode === 'rewardManage' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{t('admin.rewardManage.title')}</h2>
              <p>{t('admin.rewardManage.subtitle')}</p>
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
                      rewardSelection.deselectAll();
                    }}
                  />
                  <span>{t('admin.taskManage.showInactive')}</span>
                </label>
                <button
                  className="admin-mobile-filter-button"
                  type="button"
                  onClick={() => setIsMobileRewardFilterOpen(true)}
                  aria-label={t('admin.taskManage.openFilters')}
                >
                  <Icon name="filter" />
                  {(rewardFilterLocation || rewardFilterStatus || rewardFilterRecurrence || rewardFilterType || rewardFilterTitle.trim() || rewardFilterCostMin.trim() || rewardFilterCostMax.trim()) && (
                    <span className="admin-mobile-filter-badge">
                      {[rewardFilterLocation, rewardFilterStatus, rewardFilterRecurrence, rewardFilterType, rewardFilterTitle.trim() ? 'title' : null, (rewardFilterCostMin.trim() || rewardFilterCostMax.trim()) ? 'cost' : null].filter(Boolean).length}
                    </span>
                  )}
                </button>
                <button className="admin-action-button" type="button" onClick={goToRewardCreation}>
                  {t('admin.rewardManage.newButton')}
                </button>
              </div>
            </div>
            {rewardBulkOperations.message && (
              <p
                className={
                  rewardBulkOperations.message.type === 'error' ? 'admin-error' : 'admin-success'
                }
              >
                {rewardBulkOperations.message.text}
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
                    {t('admin.rewardManage.activate')}
                  </button>
                  <button
                    className="admin-action-button"
                    onClick={() => handleRewardBulkStatus(false)}
                    disabled={!hasRewardSelection}
                    type="button"
                  >
                    {t('admin.rewardManage.deactivate')}
                  </button>
                  <button
                    className="admin-action-button"
                    onClick={handleRewardBulkDelete}
                    disabled={!hasRewardSelection}
                    type="button"
                  >
                    {t('common.actions.delete', 'Löschen')}
                  </button>
              </div>
              <span className="admin-selection-count">
                {hasRewardSelection
                  ? t('admin.rewardManage.selectedCount', { count: rewardSelection.selectedIds.length })
                  : t('admin.rewardManage.noSelection')}
              </span>
            </div>
            <div className="admin-table-wrapper admin-table-wrapper-rewards">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        style={COMPACT_TOGGLE_STYLE}
                        checked={allRewardsSelected && filteredRewards.length > 0}
                        disabled={!filteredRewards.length}
                        onChange={(event) =>
                          event.target.checked
                            ? rewardSelection.selectAll()
                            : rewardSelection.deselectAll()
                        }
                        aria-label={t('admin.rewardManage.selectAll')}
                      />
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setRewardFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setRewardFilterDropdown('title');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      Reward {rewardFilterTitle && '✓'}
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setRewardFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setRewardFilterDropdown('type');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {t('admin.filters.typeIcon')} {rewardFilterType && '✓'}
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
                      {t('admin.filters.recurrence')} {rewardFilterRecurrence && '✓'}
                    </th>
                    <th>Art</th>
                    <th>Kategorie</th>
                    <th>Mögliche Punkte</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRewards.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="admin-table-empty">
                        No rewards found.
                      </td>
                    </tr>
                  ) : (
                    filteredRewards.map((reward) => {
                      const isSelected = rewardSelection.isSelected(reward.id);
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
                                rewardSelection.toggle(reward.id, event.target.checked)
                              }
                              aria-label={`Select reward ${reward.title}`}
                            />
                          </td>
                          <td data-label="Reward">
                             <div className="admin-table-primary">
                               <span className="admin-table-title">
                                 {reward.title || t('admin.reward.untitled')}
                               </span>
                               {reward.description && (
                                 <span className="admin-table-subtitle">{reward.description}</span>
                               )}
                             </div>
                           </td>
                          <td data-label={t('admin.filters.typeIcon')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <RewardTypeIcon type={reward.reward_type as RewardType} thumbnailUrl={(reward as any).thumbnail_url} />
                              <span>{reward.reward_type}</span>
                            </div>
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
                          <td data-label="Cost">
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{cost}</span>
                          </td>
                          <td data-label="Status">
                             <span
                               className={`admin-status-badge ${
                                 reward.active ? 'active' : 'inactive'
                               }`}
                             >
                               {reward.active ? 'Active' : 'Inactive'}
                             </span>
                           </td>
                          <td data-label={t('admin.filters.recurrence')}>
                             <span className="admin-table-secondary" style={{ fontSize: '0.75rem' }}>
                               {(() => {
                                 const recurrence = (reward.recurrence || 'once') as 'once' | 'daily' | 'weekly' | 'monthly';
                                 return t(`admin.reward.recurrence.${recurrence}`).split(' - ')[0];
                               })()}
                             </span>
                           </td>
                          <td data-label="Art">
                            <span className="admin-table-secondary" style={{ fontSize: '0.75rem' }}>
                              {(reward as any).reward_art || '—'}
                            </span>
                          </td>
                          <td data-label="Kategorie">
                            <span className="admin-table-secondary" style={{ fontSize: '0.75rem' }}>
                              {(reward as any).kategorie || '—'}
                            </span>
                          </td>
                          <td data-label="Mögliche Punkte">
                            <span className="admin-table-secondary" style={{ fontSize: '0.75rem' }}>
                              {(reward as any).moegliche_punkte !== undefined && (reward as any).moegliche_punkte !== null ? (reward as any).moegliche_punkte : '—'}
                            </span>
                          </td>
                          <td data-label="Actions" className="admin-table-actions">
                             <button
                               className="admin-action-button"
                               type="button"
                               onClick={() => startRewardEdit(reward)}
                             >
                               {t('common.actions.edit', 'Bearbeiten')}
                             </button>
                             <button
                               className="admin-action-button"
                               type="button"
                               onClick={() => handleRewardStatusChange(reward.id, !reward.active)}
                             >
                               {reward.active ? t('admin.rewardManage.deactivate') : t('admin.rewardManage.activate')}
                             </button>
                             <button
                               className="admin-action-button"
                               type="button"
                               onClick={() => handleRewardDelete(reward.id)}
                             >
                               {t('common.actions.delete', 'Löschen')}
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
                      : rewardFilterDropdown === 'type'
                      ? rewardFilterOptions.types
                      : undefined
                  }
                  selectedValue={
                    rewardFilterDropdown === 'location'
                      ? rewardFilterLocation
                      : rewardFilterDropdown === 'status'
                      ? rewardFilterStatus
                      : rewardFilterDropdown === 'recurrence'
                      ? rewardFilterRecurrence
                      : rewardFilterDropdown === 'type'
                      ? rewardFilterType
                      : undefined
                  }
                  onSelect={(value) => {
                    if (rewardFilterDropdown === 'location') {
                      setRewardFilterLocation(value);
                    } else if (rewardFilterDropdown === 'status') {
                      setRewardFilterStatus(value as 'active' | 'inactive' | null);
                    } else if (rewardFilterDropdown === 'recurrence') {
                      setRewardFilterRecurrence(value);
                    } else if (rewardFilterDropdown === 'type') {
                      setRewardFilterType(value);
                    }
                  }}
                  type={rewardFilterDropdown}
                  textValue={rewardFilterDropdown === 'title' ? rewardFilterTitle : undefined}
                  onTextChange={rewardFilterDropdown === 'title' ? setRewardFilterTitle : undefined}
                  minValue={rewardFilterDropdown === 'cost' ? rewardFilterCostMin : undefined}
                  maxValue={rewardFilterDropdown === 'cost' ? rewardFilterCostMax : undefined}
                  onMinChange={rewardFilterDropdown === 'cost' ? setRewardFilterCostMin : undefined}
                  onMaxChange={rewardFilterDropdown === 'cost' ? setRewardFilterCostMax : undefined}
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
              title: rewardFilterTitle,
              costMin: rewardFilterCostMin,
              costMax: rewardFilterCostMax,
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
            onTitleChange={setRewardFilterTitle}
            onCostMinChange={setRewardFilterCostMin}
            onCostMaxChange={setRewardFilterCostMax}
            onClearAll={() => {
              setRewardFilterLocation(null);
              setRewardFilterStatus(null);
              setRewardFilterRecurrence(null);
              setRewardFilterType(null);
              setRewardFilterTitle('');
              setRewardFilterCostMin('');
              setRewardFilterCostMax('');
            }}
            filterType="reward"
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
          <TaskSelectionModal
            isOpen={isPrerequisiteModalOpen}
            onClose={() => setIsPrerequisiteModalOpen(false)}
        mode={prerequisiteModalMode}
        tasks={existingTemplates}
        selectedTaskIds={
          prerequisiteModalMode === 'single'
            ? taskForm.prerequisite_task_id
              ? [taskForm.prerequisite_task_id]
              : []
            : taskForm.prerequisite_task_ids || []
        }
        onApply={handlePrerequisiteModalApply}
        excludeTaskId={isEditingTask ? editingTaskId || undefined : undefined}
      />

      {/* Team Management - using TeamManagement component */}
      {mode === 'teamManage' && (() => {
        return (
          <TeamManagement
            cssPrefix="admin"
            onBack={() => setMode(null)}
            enabled={mode === 'teamManage'}
          />
        );
      })()}

      {/* Legacy Team Management - replaced by TeamManagement component */}
      {false && mode === 'teamManage' && (
        <section className="admin-section">
          <header className="admin-section-header">
            <div>
              <h2>{t('admin.team.manage.title')}</h2>
              <p>{t('admin.team.manage.subtitle')}</p>
            </div>
            <div className="admin-actions">
              {!editingTeamId && !isCreatingTeam && (
                <>
                  <button
                    className="admin-action-button"
                    onClick={() => setIsCreatingTeam(true)}
                    type="button"
                  >
                    {t('admin.team.manage.createNew', 'Neues Team erstellen')}
                  </button>
                <button
                  className="admin-icon-button"
                  onClick={() => refetchTeams()}
                  title={t('admin.team.manage.refresh')}
                >
                  <Icon name="refresh" />
                  <span className="sr-only">{t('admin.team.manage.refresh')}</span>
                </button>
                </>
              )}
              <button
                className="admin-icon-button"
                onClick={() => {
                  if (editingTeamId) {
                    setEditingTeamId(null);
                  } else if (isCreatingTeam) {
                    setIsCreatingTeam(false);
                  } else {
                    setMode(null);
                  }
                }}
                title={editingTeamId ? t('admin.team.manage.edit.cancel') : isCreatingTeam ? t('common.actions.cancel') : t('admin.team.manage.back')}
              >
                <Icon name="back" />
                <span className="sr-only">{editingTeamId ? t('admin.team.manage.edit.cancel') : isCreatingTeam ? t('common.actions.cancel') : t('admin.team.manage.back')}</span>
              </button>
            </div>
          </header>

          {teamsLoading && <p>{t('admin.team.manage.loading')}</p>}
          {Boolean(teamsError) && <p className="admin-error">{t('admin.team.manage.loadError')}</p>}

          {isCreatingTeam && (
            <div className="admin-form-card">
              <TeamCreator
                onSuccess={async (teamId) => {
                  setIsCreatingTeam(false);
                  await refetchTeams();
                  setTeamManagementMessage({
                    type: 'success',
                    text: t('admin.team.manage.createSuccess', 'Team erfolgreich erstellt'),
                  });
                }}
                onClose={() => setIsCreatingTeam(false)}
              />
            </div>
          )}

          {editingTeamId && (() => {
            // Find team in all teams, not just filtered ones
            const editingTeam = teamsList.find((t) => t.id === editingTeamId);
            if (!editingTeam) {
              // Team not found, reset editing state
              setEditingTeamId(null);
              return null;
            }
            return (
              <div className="admin-form-card">
              <div className="admin-form-section">
                  <h3>{t('admin.team.manage.edit.title', 'Team bearbeiten')}</h3>
                <div className="admin-field">
                  <label>
                      {t('admin.team.manage.edit.name', 'Team-Name')}
                    <input
                      type="text"
                      value={editingTeam.name || ''}
                      onChange={async (e) => {
                        try {
                          await api.updateTeam(editingTeamId, { name: e.target.value || null });
                          await refetchTeams();
                            setTeamManagementMessage({
                              type: 'success',
                              text: t('admin.team.manage.edit.nameUpdated', 'Team-Name aktualisiert'),
                            });
                          } catch (err: any) {
                          console.error('Failed to update team name:', err);
                            setTeamManagementMessage({
                              type: 'error',
                              text: err?.response?.data?.error || err?.message || t('admin.team.manage.edit.nameUpdateError', 'Fehler beim Aktualisieren des Team-Namens'),
                            });
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="admin-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={editingTeam.active ?? true}
                      onChange={async (e) => {
                        try {
                          await api.bulkUpdateTeamsStatus([editingTeamId], e.target.checked);
                          await refetchTeams();
                            setTeamManagementMessage({
                              type: 'success',
                              text: e.target.checked 
                                ? t('admin.team.manage.teamActivated', 'Team aktiviert')
                                : t('admin.team.manage.teamDeactivated', 'Team deaktiviert'),
                            });
                          } catch (err: any) {
                          console.error('Failed to update team status:', err);
                            setTeamManagementMessage({
                              type: 'error',
                              text: err?.response?.data?.error || err?.message || t('admin.team.manage.edit.statusUpdateError', 'Fehler beim Aktualisieren des Team-Status'),
                            });
                        }
                      }}
                    />
                      {t('admin.team.manage.edit.active', 'Aktiv')}
                  </label>
                  </div>
                  <div className="admin-form-section" style={{ marginTop: '2rem' }}>
                    <h4>{t('admin.team.manage.edit.members', 'Mitglieder')}</h4>
                    <div className="admin-form-actions" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={() => setShowTeamAddUsersModal(true)}
                      >
                        {t('admin.team.manage.edit.addMembers', 'Benutzer hinzufügen')}
                      </button>
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={() => setShowTeamRemoveUsersModal(true)}
                        disabled={teamMembers.length === 0}
                      >
                        {t('admin.team.manage.edit.removeMembers', 'Benutzer entfernen')}
                      </button>
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={async () => {
                          try {
                            const qrData = await api.getTeamQrCode(editingTeamId);
                            setTeamJoinQrToken(qrData.qrToken);
                            setShowTeamJoinQrModal(true);
                          } catch (err: any) {
                            setTeamManagementMessage({
                              type: 'error',
                              text: err?.response?.data?.error || err?.message || t('admin.team.manage.edit.qrError', 'Fehler beim Laden des QR-Codes'),
                            });
                          }
                        }}
                      >
                        {t('admin.team.manage.edit.showJoinQr', 'QR-Code zum Beitreten')}
                      </button>
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={async () => {
                          try {
                            // Enable registration first if not enabled
                            await api.enableTeamRegistration(editingTeamId, true);
                            const qrData = await api.getTeamRegistrationQrCode(editingTeamId);
                            setTeamRegistrationQrData({
                              qrToken: qrData.qrToken,
                              registrationUrl: qrData.registrationUrl,
                            });
                            setShowTeamRegistrationQrModal(true);
                          } catch (err: any) {
                            setTeamManagementMessage({
                              type: 'error',
                              text: err?.response?.data?.error || err?.message || t('admin.team.manage.edit.registrationQrError', 'Fehler beim Laden des Registrierungs-QR-Codes'),
                            });
                          }
                        }}
                      >
                        {t('admin.team.manage.edit.showRegistrationQr', 'QR-Code für Registrierung')}
                      </button>
                    </div>
                    {teamMembersLoading ? (
                      <p>{t('admin.team.manage.edit.loadingMembers', 'Lade Mitglieder...')}</p>
                    ) : teamMembers.length === 0 ? (
                      <p className="admin-field-note">{t('admin.team.manage.edit.noMembers', 'Keine Mitglieder')}</p>
                    ) : (
                      <div className="admin-table-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>{t('admin.team.manage.edit.memberName', 'Name')}</th>
                              <th>{t('admin.team.manage.edit.memberEmail', 'E-Mail')}</th>
                              <th>{t('admin.team.manage.edit.memberPoints', 'Beigetragene Punkte')}</th>
                              <th>{t('admin.team.manage.edit.memberJoined', 'Beigetreten')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamMembers.map((member: any) => (
                              <tr key={member.id}>
                                <td>{member.user_name || '-'}</td>
                                <td>{member.user_email || '-'}</td>
                                <td>{member.points_contributed || 0}</td>
                                <td>{new Date(member.joined_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="admin-form-actions" style={{ marginTop: '1rem' }}>
                    <button
                      className="admin-action-button"
                      type="button"
                      onClick={() => {
                        setEditingTeamId(null);
                        setTeamManagementMessage(null);
                        setTeamMembers([]);
                        setTeamJoinQrToken(null);
                        setTeamRegistrationQrData(null);
                      }}
                    >
                      {t('common.actions.done', 'Fertig')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {!editingTeamId && (
          <div className="admin-management-card">
            <div className="admin-management-top">
              <div>
                <h3>{t('admin.team.manage.existing.title')}</h3>
                <p>{t('admin.team.manage.existing.subtitle')}</p>
              </div>
              <div className="admin-management-controls">
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    style={COMPACT_TOGGLE_STYLE}
                    checked={includeInactiveTeams}
                    onChange={(event) => {
                      setIncludeInactiveTeams(event.target.checked);
                      setSelectedTeamIds([]);
                    }}
                  />
                  <span>{t('admin.team.manage.showInactive')}</span>
                </label>
                <button
                  className="admin-mobile-filter-button"
                  type="button"
                  onClick={() => setIsMobileTeamFilterOpen(true)}
                  aria-label={t('admin.team.manage.openFilters')}
                >
                  <Icon name="filter" />
                  {(teamFilterStatus || teamFilterName.trim() || teamFilterCreator) && (
                    <span className="admin-mobile-filter-badge">
                      {[teamFilterStatus, teamFilterName.trim() ? 'name' : null, teamFilterCreator].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            {teamManagementMessage && (
              <p
                className={
                  teamManagementMessage.type === 'error' ? 'admin-error' : 'admin-success'
                }
              >
                {teamManagementMessage.text}
              </p>
            )}
            <div className="admin-management-actions">
              <div className="admin-bulk-buttons">
                <button
                  className="admin-action-button"
                  onClick={() => handleTeamBulkStatus(true)}
                  disabled={!hasTeamSelection}
                  type="button"
                >
                  {t('admin.team.manage.activate')}
                </button>
                <button
                  className="admin-action-button"
                  onClick={() => handleTeamBulkStatus(false)}
                  disabled={!hasTeamSelection}
                  type="button"
                >
                  {t('admin.team.manage.deactivate')}
                </button>
                <button
                              className="admin-action-button"
                  onClick={handleTeamBulkDelete}
                  disabled={!hasTeamSelection}
                  type="button"
                >
                  {t('common.actions.delete', 'Löschen')}
                </button>
              </div>
              <span className="admin-selection-count">
                {hasTeamSelection
                  ? t('admin.team.manage.selectedCount', { count: selectedTeamIds.length })
                  : t('admin.team.manage.noSelection')}
              </span>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        style={COMPACT_TOGGLE_STYLE}
                        checked={allTeamsSelected && filteredTeams.length > 0}
                        disabled={!filteredTeams.length}
                        onChange={(event) =>
                          setSelectedTeamIds(
                            event.target.checked
                              ? filteredTeams.map((team) => team.id)
                              : []
                          )
                        }
                        aria-label={t('admin.team.manage.selectAll')}
                      />
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTeamFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTeamFilterDropdown('name');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {t('admin.team.manage.list.name')} {teamFilterName && '✓'}
                    </th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTeamFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTeamFilterDropdown('creator');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {t('admin.team.manage.list.creator')} {teamFilterCreator && '✓'}
                    </th>
                    <th>{t('admin.team.manage.list.members')}</th>
                    <th>{t('admin.team.manage.list.points')}</th>
                    <th>{t('admin.team.manage.list.createdAt')}</th>
                    <th>{t('admin.team.manage.list.updatedAt')}</th>
                    <th
                      className="admin-filter-header"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTeamFilterDropdownPosition({ top: rect.bottom + 5, left: rect.left });
                        setTeamFilterDropdown('status');
                      }}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {t('admin.team.manage.list.active')} {teamFilterStatus && '✓'}
                    </th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="admin-table-empty">
                        {t('admin.team.manage.list.noTeams')}
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => {
                      const isSelected = selectedTeamIds.includes(team.id);
                      return (
                        <tr key={team.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="admin-checkbox"
                              style={COMPACT_TOGGLE_STYLE}
                              checked={isSelected}
                              onChange={(event) =>
                                teamSelection.toggle(team.id, event.target.checked)
                              }
                              aria-label={`Select team ${team.name}`}
                            />
                          </td>
                          <td data-label={t('admin.team.manage.list.name')}>
                            <div className="admin-table-primary">
                              <span className="admin-table-title">
                                {team.name || t('admin.team.manage.list.untitled')}
                              </span>
                            </div>
                          </td>
                          <td data-label={t('admin.team.manage.list.creator')}>
                            <span className="admin-table-secondary">
                              {team.creator_name || '-'}
                            </span>
                          </td>
                          <td data-label={t('admin.team.manage.list.members')}>
                            {team.member_count || 0}
                          </td>
                          <td data-label={t('admin.team.manage.list.points')}>
                            {team.points_pool || 0}
                          </td>
                          <td data-label={t('admin.team.manage.list.createdAt')}>
                            {new Date(team.created_at).toLocaleDateString()}
                          </td>
                          <td data-label={t('admin.team.manage.list.updatedAt')}>
                            {team.updated_at ? new Date(team.updated_at).toLocaleDateString() : '-'}
                          </td>
                          <td data-label={t('admin.team.manage.list.active')}>
                            <span
                              className={`admin-status-badge ${
                                team.active ? 'active' : 'inactive'
                              }`}
                            >
                              {team.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td data-label={t('common.actions')} className="admin-table-actions">
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => setEditingTeamId(team.id)}
                            >
                              {t('common.actions.edit', 'Bearbeiten')}
                            </button>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => handleTeamStatusChange(team.id, !team.active)}
                            >
                              {team.active ? t('admin.team.manage.deactivate') : t('admin.team.manage.activate')}
                            </button>
                            <button
                              className="admin-action-button"
                              type="button"
                              onClick={() => handleTeamDelete(team.id)}
                            >
                              {t('common.actions.delete', 'Löschen')}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {teamFilterDropdown && teamFilterDropdownPosition && (
                <FilterDropdown
                  isOpen={true}
                  onClose={() => setTeamFilterDropdown(null)}
                  position={teamFilterDropdownPosition}
                  options={
                    teamFilterDropdown === 'status'
                      ? teamFilterOptions.statuses
                      : teamFilterDropdown === 'creator'
                      ? teamFilterOptions.creators
                      : undefined
                  }
                  selectedValue={
                    teamFilterDropdown === 'status'
                      ? teamFilterStatus
                      : teamFilterDropdown === 'creator'
                      ? teamFilterCreator
                      : undefined
                  }
                  onSelect={(value) => {
                    if (teamFilterDropdown === 'status') {
                      setTeamFilterStatus(value as 'active' | 'inactive' | null);
                    } else if (teamFilterDropdown === 'creator') {
                      setTeamFilterCreator(value);
                    }
                  }}
                  type={teamFilterDropdown}
                  textValue={teamFilterDropdown === 'name' ? teamFilterName : undefined}
                  onTextChange={teamFilterDropdown === 'name' ? setTeamFilterName : undefined}
                />
              )}
            </div>
          </div>
          )}
          
          <MobileFilterModal
            isOpen={isMobileTeamFilterOpen}
            onClose={() => setIsMobileTeamFilterOpen(false)}
            filterOptions={teamFilterOptions}
            filters={{
              status: teamFilterStatus,
              name: teamFilterName,
              creator: teamFilterCreator,
            }}
            onFilterChange={(filterType, value) => {
              if (filterType === 'status') {
                setTeamFilterStatus(value as 'active' | 'inactive' | null);
              } else if (filterType === 'creator') {
                setTeamFilterCreator(value);
              }
            }}
            onTitleChange={setTeamFilterName}
            onClearAll={() => {
              setTeamFilterStatus(null);
              setTeamFilterName('');
              setTeamFilterCreator(null);
            }}
            filterType="team"
          />

          {/* Team User Selection Modals */}
          {editingTeamId && (
            <>
              <UserSelectionModal
                isOpen={showTeamAddUsersModal}
                onClose={() => setShowTeamAddUsersModal(false)}
                onAdd={async (userIds) => {
                  try {
                    await api.addTeamMembers(editingTeamId, userIds);
                    await refetchTeamMembers();
                    await refetchTeams();
                    setTeamManagementMessage({
                      type: 'success',
                      text: t('admin.team.manage.edit.membersAdded', { count: userIds.length }, `${userIds.length} Benutzer hinzugefügt`),
                    });
                  } catch (err: any) {
                    setTeamManagementMessage({
                      type: 'error',
                      text: err?.response?.data?.error || err?.message || t('admin.team.manage.edit.membersAddError', 'Fehler beim Hinzufügen der Benutzer'),
                    });
                  }
                }}
                excludeUserIds={teamMembers.map((m: any) => m.user_id)}
                title={t('admin.team.manage.edit.addMembersTitle', 'Benutzer zum Team hinzufügen')}
                addButtonLabel={t('admin.team.manage.edit.add', 'Hinzufügen')}
              />
              <UserSelectionModal
                isOpen={showTeamRemoveUsersModal}
                onClose={() => setShowTeamRemoveUsersModal(false)}
                onAdd={async (userIds) => {
                  try {
                    await api.removeTeamMembers(editingTeamId, userIds);
                    await refetchTeamMembers();
                    await refetchTeams();
                    setTeamManagementMessage({
                      type: 'success',
                      text: t('admin.team.manage.edit.membersRemoved', { count: userIds.length }, `${userIds.length} Benutzer entfernt`),
                    });
                  } catch (err: any) {
                    setTeamManagementMessage({
                      type: 'error',
                      text: err?.response?.data?.error || err?.message || t('admin.team.manage.edit.membersRemoveError', 'Fehler beim Entfernen der Benutzer'),
                    });
                  }
                }}
                includeOnlyUserIds={teamMembers.map((m: any) => m.user_id)}
                title={t('admin.team.manage.edit.removeMembersTitle', 'Benutzer aus Team entfernen')}
                addButtonLabel={t('admin.team.manage.edit.remove', 'Entfernen')}
                roleFilter="all"
              />
              {showTeamJoinQrModal && teamJoinQrToken && (
                <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
                  <div className="admin-form-card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
                    <div className="admin-form-section">
                      <h3>{t('admin.team.manage.edit.joinQrTitle', 'QR-Code zum Beitreten')}</h3>
                      <p className="admin-field-note">{t('admin.team.manage.edit.joinQrDescription', 'Bestehende Benutzer können diesen QR-Code scannen, um dem Team beizutreten.')}</p>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                        <QRCode value={teamJoinQrToken} size={256} />
                      </div>
                      <div className="admin-form-actions">
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => {
                            setShowTeamJoinQrModal(false);
                            setTeamJoinQrToken(null);
                          }}
                        >
                          {t('common.actions.close', 'Schließen')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {showTeamRegistrationQrModal && teamRegistrationQrData && (
                <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
                  <div className="admin-form-card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
                    <div className="admin-form-section">
                      <h3>{t('admin.team.manage.edit.registrationQrTitle', 'QR-Code für Registrierung')}</h3>
                      <p className="admin-field-note">{t('admin.team.manage.edit.registrationQrDescription', 'Neue Benutzer können diesen QR-Code scannen, um sich zu registrieren und automatisch dem Team beizutreten.')}</p>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                        <QRCode value={teamRegistrationQrData.registrationUrl} size={256} />
                      </div>
                      <div className="admin-field" style={{ marginTop: '1rem' }}>
                        <label>
                          {t('admin.team.manage.edit.registrationUrl', 'Registrierungs-URL')}
                          <input
                            type="text"
                            value={teamRegistrationQrData.registrationUrl}
                            readOnly
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                        </label>
                      </div>
                      <div className="admin-form-actions">
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => {
                            setShowTeamRegistrationQrModal(false);
                            setTeamRegistrationQrData(null);
                          }}
                        >
                          {t('common.actions.close', 'Schließen')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Task QR Code Modal */}
              {showTaskQrModal && taskQrCode && (
                <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
                  <div className="admin-form-card" style={{ maxWidth: '700px', margin: '2rem auto' }}>
                    <div className="admin-form-section">
                      <h3>{t('admin.task.qrCodeTitle', 'QR-Code für Aufgabe')}</h3>
                      <p className="admin-field-note">{t('admin.task.qrCodeDescription', 'Dieser QR-Code kann ausgedruckt und für die Aufgabe verwendet werden.')}</p>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                        <QRCode value={taskQrCode} size={400} />
                      </div>
                      <div style={{ 
                        marginTop: 'var(--spacing-md)', 
                        padding: 'var(--spacing-md)', 
                        background: 'var(--color-background-light, #f9fafb)', 
                        borderRadius: 'var(--border-radius)',
                        width: '100%',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                          {t('admin.task.qrCodeLabel', 'QR-Code:')}
                        </p>
                        <code style={{ 
                          fontSize: '0.85rem', 
                          wordBreak: 'break-all', 
                          color: 'var(--color-text)',
                          fontFamily: 'monospace'
                        }}>
                          {taskQrCode}
                        </code>
                      </div>
                      <div className="admin-form-actions">
                        <button
                          className="admin-action-button"
                          type="button"
                          onClick={() => {
                            setShowTaskQrModal(false);
                            setTaskQrCode(null);
                          }}
                        >
                          {t('common.actions.close', 'Schließen')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Contest Management - using ContestManagement component */}
      {mode === 'contestManage' && (() => {
        return (
          <ContestManagement
            cssPrefix="admin"
            onBack={() => setMode(null)}
            enabled={mode === 'contestManage'}
          />
        );
      })()}

      {/* Photo Validation */}
      {mode === 'photoValidation' && (
        <PhotoValidation
          cssPrefix="admin"
          onBack={() => setMode(null)}
        />
      )}

      {/* Points Bonus */}
      {mode === 'pointsBonus' && (
        <div style={{ padding: '20px' }}>
          <button
            onClick={() => setMode(null)}
            style={{
              marginBottom: '20px',
              padding: '10px 20px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {t('common.actions.back', 'Zurück')}
          </button>
          <PointsBonusPage />
        </div>
      )}
    </div>
  );
}

export default AdminPage;

