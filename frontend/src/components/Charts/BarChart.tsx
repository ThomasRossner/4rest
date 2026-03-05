import { useTranslation } from 'react-i18next';
import './BarChart.css';

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  maxValue?: number;
}

// Color palette for bars - using a variety of distinct colors
const BAR_COLORS = [
  'linear-gradient(135deg, #2d5016 0%, #3f6f20 100%)', // Primary green
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-red
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue-cyan
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green-cyan
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink-yellow
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Cyan-purple
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Light blue-pink
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Light pink
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Orange
];

// Hover colors (slightly lighter versions)
const BAR_HOVER_COLORS = [
  'linear-gradient(135deg, #3f6f20 0%, #5a8c3a 100%)',
  'linear-gradient(135deg, #764ba2 0%, #8b6bb8 100%)',
  'linear-gradient(135deg, #f5576c 0%, #f77a8a 100%)',
  'linear-gradient(135deg, #00f2fe 0%, #33f5fe 100%)',
  'linear-gradient(135deg, #38f9d7 0%, #5afbe0 100%)',
  'linear-gradient(135deg, #fee140 0%, #fef460 100%)',
  'linear-gradient(135deg, #330867 0%, #4a0d8a 100%)',
  'linear-gradient(135deg, #fed6e3 0%, #fee0ea 100%)',
  'linear-gradient(135deg, #fecfef 0%, #fee0f5 100%)',
  'linear-gradient(135deg, #fcb69f 0%, #fdc8b3 100%)',
];

export function BarChart({ data, title, maxValue }: BarChartProps) {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return (
      <div className="bar-chart-container">
        {title && <h3 className="bar-chart-title">{title}</h3>}
        <div className="bar-chart-empty">{t('common.noData')}</div>
      </div>
    );
  }

  // Calculate max value if not provided
  const calculatedMax = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bar-chart-container">
      {title && <h3 className="bar-chart-title">{title}</h3>}
      <div className="bar-chart">
        {data.map((item, index) => {
          const percentage = (item.value / calculatedMax) * 100;
          const colorIndex = index % BAR_COLORS.length;
          const barColor = BAR_COLORS[colorIndex];
          const hoverColor = BAR_HOVER_COLORS[colorIndex];
          
          return (
            <div key={index} className="bar-chart-item">
              <div className="bar-chart-label">{item.label}</div>
              <div className="bar-chart-bar-container">
                <div
                  className="bar-chart-bar"
                  style={{ 
                    height: `${percentage}%`,
                    background: barColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = hoverColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = barColor;
                  }}
                  title={`${item.label}: ${item.value}`}
                >
                  <span className="bar-chart-value">{item.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
