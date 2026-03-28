import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FOREST_CATEGORY_KEYS, type ForestCategoryKey } from '../../constants/forestCategories';
import './TimelineChart.css';

type ForestDay = {
  kommunikation: number;
  mensch: number;
  natur: number;
  ressourcen: number;
};

type TimelineDataPoint = {
  date: string;
  points: number;
  trees: number;
  co2: number;
  forestDay?: ForestDay;
};

type TimelineChartProps = {
  data: TimelineDataPoint[];
};

function sumForestDay(fd: ForestDay | undefined): number {
  if (!fd) return 0;
  return FOREST_CATEGORY_KEYS.reduce((s, k) => s + (fd[k] || 0), 0);
}

export function TimelineChart({ data }: TimelineChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxPoints = Math.max(...data.map(d => d.points), 1);
    const maxTrees = Math.max(...data.map(d => d.trees), 1);
    const maxCo2 = Math.max(...data.map(d => d.co2), 1);

    const forestSums = data.map(d => sumForestDay(d.forestDay));
    const hasForest = forestSums.some(s => s > 0);
    const maxForestDay = Math.max(...forestSums, 1);

    return {
      points: data.map(d => ({ ...d, normalized: d.points / maxPoints })),
      trees: data.map(d => ({ ...d, normalized: d.trees / maxTrees })),
      co2: data.map(d => ({ ...d, normalized: d.co2 / maxCo2 })),
      forest: data.map((d, i) => ({
        ...d,
        forestSum: forestSums[i],
        normalized: forestSums[i] / maxForestDay,
      })),
      maxPoints,
      maxTrees,
      maxCo2,
      maxForestDay,
      hasForest,
    };
  }, [data]);

  if (!chartData || chartData.points.length === 0) {
    return <div className="timeline-chart-empty">{t('rankings.timeline.noData')}</div>;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="timeline-chart">
      <div className="timeline-chart-legend">
        <div className="timeline-legend-item">
          <span className="timeline-legend-color timeline-legend-points"></span>
          <span>{t('rankings.timeline.points')}</span>
        </div>
        <div className="timeline-legend-item">
          <span className="timeline-legend-color timeline-legend-trees"></span>
          <span>{t('rankings.timeline.trees')}</span>
        </div>
        <div className="timeline-legend-item">
          <span className="timeline-legend-color timeline-legend-co2"></span>
          <span>{t('rankings.timeline.co2')}</span>
        </div>
        {chartData.hasForest && (
          <>
            {FOREST_CATEGORY_KEYS.map((key) => (
              <div key={key} className="timeline-legend-item timeline-legend-forest-sub">
                <span className={`timeline-legend-color timeline-legend-forest-${key}`}></span>
                <span>{t(`rankings.timeline.forest.${key}` as const)}</span>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="timeline-chart-container">
        <div className="timeline-chart-bars">
          {chartData.points.map((point, index) => {
            const fd = point.forestDay;
            const forestSum = chartData.forest[index].forestSum;
            const forestNorm = chartData.forest[index].normalized;

            return (
              <div key={index} className="timeline-bar-group">
                <div className="timeline-bar-label">{formatDate(point.date)}</div>
                <div className="timeline-bars">
                  <div
                    className="timeline-bar timeline-bar-points"
                    style={{ height: `${point.normalized * 100}%` }}
                    title={`${point.points} ${t('rankings.points')}`}
                  ></div>
                  <div
                    className="timeline-bar timeline-bar-trees"
                    style={{ height: `${chartData.trees[index].normalized * 100}%` }}
                    title={`${chartData.trees[index].trees} ${t('rankings.timeline.trees')}`}
                  ></div>
                  <div
                    className="timeline-bar timeline-bar-co2"
                    style={{ height: `${chartData.co2[index].normalized * 100}%` }}
                    title={`${chartData.co2[index].co2.toFixed(2)} kg CO₂`}
                  ></div>
                  {chartData.hasForest && (
                    <div
                      className={`timeline-bar-forest-stack ${forestSum === 0 ? 'timeline-bar-forest-empty' : ''}`}
                      style={{
                        height: forestSum > 0 ? `${forestNorm * 100}%` : '4px',
                      }}
                      title={
                        forestSum > 0
                          ? `${t('rankings.timeline.forestDay')}: ${forestSum}`
                          : t('rankings.timeline.forestDay')
                      }
                    >
                      {forestSum > 0 &&
                        fd &&
                        FOREST_CATEGORY_KEYS.map((k: ForestCategoryKey) => {
                          const v = fd[k] || 0;
                          if (v <= 0) return null;
                          const pct = forestSum > 0 ? (v / forestSum) * 100 : 0;
                          return (
                            <div
                              key={k}
                              className={`timeline-forest-seg timeline-forest-${k}`}
                              style={{ height: `${pct}%` }}
                              title={`${t(`rankings.timeline.forest.${k}`)}: ${v}`}
                            />
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="timeline-chart-values">
          <div className="timeline-value-row">
            <span>{t('rankings.timeline.maxPoints')}: {chartData.maxPoints}</span>
          </div>
          <div className="timeline-value-row">
            <span>{t('rankings.timeline.maxTrees')}: {chartData.maxTrees}</span>
          </div>
          <div className="timeline-value-row">
            <span>{t('rankings.timeline.maxCo2')}: {chartData.maxCo2.toFixed(2)} kg</span>
          </div>
          {chartData.hasForest && (
            <div className="timeline-value-row">
              <span>{t('rankings.timeline.maxForestDay')}: {chartData.maxForestDay}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
