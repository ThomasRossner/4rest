import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './TimelineChart.css';

type TimelineDataPoint = {
  date: string;
  points: number;
  trees: number;
  co2: number;
};

type TimelineChartProps = {
  data: TimelineDataPoint[];
};

export function TimelineChart({ data }: TimelineChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxPoints = Math.max(...data.map(d => d.points), 1);
    const maxTrees = Math.max(...data.map(d => d.trees), 1);
    const maxCo2 = Math.max(...data.map(d => d.co2), 1);

    return {
      points: data.map(d => ({ ...d, normalized: d.points / maxPoints })),
      trees: data.map(d => ({ ...d, normalized: d.trees / maxTrees })),
      co2: data.map(d => ({ ...d, normalized: d.co2 / maxCo2 })),
      maxPoints,
      maxTrees,
      maxCo2,
    };
  }, [data]);

  if (!chartData || chartData.points.length === 0) {
    return <div className="timeline-chart-empty">{t('rankings.timeline.noData', 'Keine Daten verfügbar')}</div>;
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
          <span>{t('rankings.timeline.points', 'Punkte')}</span>
        </div>
        <div className="timeline-legend-item">
          <span className="timeline-legend-color timeline-legend-trees"></span>
          <span>{t('rankings.timeline.trees', 'Bäume')}</span>
        </div>
        <div className="timeline-legend-item">
          <span className="timeline-legend-color timeline-legend-co2"></span>
          <span>{t('rankings.timeline.co2', 'CO₂ (kg)')}</span>
        </div>
      </div>
      <div className="timeline-chart-container">
        <div className="timeline-chart-bars">
          {displayData.points.map((point, index) => (
            <div key={index} className="timeline-bar-group">
              <div className="timeline-bar-label">{formatDate(point.date)}</div>
              <div className="timeline-bars">
                <div
                  className="timeline-bar timeline-bar-points"
                  style={{ height: `${point.normalized * 100}%` }}
                  title={`${point.points} ${t('rankings.points', 'Punkte')}`}
                ></div>
                <div
                  className="timeline-bar timeline-bar-trees"
                  style={{ height: `${displayData.trees[index].normalized * 100}%` }}
                  title={`${displayData.trees[index].trees} ${t('rankings.timeline.trees', 'Bäume')}`}
                ></div>
                <div
                  className="timeline-bar timeline-bar-co2"
                  style={{ height: `${displayData.co2[index].normalized * 100}%` }}
                  title={`${displayData.co2[index].co2.toFixed(2)} kg CO₂`}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="timeline-chart-values">
          <div className="timeline-value-row">
            <span>{t('rankings.timeline.maxPoints', 'Max. Punkte')}: {displayData.maxPoints}</span>
          </div>
          <div className="timeline-value-row">
            <span>{t('rankings.timeline.maxTrees', 'Max. Bäume')}: {displayData.maxTrees}</span>
          </div>
          <div className="timeline-value-row">
            <span>{t('rankings.timeline.maxCo2', 'Max. CO₂')}: {displayData.maxCo2.toFixed(2)} kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}

