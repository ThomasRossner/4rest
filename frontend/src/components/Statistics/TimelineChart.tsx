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
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('de') ? 'de-DE' : 'en-US';
  const sortedData = useMemo(
    () =>
      [...data].sort(
        (a, b) => new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime()
      ),
    [data]
  );

  const rangedData = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return [];

    const firstPositiveIndex = sortedData.findIndex((d) => d.totalCumulative > 0);
    const visibleStartIndex = firstPositiveIndex >= 0 ? firstPositiveIndex : 0;
    const visibleData = sortedData.slice(visibleStartIndex);

    if (visibleData.length === 0) return [];

    const byDate = new Map(visibleData.map((d) => [d.date, d]));
    const start = new Date(`${visibleData[0].date}T00:00:00`);
    const end = new Date(`${visibleData[visibleData.length - 1].date}T00:00:00`);

    const result: TimelineDataPoint[] = [];
    let cursor = new Date(start);
    let lastKnown = visibleData[0];

    while (cursor.getTime() <= end.getTime()) {
      const key = cursor.toISOString().slice(0, 10);
      const exact = byDate.get(key);
      if (exact) {
        lastKnown = exact;
        result.push(exact);
      } else {
        result.push({
          date: key,
          cumulativeByCategory: { ...lastKnown.cumulativeByCategory },
          totalCumulative: lastKnown.totalCumulative,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [sortedData]);

  const chartData = useMemo(() => {
    if (!rangedData || rangedData.length === 0) return null;

    const lastTotal = rangedData[rangedData.length - 1]?.totalCumulative ?? 0;
    const maxFromSeries = Math.max(...rangedData.map((d) => d.totalCumulative), 1);
    const profile = profileTotalPoints != null ? Math.max(0, profileTotalPoints) : null;
    // Nur skalieren, wenn der Verlauf aus user_tasks Punkte > 0 hat. Sonst würde ein hoher
    // users.points (Bonus, manuell, …) die Balken auf 0 % drücken („leeres“ Diagramm).
    const scaleMax =
      lastTotal === 0
        ? Math.max(maxFromSeries, 1)
        : profile != null
          ? Math.max(profile, lastTotal, 1)
          : Math.max(lastTotal, maxFromSeries, 1);

    const hasSonstige = rangedData.some((d) => categoryValue(d.cumulativeByCategory, 'sonstige') > 0);

    const labelStep = Math.max(1, Math.ceil(rangedData.length / 14));
    const dense = rangedData.length > 72;

    return {
      scaleMax,
      profileForScale: profile,
      /** Profil-Skalierung nur relevant, wenn der Aufgaben-Verlauf > 0 ist */
      showProfileScaleHint: profile != null && lastTotal > 0,
      /** Profil-Punkte ohne Eintrag im Verlauf (user_tasks) */
      profilePointsWithoutTimeline:
        profile != null && profile > 0 && lastTotal === 0,
      hasSonstige,
      labelStep,
      dense,
      normalized: rangedData.map((d) => d.totalCumulative / scaleMax),
    };
  }, [rangedData, profileTotalPoints]);

  if (!chartData || rangedData.length === 0) {
    return <div className="timeline-chart-empty">{t('rankings.timeline.noData')}</div>;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' });
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString(dateLocale, { month: '2-digit', year: '2-digit' });
  };

  const last = rangedData[rangedData.length - 1];

  return (
    <div className="timeline-chart">
      <p className="timeline-chart-subtitle">{t('rankings.timeline.subtitle')}</p>
      {chartData.profilePointsWithoutTimeline && (
        <p className="timeline-chart-mismatch-hint" role="status">
          {t('rankings.timeline.profilePointsWithoutTimelineHint')}
        </p>
      )}
      <div className="timeline-chart-legend">
        {STACK_KEYS.filter((key) => key !== 'sonstige' || chartData.hasSonstige).map((key) => (
          <div key={key} className="timeline-legend-item timeline-legend-forest-sub">
            <span className={`timeline-legend-color timeline-legend-forest-${key}`} />
            <span>{t(`rankings.timeline.forest.${key}` as const)}</span>
          </div>
        ))}
      </div>
      <div className="timeline-chart-container">
        <div className="timeline-chart-axis-label timeline-chart-axis-label--y">
          {t('rankings.timeline.yAxisLabel')}
        </div>
        <div
          className={`timeline-chart-bars${chartData.dense ? ' timeline-chart-bars--dense' : ''}`}
        >
          {rangedData.map((point, index) => {
            const total = point.totalCumulative;
            const barHeightPct = chartData.normalized[index] * 100;
            const isFirst = index === 0;
            const isLast = index === rangedData.length - 1;
            const date = new Date(`${point.date}T12:00:00`);
            const isMonthStart = date.getDate() === 1;
            const veryLongRange = rangedData.length > 90;
            const longRange = rangedData.length > 45;
            const showLabel = veryLongRange
              ? isFirst || isLast || isMonthStart
              : longRange
                ? isFirst || isLast || isMonthStart || index % (chartData.labelStep * 2) === 0
                : isFirst || isLast || index % chartData.labelStep === 0;
            const labelText = veryLongRange
              ? formatMonth(point.date)
              : longRange && isMonthStart
                ? formatMonth(point.date)
                : formatDate(point.date);

            return (
              <div key={point.date} className="timeline-bar-group">
                <div className="timeline-bar-label">
                  {showLabel ? labelText : '\u00a0'}
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
          {chartData.showProfileScaleHint && chartData.profileForScale != null && (
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
        <div className="timeline-chart-axis-label timeline-chart-axis-label--x">
          {t('rankings.timeline.xAxisLabel')}
        </div>
      </div>
    </div>
  );
}
