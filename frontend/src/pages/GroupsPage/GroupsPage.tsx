import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UserTeamsContestsSections } from '../../components/Groups/UserTeamsContestsSections';
import './GroupsPage.css';

function GroupsPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash !== '#contests') return;
    document.getElementById('contests')?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="groups-page">
      <UserTeamsContestsSections />
    </div>
  );
}

export default GroupsPage;
