import { REWARD_TYPE_ICONS } from '../../constants/rewardIcons';
import { RewardType } from '../../constants/enums';

export const RewardTypeIcon = ({ type, thumbnailUrl }: { type: RewardType; thumbnailUrl?: string | null }) => {
  if (thumbnailUrl) {
    return <img src={thumbnailUrl} alt={type} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', display: 'block', flexShrink: 0 }} />;
  }
  const typeIcon = REWARD_TYPE_ICONS[type] ?? '🎁';
  return (
    <span aria-hidden="true" style={{ fontSize: '48px', lineHeight: '1', display: 'inline-block', flexShrink: 0 }}>
      {typeIcon}
    </span>
  );
};
