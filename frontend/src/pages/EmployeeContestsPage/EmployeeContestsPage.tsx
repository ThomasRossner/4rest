import { useState } from 'react';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { ContestCreator } from '../../components/Contests/ContestCreator';
import { ContestQrCodeCarousel } from '../../components/Contests/ContestQrCodeCarousel';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import './EmployeeContestsPage.css';

function EmployeeContestsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.user?.id);
  const [showContestCreator, setShowContestCreator] = useState(false);

  // Get contests for guests and stakeholders only
  const { data: contests, isLoading, refetch: refetchContests } = useQuery(
    ['employeeContests', userId],
    () => api.getEmployeeContests(),
    { enabled: !!userId && (user?.role === 'employee' || user?.role === 'administrator') }
  );

  if (isLoading) {
    return (
      <div className="employee-contests-page">
        <h1 className="employee-contests-title">{t('employee.contests.title', 'Contest-Verwaltung')}</h1>
        <LoadingSkeleton lines={10} />
      </div>
    );
  }

  return (
    <div className="employee-contests-page">
      <h1 className="employee-contests-title">{t('employee.contests.title', 'Contest-Verwaltung')}</h1>
      <p className="employee-contests-subtitle">{t('employee.contests.subtitle', 'Verwalten Sie Contests für Gäste und Stakeholder')}</p>

      <div className="employee-contests-actions">
        <button
          type="button"
          className="employee-contests-create-button"
          onClick={() => setShowContestCreator(true)}
        >
          {t('employee.contests.createButton', 'Neuen Contest anlegen')}
        </button>
      </div>

      {showContestCreator && (
        <ContestCreator
          onSuccess={(contestId) => {
            refetchContests();
            setShowContestCreator(false);
          }}
          onClose={() => setShowContestCreator(false)}
        />
      )}

      {contests && contests.length > 0 ? (
        <div className="employee-contests-list">
          {contests.map((contest: any) => (
            <ContestQrCodeCarousel
              key={contest.id}
              contestId={contest.id}
              contestName={contest.name}
              startDate={contest.start_date}
              endDate={contest.end_date}
              rewardsAwarded={contest.rewards_awarded}
              isCreator={contest.created_by === userId}
              onDissolve={() => refetchContests()}
              onLeave={() => refetchContests()}
            />
          ))}
        </div>
      ) : (
        <p className="employee-contests-empty">{t('employee.contests.empty', 'Noch keine Contests für Gäste und Stakeholder')}</p>
      )}
    </div>
  );
}

export default EmployeeContestsPage;

