import './DashboardCard.css';

interface DashboardCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

export function DashboardCard({ icon, title, description, onClick, className = '' }: DashboardCardProps) {
  return (
    <button className={`dashboard-card ${className}`} onClick={onClick} type="button">
      <span className="dashboard-card-icon">{icon}</span>
      <h2 className="dashboard-card-title">{title}</h2>
      <p className="dashboard-card-description">{description}</p>
    </button>
  );
}
