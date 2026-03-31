import { useTranslation } from 'react-i18next';
import type { User } from '../../stores/authStore';
import { getForestDisplayName, getPlayerCharacterEmoji } from '../../constants/playerCharacter';
import './ForestPlayerCharacter.css';

type Props = {
  user: User;
  onOpenMore: () => void;
  /** Waldoberfläche: links unten über dem Canvas */
  variant?: 'default' | 'overlay';
};

export default function ForestPlayerCharacter({ user, onOpenMore, variant = 'default' }: Props) {
  const { t } = useTranslation();
  const profile = user.playerProfile;
  const emoji = getPlayerCharacterEmoji(profile);
  const display = getForestDisplayName(user.name, profile);
  const showCta = profile?.status === 'completed' || profile?.status === 'skipped';
  const rootClass =
    variant === 'overlay' ? 'forest-player-character forest-player-character--overlay' : 'forest-player-character';

  return (
    <div className={rootClass}>
      <button
        type="button"
        className="forest-player-character__figure"
        onClick={onOpenMore}
        aria-label={t('playerProfile.forest.figureAria')}
      >
        <span className="forest-player-character__emoji" aria-hidden>
          {emoji}
        </span>
        <span className="forest-player-character__name">{display}</span>
      </button>
      {showCta ? (
        <button type="button" className="forest-player-character__more" onClick={onOpenMore}>
          {t('playerProfile.moreAbout.shortCta')}
        </button>
      ) : (
        <p className="forest-player-character__hint">{t('playerProfile.forest.undecidedHint')}</p>
      )}
    </div>
  );
}
