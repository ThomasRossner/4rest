import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'react-query';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import TreeSystemPrototypeApp from '../../components/3d/tree-system/App.jsx';
import './DebugTools.css';

export function DebugTools() {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  
  // Log viewer state
  const [logLevelFilter, setLogLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [logOperationFilter, setLogOperationFilter] = useState<string>('');
  const { data: logsData, refetch: refetchLogs } = useQuery(
    ['debugLogs', logLevelFilter, logOperationFilter],
    () => api.getDebugLogs({
      limit: 200,
      level: logLevelFilter !== 'all' ? logLevelFilter : undefined,
      operation: logOperationFilter || undefined,
    }),
    {
      refetchInterval: 5000, // Auto-refresh every 5 seconds
    }
  );

  const clearLogsMutation = useMutation(() => api.clearDebugLogs(), {
    onSuccess: () => {
      showToast({
        type: 'success',
        title: t('admin.debugTools.logs.cleared'),
        message: t('admin.debugTools.logs.clearedMessage'),
      });
      refetchLogs();
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        title: t('admin.debugTools.logs.clearError'),
        message: error?.response?.data?.error || error?.message || 'Failed to clear logs',
      });
    },
  });

  // Tool 1: Create Bulk Tasks
  const [createTasksEmail, setCreateTasksEmail] = useState('');
  const createTasksMutation = useMutation(
    (data: { userEmail: string; count?: number }) => api.createBulkTasks(data.userEmail, data.count),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.createTasks.success'),
          message: data.message,
        });
        setCreateTasksEmail('');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to create tasks';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.createTasks.error'),
          message: errorMessage,
        });
      },
    }
  );

  // Tool 2: Complete Bulk Tasks
  const [completeTasksEmail, setCompleteTasksEmail] = useState('');
  const completeTasksMutation = useMutation(
    (data: { userEmail: string; count?: number }) => api.completeBulkTasks(data.userEmail, data.count),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.completeTasks.success'),
          message: data.message,
        });
        setCompleteTasksEmail('');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to complete tasks';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.completeTasks.error'),
          message: errorMessage,
        });
      },
    }
  );

  // Tool 3: Delete User Data
  const [deleteDataEmail, setDeleteDataEmail] = useState('');
  const [deleteTaskCount, setDeleteTaskCount] = useState(0);
  const [deletePoints, setDeletePoints] = useState(0);
  const deleteDataMutation = useMutation(
    (data: { userEmail: string; taskCount: number; pointsToRemove: number }) =>
      api.deleteUserData(data.userEmail, data.taskCount, data.pointsToRemove),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.deleteData.success'),
          message: data.message,
        });
        setDeleteDataEmail('');
        setDeleteTaskCount(0);
        setDeletePoints(0);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to delete user data';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.deleteData.error'),
          message: errorMessage,
        });
      },
    }
  );

  // Tool 4: Create Survey with Participants
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [participantCount, setParticipantCount] = useState(30);
  const createSurveyMutation = useMutation(
    (data: { surveyData: any; participantCount: number }) =>
      api.createSurveyWithParticipants(data.surveyData, data.participantCount),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.createSurvey.success'),
          message: data.message,
        });
        setSurveyTitle('');
        setSurveyDescription('');
        setSurveyQuestions([]);
        setParticipantCount(30);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to create survey';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.createSurvey.error'),
          message: errorMessage,
        });
      },
    }
  );

  const handleCreateTasks = () => {
    if (!createTasksEmail.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.createTasks.error'),
        message: t('admin.debugTools.createTasks.emailRequired'),
      });
      return;
    }
    createTasksMutation.mutate({ userEmail: createTasksEmail.trim(), count: 20 });
  };

  const handleCompleteTasks = () => {
    if (!completeTasksEmail.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.completeTasks.error'),
        message: t('admin.debugTools.completeTasks.emailRequired'),
      });
      return;
    }
    completeTasksMutation.mutate({ userEmail: completeTasksEmail.trim(), count: 20 });
  };

  const handleDeleteData = () => {
    if (!deleteDataEmail.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.deleteData.error'),
        message: t('admin.debugTools.deleteData.emailRequired'),
      });
      return;
    }
    if (deleteTaskCount < 0 || deletePoints < 0) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.deleteData.error'),
        message: t('admin.debugTools.deleteData.invalidNumbers'),
      });
      return;
    }
    deleteDataMutation.mutate({
      userEmail: deleteDataEmail.trim(),
      taskCount: deleteTaskCount,
      pointsToRemove: deletePoints,
    });
  };

  const handleCreateSurvey = () => {
    if (!surveyTitle.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.createSurvey.error'),
        message: t('admin.debugTools.createSurvey.titleRequired'),
      });
      return;
    }
    if (surveyQuestions.length === 0) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.createSurvey.error'),
        message: t('admin.debugTools.createSurvey.questionsRequired'),
      });
      return;
    }
    if (participantCount < 1) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.createSurvey.error'),
        message: t('admin.debugTools.createSurvey.invalidParticipantCount'),
      });
      return;
    }

    try {
      // Format survey questions like AdminPage does
      const formattedQuestions = surveyQuestions.map((question) => {
        const q: any = {
          id: question.id,
          question: question.question.trim(),
          type: question.type,
          required: question.required !== false,
          order: question.order || surveyQuestions.indexOf(question) + 1,
        };

        if (question.type === 'single_choice' || question.type === 'multiple_choice') {
          if (!question.options || question.options.length < 2) {
            throw new Error(`Question "${question.question || 'Untitled'}" must have at least 2 options.`);
          }
          const validOptions = question.options.filter((opt: string) => opt.trim() !== '');
          if (validOptions.length < 2) {
            throw new Error(`Question "${question.question || 'Untitled'}" must have at least 2 non-empty options.`);
          }
          q.options = validOptions;
        }

        if (question.type === 'rating') {
          q.minRating = question.minRating || 1;
          q.maxRating = question.maxRating || 5;
        }

        return q;
      });

      const surveyData = {
        title: surveyTitle.trim(),
        description: surveyDescription.trim() || null,
        survey_questions: formattedQuestions,
        survey_type: 'mixed',
        points: 50,
        co2_savings_kg: 0.5,
      };

      createSurveyMutation.mutate({ surveyData, participantCount });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.createSurvey.error'),
        message: error?.message || t('admin.debugTools.createSurvey.questionsRequired'),
      });
    }
  };

  const addSurveyQuestion = () => {
    const newQuestion = {
      id: `q${Date.now()}`,
      question: '',
      type: 'single_choice' as const,
      options: ['Option 1', 'Option 2'],
      required: true,
      order: surveyQuestions.length + 1,
    };
    setSurveyQuestions([...surveyQuestions, newQuestion]);
  };

  const updateSurveyQuestion = (index: number, updates: any) => {
    const updated = [...surveyQuestions];
    updated[index] = { ...updated[index], ...updates };
    setSurveyQuestions(updated);
  };

  const removeSurveyQuestion = (index: number) => {
    setSurveyQuestions(surveyQuestions.filter((_, i) => i !== index));
  };

  // Tool 5: Time-Based Activity Simulation
  const [timeActivityEmail, setTimeActivityEmail] = useState('');
  const [timeActivityCount, setTimeActivityCount] = useState(10);
  const [timeActivityStartDate, setTimeActivityStartDate] = useState('');
  const [timeActivityEndDate, setTimeActivityEndDate] = useState('');
  const [timeActivityDistribution, setTimeActivityDistribution] = useState<'uniform' | 'random'>('uniform');
  const timeActivityMutation = useMutation(
    (data: { userEmail: string; taskCount: number; startDate: string; endDate: string; distribution: 'uniform' | 'random' }) =>
      api.simulateTimeActivity(data.userEmail, data.taskCount, data.startDate, data.endDate, data.distribution),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.timeBasedActivity.success'),
          message: data.message,
        });
        setTimeActivityEmail('');
        setTimeActivityCount(10);
        setTimeActivityStartDate('');
        setTimeActivityEndDate('');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to simulate time activity';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.timeBasedActivity.error'),
          message: errorMessage,
        });
      },
    }
  );

  // Tool 6: Reward Redemption Simulation
  const [rewardRedemptionEmail, setRewardRedemptionEmail] = useState('');
  const [rewardRedemptionId, setRewardRedemptionId] = useState('');
  const [rewardRedemptionAutoVerify, setRewardRedemptionAutoVerify] = useState(false);
  const rewardRedemptionMutation = useMutation(
    (data: { userEmail: string; rewardId?: string; autoVerify: boolean }) =>
      api.simulateRewardRedemption(data.userEmail, data.rewardId, data.autoVerify),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.rewardRedemption.success'),
          message: data.message,
        });
        setRewardRedemptionEmail('');
        setRewardRedemptionId('');
        setRewardRedemptionAutoVerify(false);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to simulate reward redemption';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.rewardRedemption.error'),
          message: errorMessage,
        });
      },
    }
  );

  // Tool 7: Reset User Data
  const [resetDataEmail, setResetDataEmail] = useState('');
  const [resetDataOptions, setResetDataOptions] = useState({
    tasks: false,
    trees: false,
    points: false,
    redemptions: false,
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetDataMutation = useMutation(
    (data: { userEmail: string; resetOptions: any }) => api.resetUserData(data.userEmail, data.resetOptions),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.resetUserData.success'),
          message: data.message,
        });
        setResetDataEmail('');
        setResetDataOptions({ tasks: false, trees: false, points: false, redemptions: false });
        setShowResetConfirm(false);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to reset user data';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.resetUserData.error'),
          message: errorMessage,
        });
        setShowResetConfirm(false);
      },
    }
  );

  // Tool 8: Simulate Forest Visits
  const [forestVisitsEmail, setForestVisitsEmail] = useState('');
  const [forestVisitsDays, setForestVisitsDays] = useState(30);
  const forestVisitsMutation = useMutation(
    (data: { userEmail: string; days: number }) => api.simulateForestVisits(data.userEmail, data.days),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.simulateForestVisits.success'),
          message: data.message,
        });
        setForestVisitsEmail('');
        setForestVisitsDays(30);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to simulate forest visits';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.simulateForestVisits.error'),
          message: errorMessage,
        });
      },
    }
  );

  // Tool 8b: Recalculate Tree Sizes
  const [recalculateSizesEmail, setRecalculateSizesEmail] = useState('');
  const recalculateSizesMutation = useMutation(
    (data: { userEmail: string }) => api.recalculateTreeSizes(data.userEmail),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.recalculateTreeSizes.success'),
          message: data.message,
        });
        setRecalculateSizesEmail('');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to recalculate tree sizes';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.recalculateTreeSizes.error'),
          message: errorMessage,
        });
      },
    }
  );

  // Tool 9: Generate Statistics Data
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');
  const [statsUserCount, setStatsUserCount] = useState(10);
  const [statsTasksMin, setStatsTasksMin] = useState(5);
  const [statsTasksMax, setStatsTasksMax] = useState(15);
  const [statsCo2Min, setStatsCo2Min] = useState(0.1);
  const [statsCo2Max, setStatsCo2Max] = useState(5.0);
  const statsGenerationMutation = useMutation(
    (data: any) => api.generateStatisticsData(
      data.startDate,
      data.endDate,
      data.targetUserCount,
      data.tasksPerUserMin,
      data.tasksPerUserMax,
      data.co2PerTaskMin,
      data.co2PerTaskMax
    ),
    {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: t('admin.debugTools.generateStatistics.success'),
          message: data.message,
        });
        setStatsStartDate('');
        setStatsEndDate('');
        setStatsUserCount(10);
        setStatsTasksMin(5);
        setStatsTasksMax(15);
        setStatsCo2Min(0.1);
        setStatsCo2Max(5.0);
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to generate statistics data';
        showToast({
          type: 'error',
          title: error?.response?.status === 429 ? t('admin.debugTools.rateLimit.title') : t('admin.debugTools.generateStatistics.error'),
          message: errorMessage,
        });
      },
    }
  );

  const handleTimeActivity = () => {
    if (!timeActivityEmail.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.timeBasedActivity.error'),
        message: t('admin.debugTools.timeBasedActivity.emailRequired'),
      });
      return;
    }
    if (!timeActivityStartDate || !timeActivityEndDate) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.timeBasedActivity.error'),
        message: t('admin.debugTools.timeBasedActivity.datesRequired'),
      });
      return;
    }
    if (timeActivityCount < 1) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.timeBasedActivity.error'),
        message: t('admin.debugTools.timeBasedActivity.invalidCount'),
      });
      return;
    }
    timeActivityMutation.mutate({
      userEmail: timeActivityEmail.trim(),
      taskCount: timeActivityCount,
      startDate: timeActivityStartDate,
      endDate: timeActivityEndDate,
      distribution: timeActivityDistribution,
    });
  };

  const handleRewardRedemption = () => {
    if (!rewardRedemptionEmail.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.rewardRedemption.error'),
        message: t('admin.debugTools.rewardRedemption.emailRequired'),
      });
      return;
    }
    rewardRedemptionMutation.mutate({
      userEmail: rewardRedemptionEmail.trim(),
      rewardId: rewardRedemptionId || undefined,
      autoVerify: rewardRedemptionAutoVerify,
    });
  };

  const handleResetData = () => {
    if (!resetDataEmail.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.resetUserData.error'),
        message: t('admin.debugTools.resetUserData.emailRequired'),
      });
      return;
    }
    setShowResetConfirm(true);
  };

  const confirmResetData = () => {
    resetDataMutation.mutate({
      userEmail: resetDataEmail.trim(),
      resetOptions: resetDataOptions,
    });
  };

  const handleSimulateForestVisits = () => {
    if (!forestVisitsEmail.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.simulateForestVisits.error'),
        message: t('admin.debugTools.simulateForestVisits.emailRequired'),
      });
      return;
    }
    if (forestVisitsDays < 1 || forestVisitsDays > 365) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.simulateForestVisits.error'),
        message: t('admin.debugTools.simulateForestVisits.invalidDays'),
      });
      return;
    }
    forestVisitsMutation.mutate({
      userEmail: forestVisitsEmail.trim(),
      days: forestVisitsDays,
    });
  };

  const handleRecalculateTreeSizes = () => {
    if (!recalculateSizesEmail.trim()) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.recalculateTreeSizes.error'),
        message: t('admin.debugTools.recalculateTreeSizes.emailRequired'),
      });
      return;
    }
    recalculateSizesMutation.mutate({
      userEmail: recalculateSizesEmail.trim(),
    });
  };

  const handleGenerateStatistics = () => {
    if (!statsStartDate || !statsEndDate) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.generateStatistics.error'),
        message: t('admin.debugTools.generateStatistics.datesRequired'),
      });
      return;
    }
    if (statsUserCount < 1) {
      showToast({
        type: 'error',
        title: t('admin.debugTools.generateStatistics.error'),
        message: t('admin.debugTools.generateStatistics.invalidUserCount'),
      });
      return;
    }
    statsGenerationMutation.mutate({
      startDate: statsStartDate,
      endDate: statsEndDate,
      targetUserCount: statsUserCount,
      tasksPerUserMin: statsTasksMin,
      tasksPerUserMax: statsTasksMax,
      co2PerTaskMin: statsCo2Min,
      co2PerTaskMax: statsCo2Max,
    });
  };

  return (
    <div className="debug-tools-page">
      <h1 className="debug-tools-title">{t('admin.debugTools.title')}</h1>
      <p className="debug-tools-subtitle">{t('admin.debugTools.subtitle')}</p>

      <div className="debug-tools-grid">
        {/* Tool 1: Create Bulk Tasks */}
        <div className="debug-tool-card">
          <h2 className="debug-tool-title">{t('admin.debugTools.createTasks.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.createTasks.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.createTasks.userEmail')}
              <input
                type="email"
                value={createTasksEmail}
                onChange={(e) => setCreateTasksEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={createTasksMutation.isLoading}
              />
            </label>
            <button
              onClick={handleCreateTasks}
              disabled={createTasksMutation.isLoading || !createTasksEmail.trim()}
              className="debug-tool-button"
            >
              {createTasksMutation.isLoading
                ? t('admin.debugTools.createTasks.creating')
                : t('admin.debugTools.createTasks.button')}
            </button>
          </div>
        </div>

        {/* Tool 2: Complete Bulk Tasks */}
        <div className="debug-tool-card">
          <h2 className="debug-tool-title">{t('admin.debugTools.completeTasks.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.completeTasks.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.completeTasks.userEmail')}
              <input
                type="email"
                value={completeTasksEmail}
                onChange={(e) => setCompleteTasksEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={completeTasksMutation.isLoading}
              />
            </label>
            <button
              onClick={handleCompleteTasks}
              disabled={completeTasksMutation.isLoading || !completeTasksEmail.trim()}
              className="debug-tool-button"
            >
              {completeTasksMutation.isLoading
                ? t('admin.debugTools.completeTasks.completing')
                : t('admin.debugTools.completeTasks.button')}
            </button>
          </div>
        </div>

        {/* Tool 3: Delete User Data */}
        <div className="debug-tool-card">
          <h2 className="debug-tool-title">{t('admin.debugTools.deleteData.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.deleteData.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.deleteData.userEmail')}
              <input
                type="email"
                value={deleteDataEmail}
                onChange={(e) => setDeleteDataEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={deleteDataMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.deleteData.taskCount')}
              <input
                type="number"
                min="0"
                value={deleteTaskCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setDeleteTaskCount(isNaN(value) ? 0 : value);
                }}
                disabled={deleteDataMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.deleteData.pointsToRemove')}
              <input
                type="number"
                min="0"
                value={deletePoints}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setDeletePoints(isNaN(value) ? 0 : value);
                }}
                disabled={deleteDataMutation.isLoading}
              />
            </label>
            <button
              onClick={handleDeleteData}
              disabled={
                deleteDataMutation.isLoading ||
                !deleteDataEmail.trim() ||
                deleteTaskCount < 0 ||
                deletePoints < 0
              }
              className="debug-tool-button"
            >
              {deleteDataMutation.isLoading
                ? t('admin.debugTools.deleteData.deleting')
                : t('admin.debugTools.deleteData.button')}
            </button>
          </div>
        </div>

        {/* Tool 4: Create Survey with Participants */}
        <div className="debug-tool-card debug-tool-card-wide">
          <h2 className="debug-tool-title">{t('admin.debugTools.createSurvey.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.createSurvey.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.createSurvey.surveyTitle')}
              <input
                type="text"
                value={surveyTitle}
                onChange={(e) => setSurveyTitle(e.target.value)}
                placeholder={t('admin.debugTools.createSurvey.titlePlaceholder')}
                disabled={createSurveyMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.createSurvey.surveyDescription')}
              <textarea
                value={surveyDescription}
                onChange={(e) => setSurveyDescription(e.target.value)}
                placeholder={t('admin.debugTools.createSurvey.descriptionPlaceholder')}
                rows={3}
                disabled={createSurveyMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.createSurvey.participantCount')}
              <input
                type="number"
                min="1"
                value={participantCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setParticipantCount(isNaN(value) ? 1 : value);
                }}
                disabled={createSurveyMutation.isLoading}
              />
            </label>

            <div className="debug-survey-questions">
              <div className="debug-survey-questions-header">
                <h3>{t('admin.debugTools.createSurvey.questions')}</h3>
                <button
                  type="button"
                  onClick={addSurveyQuestion}
                  disabled={createSurveyMutation.isLoading}
                  className="debug-tool-button secondary"
                >
                  {t('admin.debugTools.createSurvey.addQuestion')}
                </button>
              </div>

              {surveyQuestions.map((question, index) => (
                <div key={question.id} className="debug-survey-question">
                  <div className="debug-survey-question-header">
                    <span className="debug-survey-question-number">{index + 1}.</span>
                    <button
                      type="button"
                      onClick={() => removeSurveyQuestion(index)}
                      disabled={createSurveyMutation.isLoading}
                      className="debug-survey-remove-button"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => updateSurveyQuestion(index, { question: e.target.value })}
                    placeholder={t('admin.debugTools.createSurvey.questionPlaceholder')}
                    disabled={createSurveyMutation.isLoading}
                  />
                  <select
                    value={question.type}
                    onChange={(e) =>
                      updateSurveyQuestion(index, {
                        type: e.target.value,
                        options: e.target.value === 'text' || e.target.value === 'rating' ? [] : ['Option 1', 'Option 2'],
                      })
                    }
                    disabled={createSurveyMutation.isLoading}
                  >
                    <option value="single_choice">{t('admin.task.survey.typeSingleChoice')}</option>
                    <option value="multiple_choice">{t('admin.task.survey.typeMultipleChoice')}</option>
                    <option value="text">{t('admin.task.survey.typeText')}</option>
                    <option value="rating">{t('admin.task.survey.typeRating')}</option>
                  </select>
                  {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                    <div className="debug-survey-options">
                      {question.options?.map((option: string, optIndex: number) => (
                        <input
                          key={optIndex}
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(question.options || [])];
                            newOptions[optIndex] = e.target.value;
                            updateSurveyQuestion(index, { options: newOptions });
                          }}
                          placeholder={`${t('admin.task.survey.optionPlaceholder')} ${optIndex + 1}`}
                          disabled={createSurveyMutation.isLoading}
                        />
                      ))}
                    </div>
                  )}
                  {question.type === 'rating' && (
                    <div className="debug-survey-rating-range">
                      <label>
                        {t('admin.task.survey.minRating')}
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={question.minRating || 1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            updateSurveyQuestion(index, { minRating: isNaN(value) ? 1 : value });
                          }}
                          disabled={createSurveyMutation.isLoading}
                        />
                      </label>
                      <label>
                        {t('admin.task.survey.maxRating')}
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={question.maxRating || 5}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            updateSurveyQuestion(index, { maxRating: isNaN(value) ? 5 : value });
                          }}
                          disabled={createSurveyMutation.isLoading}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleCreateSurvey}
              disabled={
                createSurveyMutation.isLoading ||
                !surveyTitle.trim() ||
                surveyQuestions.length === 0 ||
                participantCount < 1
              }
              className="debug-tool-button"
            >
              {createSurveyMutation.isLoading
                ? t('admin.debugTools.createSurvey.creating')
                : t('admin.debugTools.createSurvey.button')}
            </button>
          </div>
        </div>

        {/* Tool 5: Time-Based Activity Simulation */}
        <div className="debug-tool-card">
          <h2 className="debug-tool-title">{t('admin.debugTools.timeBasedActivity.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.timeBasedActivity.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.timeBasedActivity.userEmail')}
              <input
                type="email"
                value={timeActivityEmail}
                onChange={(e) => setTimeActivityEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={timeActivityMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.timeBasedActivity.taskCount')}
              <input
                type="number"
                min="1"
                value={timeActivityCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setTimeActivityCount(isNaN(value) ? 1 : value);
                }}
                disabled={timeActivityMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.timeBasedActivity.startDate')}
              <input
                type="date"
                value={timeActivityStartDate}
                onChange={(e) => setTimeActivityStartDate(e.target.value)}
                disabled={timeActivityMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.timeBasedActivity.endDate')}
              <input
                type="date"
                value={timeActivityEndDate}
                onChange={(e) => setTimeActivityEndDate(e.target.value)}
                disabled={timeActivityMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.timeBasedActivity.distribution')}
              <select
                value={timeActivityDistribution}
                onChange={(e) => setTimeActivityDistribution(e.target.value as 'uniform' | 'random')}
                disabled={timeActivityMutation.isLoading}
              >
                <option value="uniform">{t('admin.debugTools.timeBasedActivity.distributionUniform')}</option>
                <option value="random">{t('admin.debugTools.timeBasedActivity.distributionRandom')}</option>
              </select>
            </label>
            <button
              onClick={handleTimeActivity}
              disabled={
                timeActivityMutation.isLoading ||
                !timeActivityEmail.trim() ||
                !timeActivityStartDate ||
                !timeActivityEndDate ||
                timeActivityCount < 1
              }
              className="debug-tool-button"
            >
              {timeActivityMutation.isLoading
                ? t('admin.debugTools.timeBasedActivity.creating')
                : t('admin.debugTools.timeBasedActivity.button')}
            </button>
          </div>
        </div>

        {/* Tool 6: Reward Redemption Simulation */}
        <div className="debug-tool-card">
          <h2 className="debug-tool-title">{t('admin.debugTools.rewardRedemption.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.rewardRedemption.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.rewardRedemption.userEmail')}
              <input
                type="email"
                value={rewardRedemptionEmail}
                onChange={(e) => setRewardRedemptionEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={rewardRedemptionMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.rewardRedemption.rewardId')} ({t('admin.debugTools.rewardRedemption.optional')})
              <input
                type="text"
                value={rewardRedemptionId}
                onChange={(e) => setRewardRedemptionId(e.target.value)}
                placeholder={t('admin.debugTools.rewardRedemption.rewardIdPlaceholder')}
                disabled={rewardRedemptionMutation.isLoading}
              />
            </label>
            <label className="debug-checkbox-label">
              <input
                type="checkbox"
                checked={rewardRedemptionAutoVerify}
                onChange={(e) => setRewardRedemptionAutoVerify(e.target.checked)}
                disabled={rewardRedemptionMutation.isLoading}
              />
              {t('admin.debugTools.rewardRedemption.autoVerify')}
            </label>
            <button
              onClick={handleRewardRedemption}
              disabled={rewardRedemptionMutation.isLoading || !rewardRedemptionEmail.trim()}
              className="debug-tool-button"
            >
              {rewardRedemptionMutation.isLoading
                ? t('admin.debugTools.rewardRedemption.processing')
                : t('admin.debugTools.rewardRedemption.button')}
            </button>
          </div>
        </div>

        {/* Tool 7: Reset User Data */}
        <div className="debug-tool-card">
          <h2 className="debug-tool-title">{t('admin.debugTools.resetUserData.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.resetUserData.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.resetUserData.userEmail')}
              <input
                type="email"
                value={resetDataEmail}
                onChange={(e) => setResetDataEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={resetDataMutation.isLoading}
              />
            </label>
            <div className="debug-reset-options">
              <label className="debug-checkbox-label">
                <input
                  type="checkbox"
                  checked={resetDataOptions.tasks}
                  onChange={(e) => setResetDataOptions({ ...resetDataOptions, tasks: e.target.checked })}
                  disabled={resetDataMutation.isLoading}
                />
                {t('admin.debugTools.resetUserData.resetTasks')}
              </label>
              <label className="debug-checkbox-label">
                <input
                  type="checkbox"
                  checked={resetDataOptions.trees}
                  onChange={(e) => setResetDataOptions({ ...resetDataOptions, trees: e.target.checked })}
                  disabled={resetDataMutation.isLoading}
                />
                {t('admin.debugTools.resetUserData.resetTrees')}
              </label>
              <label className="debug-checkbox-label">
                <input
                  type="checkbox"
                  checked={resetDataOptions.points}
                  onChange={(e) => setResetDataOptions({ ...resetDataOptions, points: e.target.checked })}
                  disabled={resetDataMutation.isLoading}
                />
                {t('admin.debugTools.resetUserData.resetPoints')}
              </label>
              <label className="debug-checkbox-label">
                <input
                  type="checkbox"
                  checked={resetDataOptions.redemptions}
                  onChange={(e) => setResetDataOptions({ ...resetDataOptions, redemptions: e.target.checked })}
                  disabled={resetDataMutation.isLoading}
                />
                {t('admin.debugTools.resetUserData.resetRedemptions')}
              </label>
            </div>
            {showResetConfirm && (
              <div className="debug-confirm-dialog">
                <p>{t('admin.debugTools.resetUserData.confirmMessage')}</p>
                <div className="debug-confirm-buttons">
                  <button
                    onClick={confirmResetData}
                    disabled={resetDataMutation.isLoading}
                    className="debug-tool-button"
                  >
                    {t('admin.debugTools.resetUserData.confirm')}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={resetDataMutation.isLoading}
                    className="debug-tool-button secondary"
                  >
                    {t('admin.debugTools.resetUserData.cancel')}
                  </button>
                </div>
              </div>
            )}
            {!showResetConfirm && (
              <button
                onClick={handleResetData}
                disabled={resetDataMutation.isLoading || !resetDataEmail.trim()}
                className="debug-tool-button"
              >
                {t('admin.debugTools.resetUserData.button')}
              </button>
            )}
          </div>
        </div>

        {/* Tool 8: Simulate Forest Visits */}
        <div className="debug-tool-card">
          <h2 className="debug-tool-title">{t('admin.debugTools.simulateForestVisits.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.simulateForestVisits.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.simulateForestVisits.userEmail')}
              <input
                type="email"
                value={forestVisitsEmail}
                onChange={(e) => setForestVisitsEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={forestVisitsMutation.isLoading}
              />
            </label>
            <label>
              {t('admin.debugTools.simulateForestVisits.days')}
              <input
                type="number"
                min="1"
                max="365"
                value={forestVisitsDays}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setForestVisitsDays(isNaN(value) ? 1 : value);
                }}
                placeholder={t('admin.debugTools.simulateForestVisits.daysPlaceholder')}
                disabled={forestVisitsMutation.isLoading}
              />
            </label>
            <button
              onClick={handleSimulateForestVisits}
              disabled={forestVisitsMutation.isLoading || !forestVisitsEmail.trim() || forestVisitsDays < 1 || forestVisitsDays > 365}
              className="debug-tool-button"
            >
              {forestVisitsMutation.isLoading
                ? t('admin.debugTools.simulateForestVisits.simulating')
                : t('admin.debugTools.simulateForestVisits.submit')}
            </button>
          </div>
        </div>

        {/* Tool 8b: Recalculate Tree Sizes */}
        <div className="debug-tool-card">
          <h2 className="debug-tool-title">{t('admin.debugTools.recalculateTreeSizes.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.recalculateTreeSizes.description')}</p>
          <div className="debug-tool-form">
            <label>
              {t('admin.debugTools.recalculateTreeSizes.userEmail')}
              <input
                type="email"
                value={recalculateSizesEmail}
                onChange={(e) => setRecalculateSizesEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={recalculateSizesMutation.isLoading}
              />
            </label>
            <button
              onClick={handleRecalculateTreeSizes}
              disabled={recalculateSizesMutation.isLoading || !recalculateSizesEmail.trim()}
              className="debug-tool-button"
            >
              {recalculateSizesMutation.isLoading
                ? t('admin.debugTools.recalculateTreeSizes.recalculating')
                : t('admin.debugTools.recalculateTreeSizes.submit')}
            </button>
          </div>
        </div>

        {/* Tool 9: Generate Statistics Data */}
        <div className="debug-tool-card debug-tool-card-wide">
          <h2 className="debug-tool-title">{t('admin.debugTools.generateStatistics.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.generateStatistics.description')}</p>
          <div className="debug-tool-form">
            <div className="debug-stats-dates">
              <label>
                {t('admin.debugTools.generateStatistics.startDate')}
                <input
                  type="date"
                  value={statsStartDate}
                  onChange={(e) => setStatsStartDate(e.target.value)}
                  disabled={statsGenerationMutation.isLoading}
                />
              </label>
              <label>
                {t('admin.debugTools.generateStatistics.endDate')}
                <input
                  type="date"
                  value={statsEndDate}
                  onChange={(e) => setStatsEndDate(e.target.value)}
                  disabled={statsGenerationMutation.isLoading}
                />
              </label>
            </div>
            <label>
              {t('admin.debugTools.generateStatistics.userCount')}
              <input
                type="number"
                min="1"
                value={statsUserCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setStatsUserCount(isNaN(value) ? 1 : value);
                }}
                disabled={statsGenerationMutation.isLoading}
              />
            </label>
            <div className="debug-stats-range">
              <label>
                {t('admin.debugTools.generateStatistics.tasksPerUserMin')}
                <input
                  type="number"
                  min="1"
                  value={statsTasksMin}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setStatsTasksMin(isNaN(value) ? 1 : value);
                  }}
                  disabled={statsGenerationMutation.isLoading}
                />
              </label>
              <label>
                {t('admin.debugTools.generateStatistics.tasksPerUserMax')}
                <input
                  type="number"
                  min="1"
                  value={statsTasksMax}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setStatsTasksMax(isNaN(value) ? 1 : value);
                  }}
                  disabled={statsGenerationMutation.isLoading}
                />
              </label>
            </div>
            <div className="debug-stats-range">
              <label>
                {t('admin.debugTools.generateStatistics.co2PerTaskMin')} (kg)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={statsCo2Min}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setStatsCo2Min(isNaN(value) ? 0 : value);
                  }}
                  disabled={statsGenerationMutation.isLoading}
                />
              </label>
              <label>
                {t('admin.debugTools.generateStatistics.co2PerTaskMax')} (kg)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={statsCo2Max}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setStatsCo2Max(isNaN(value) ? 0 : value);
                  }}
                  disabled={statsGenerationMutation.isLoading}
                />
              </label>
            </div>
            <button
              onClick={handleGenerateStatistics}
              disabled={
                statsGenerationMutation.isLoading ||
                !statsStartDate ||
                !statsEndDate ||
                statsUserCount < 1
              }
              className="debug-tool-button"
            >
              {statsGenerationMutation.isLoading
                ? t('admin.debugTools.generateStatistics.generating')
                : t('admin.debugTools.generateStatistics.button')}
            </button>
          </div>
        </div>

        {/* Tool 10: Tree-System Prototype App.jsx View */}
        <div className="debug-tool-card debug-tool-card-wide">
          <h2 className="debug-tool-title">{t('admin.debugTools.treeSystemApp.title')}</h2>
          <p className="debug-tool-description">{t('admin.debugTools.treeSystemApp.description')}</p>
          <div className="debug-tree-system-preview">
            <TreeSystemPrototypeApp />
          </div>
        </div>

        {/* Debug Logs Viewer */}
        <div className="debug-tool-card debug-tool-card-wide">
          <div className="debug-logs-header">
            <div>
              <h2 className="debug-tool-title">{t('admin.debugTools.logs.title')}</h2>
              <p className="debug-tool-description">{t('admin.debugTools.logs.description')}</p>
            </div>
            <div className="debug-logs-controls">
              <select
                value={logLevelFilter}
                onChange={(e) => setLogLevelFilter(e.target.value as 'all' | 'info' | 'warn' | 'error')}
                className="debug-logs-filter"
              >
                <option value="all">{t('admin.debugTools.logs.filterAll')}</option>
                <option value="info">{t('admin.debugTools.logs.filterInfo')}</option>
                <option value="warn">{t('admin.debugTools.logs.filterWarn')}</option>
                <option value="error">{t('admin.debugTools.logs.filterError')}</option>
              </select>
              <input
                type="text"
                value={logOperationFilter}
                onChange={(e) => setLogOperationFilter(e.target.value)}
                placeholder={t('admin.debugTools.logs.filterOperation')}
                className="debug-logs-filter"
              />
              <button
                onClick={() => refetchLogs()}
                className="debug-tool-button secondary"
                title={t('admin.debugTools.logs.refresh')}
              >
                🔄
              </button>
              <button
                onClick={() => clearLogsMutation.mutate()}
                disabled={clearLogsMutation.isLoading}
                className="debug-tool-button"
              >
                {t('admin.debugTools.logs.clear')}
              </button>
            </div>
          </div>
          <div className="debug-logs-container">
            {logsData?.logs && logsData.logs.length > 0 ? (
              <div className="debug-logs-list">
                {logsData.logs.map((log: any, index: number) => (
                  <div key={index} className={`debug-log-entry debug-log-${log.level}`}>
                    <div className="debug-log-header">
                      <span className="debug-log-timestamp">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className={`debug-log-level debug-log-level-${log.level}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="debug-log-operation">{log.operation}</span>
                      {log.userEmail && (
                        <span className="debug-log-user">Admin: {log.userEmail}</span>
                      )}
                    </div>
                    <div className="debug-log-message">{log.message}</div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="debug-log-details">
                        <summary>{t('admin.debugTools.logs.viewDetails')}</summary>
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="debug-logs-empty">
                <p>{t('admin.debugTools.logs.empty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

