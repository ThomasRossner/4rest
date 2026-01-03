import { useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { BarChart } from '../../components/Charts/BarChart';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './SurveyAnalytics.css';

interface SurveyAnalyticsData {
  taskId: string;
  taskTitle: string;
  totalResponses: number;
  questions: {
    questionId: string;
    questionText: string;
    type: 'single_choice' | 'multiple_choice' | 'text' | 'rating';
    responses: {
      options?: { [option: string]: number };
      average?: number;
      distribution?: { [rating: number]: number };
      responseCount?: number;
    };
  }[];
}

export function SurveyAnalytics() {
  const { t } = useTranslation();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Fetch all survey tasks for the dropdown
  const { data: allTasks } = useQuery(
    ['adminTasks', 'survey'],
    () => api.getTasks({ includeAll: true, includeInactive: false }),
    {
      select: (tasks) => tasks.filter((task: any) => task.type === 'survey'),
    }
  );

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<SurveyAnalyticsData[]>(
    ['surveyAnalytics', selectedTaskId],
    () => api.getSurveyAnalytics(selectedTaskId || undefined),
    {
      enabled: true,
    }
  );

  // When no task is selected, show all surveys combined or the first one
  // When a task is selected, show only that task's analytics
  const selectedAnalytics = selectedTaskId
    ? analytics?.find((a) => a.taskId === selectedTaskId)
    : analytics && analytics.length > 0
    ? analytics[0]
    : null;

  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTaskId(e.target.value);
  };

  return (
    <div className="survey-analytics-page">
      <h1 className="survey-analytics-title">{t('admin.surveyAnalytics.title')}</h1>

      <div className="survey-analytics-controls">
        <label htmlFor="survey-task-select" className="survey-analytics-label">
          {t('admin.surveyAnalytics.selectTask')}
        </label>
        <select
          id="survey-task-select"
          value={selectedTaskId}
          onChange={handleTaskChange}
          className="survey-analytics-select"
        >
          <option value="">{t('admin.surveyAnalytics.allSurveys')}</option>
          {allTasks?.map((task: any) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSkeleton lines={10} />
      ) : !selectedAnalytics || selectedAnalytics.totalResponses === 0 ? (
        <EmptyState
          title={t('admin.surveyAnalytics.noData')}
          description={t('admin.surveyAnalytics.noDataDescription')}
        />
      ) : (
        <div className="survey-analytics-content">
          <div className="survey-analytics-header">
            <h2>{selectedAnalytics.taskTitle}</h2>
            <div className="survey-analytics-stats">
              <span className="survey-analytics-stat">
                {t('admin.surveyAnalytics.totalResponses', {
                  count: selectedAnalytics.totalResponses,
                })}
              </span>
            </div>
          </div>

          <div className="survey-analytics-questions">
            {selectedAnalytics.questions.map((question) => {
              if (question.type === 'single_choice' || question.type === 'multiple_choice') {
                // Convert options object to array for bar chart
                const chartData = question.responses.options
                  ? Object.entries(question.responses.options).map(([label, value]) => ({
                      label,
                      value: value as number,
                    }))
                  : [];

                return (
                  <BarChart
                    key={question.questionId}
                    title={question.questionText}
                    data={chartData}
                  />
                );
              } else if (question.type === 'rating') {
                // Convert rating distribution to bar chart data
                const chartData = question.responses.distribution
                  ? Object.entries(question.responses.distribution)
                      .map(([label, value]) => ({
                        label,
                        value: value as number,
                      }))
                      .sort((a, b) => parseFloat(a.label) - parseFloat(b.label))
                  : [];

                const average = question.responses.average;

                return (
                  <div key={question.questionId} className="survey-question-rating">
                    <BarChart
                      title={question.questionText}
                      data={chartData}
                    />
                    {average !== undefined && (
                      <div className="survey-rating-average">
                        {t('admin.surveyAnalytics.averageRating', {
                          value: average.toFixed(2),
                        })}
                      </div>
                    )}
                  </div>
                );
              } else if (question.type === 'text') {
                return (
                  <div key={question.questionId} className="survey-question-text">
                    <h3 className="survey-question-title">{question.questionText}</h3>
                    <div className="survey-text-response-count">
                      {t('admin.surveyAnalytics.textResponses', {
                        count: question.responses.responseCount || 0,
                      })}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

