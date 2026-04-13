import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import type { User } from '../../stores/authStore';
import { api } from '../../services/api';
import type { OnboardingConfig } from '../../types/onboarding';
import { resolveOnboardingBackgroundUrl } from '../../utils/onboardingBackgroundUrl';
import { getForestDisplayName, getPlayerCharacterEmoji, getPlayerCharacterIconUrl } from '../../constants/playerCharacter';
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
  const { data: onboardingConfig } = useQuery(
    'onboardingConfig',
    () => api.getOnboardingConfig() as Promise<OnboardingConfig>,
    { staleTime: 5 * 60 * 1000 }
  );
  const iconUrl = resolveOnboardingBackgroundUrl(
    getPlayerCharacterIconUrl(profile, onboardingConfig?.characterIcons)
  );
  const display = getForestDisplayName(user.name, profile);
  const showCta =
    variant !== 'overlay' && (profile?.status === 'completed' || profile?.status === 'skipped');
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
        {iconUrl ? (
          <img src={iconUrl} alt="" className="forest-player-character__icon-image" aria-hidden />
        ) : (
          <span className="forest-player-character__emoji" aria-hidden>
            {emoji}
          </span>
        )}
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
