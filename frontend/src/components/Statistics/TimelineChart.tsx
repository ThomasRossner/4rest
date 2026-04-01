import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FOREST_CATEGORY_KEYS, type ForestCategoryKey } from '../../constants/forestCategories';
import './TimelineChart.css';

const STACK_KEYS: (ForestCategoryKey | 'sonstige')[] = [...FOREST_CATEGORY_KEYS, 'sonstige'];

export type TimelineDataPoint = {
  date: string;
  cumulativeByCategory: {
    kommunikation: number;
    mensch: number;
    natur: number;
    ressourcen: number;
    sonstige: number;
  };
  totalCumulative: number;
};

type TimelineChartProps = {
  data: TimelineDataPoint[];
  /** Profil-Gesamtpunkte (`users.points`); Balkenhöhe = kumulativ / max(Profil, letzter Kumulativwert). */
  profileTotalPoints?: number;
};

function categoryValue(
  c: TimelineDataPoint['cumulativeByCategory'],
  k: ForestCategoryKey | 'sonstige'
): number {
  return c[k] ?? 0;
}

export function TimelineChart({ data, profileTotalPoints }: TimelineChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const lastTotal = data[data.length - 1]?.totalCumulative ?? 0;
    const maxFromSeries = Math.max(...data.map((d) => d.totalCumulative), 1);
    const profile = profileTotalPoints != null ? Math.max(0, profileTotalPoints) : null;
    const scaleMax =
      profile != null ? Math.max(profile, lastTotal, 1) : maxFromSeries;

    const hasSonstige = data.some((d) => categoryValue(d.cumulativeByCategory, 'sonstige') > 0);

    const labelStep = Math.max(1, Math.ceil(data.length / 14));
    const dense = data.length > 72;

    return {
      scaleMax,
      profileForScale: profile,
      hasSonstige,
      labelStep,
      dense,
      normalized: data.map((d) => d.totalCumulative / scaleMax),
    };
  }, [data, profileTotalPoints]);

  if (!chartData || data.length === 0) {
    return <div className="timeline-chart-empty">{t('rankings.timeline.noData')}</div>;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const last = data[data.length - 1];

  return (
    <div className="timeline-chart">
      <p className="timeline-chart-subtitle">{t('rankings.timeline.subtitle')}</p>
      <div className="timeline-chart-legend">
        {STACK_KEYS.filter((key) => key !== 'sonstige' || chartData.hasSonstige).map((key) => (
          <div key={key} className="timeline-legend-item timeline-legend-forest-sub">
            <span className={`timeline-legend-color timeline-legend-forest-${key}`} />
            <span>{t(`rankings.timeline.forest.${key}` as const)}</span>
          </div>
        ))}
      </div>
      <div className="timeline-chart-container">
        <div
          className={`timeline-chart-bars${chartData.dense ? ' timeline-chart-bars--dense' : ''}`}
        >
          {data.map((point, index) => {
            const total = point.totalCumulative;
            const barHeightPct = chartData.normalized[index] * 100;
            const showLabel = index === 0 || index === data.length - 1 || index % chartData.labelStep === 0;

            return (
              <div key={point.date} className="timeline-bar-group">
                <div className="timeline-bar-label">
                  {showLabel ? formatDate(point.date) : '\u00a0'}
                </div>
                <div className="timeline-bar-column">
                  <div
                    className={`timeline-stacked-bar ${total === 0 ? 'timeline-stacked-bar--empty' : ''}`}
                    style={{ height: total > 0 ? `${barHeightPct}%` : '6px' }}
                    title={STACK_KEYS.filter((k) => categoryValue(point.cumulativeByCategory, k) > 0)
                      .map(
                        (k) =>
                          `${t(`rankings.timeline.forest.${k}` as const)}: ${categoryValue(point.cumulativeByCategory, k)}`
                      )
                      .join(' · ')}
                  >
                    {total > 0 &&
                      STACK_KEYS.filter((key) => key !== 'sonstige' || chartData.hasSonstige).map((key) => {
                        const v = categoryValue(point.cumulativeByCategory, key);
                        if (v <= 0) return null;
                        const pct = total > 0 ? (v / total) * 100 : 0;
                        return (
                          <div
                            key={key}
                            className={`timeline-stacked-seg timeline-forest-${key}`}
                            style={{ height: `${pct}%` }}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="timeline-chart-values">
          <div className="timeline-value-row">
            <span>
              {t('rankings.timeline.totalCumulative')}: {last.totalCumulative}
            </span>
          </div>
          {chartData.profileForScale != null && (
            <div className="timeline-value-row timeline-value-row--muted">
              <span>
                {t('rankings.timeline.scaleToProfile', {
                  profile: chartData.profileForScale,
                  max: chartData.scaleMax,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
