import { useQuery } from 'react-query';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import './RewardsPage.css';

function RewardsPage() {
  const { user } = useAuthStore();
  const { data: rewards } = useQuery('rewards', () => api.getRewards());

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (user && user.points >= cost) {
      try {
        await api.redeemReward(rewardId);
        alert('Reward redeemed successfully!');
      } catch (error) {
        alert('Failed to redeem reward');
      }
    } else {
      alert('Not enough points!');
    }
  };

  return (
    <div className="rewards-page">
      <h1 className="rewards-title">Rewards Marketplace</h1>
      <div className="rewards-balance">
        <span className="rewards-balance-label">Your Points:</span>
        <span className="rewards-balance-value">{user?.points || 0}</span>
      </div>
      <div className="rewards-grid">
        {rewards?.map((reward: any) => (
          <div key={reward.id} className="reward-card">
            <div className="reward-icon">{reward.icon || '🎁'}</div>
            <h3 className="reward-title">{reward.title}</h3>
            <p className="reward-description">{reward.description}</p>
            <div className="reward-footer">
              <span className="reward-cost">{reward.pointsCost} points</span>
              <button
                className="reward-button"
                onClick={() => handleRedeem(reward.id, reward.pointsCost)}
                disabled={!user || user.points < reward.pointsCost}
              >
                Redeem
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RewardsPage;
