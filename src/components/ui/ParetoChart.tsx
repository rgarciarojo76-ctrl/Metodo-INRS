import { useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import type { HierarchyResult } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface Props {
  results: HierarchyResult[];
}

export function ParetoChart({ results }: Props) {
  const chartRef = useRef<ChartJS | null>(null);

  const data = useMemo(() => {
    const labels = results.map(r => r.agentName.length > 15 ? r.agentName.substring(0, 15) + '…' : r.agentName);
    const scores = results.map(r => r.riskScore);
    const total = scores.reduce((s, v) => s + v, 0);

    // Cumulative percentage
    const cumulativePercents = scores.reduce<number[]>((acc, s) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(prev + (s / total) * 100);
      return acc;
    }, []);

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Riesgo Potencial (PRP)',
          data: scores,
          backgroundColor: results.map(r => {
            if (r.riskScore >= 10000) return 'rgba(239, 68, 68, 0.7)';
            if (r.riskScore >= 1000) return 'rgba(249, 115, 22, 0.7)';
            if (r.riskScore >= 100) return 'rgba(245, 158, 11, 0.7)';
            return 'rgba(34, 197, 94, 0.7)';
          }),
          borderColor: results.map(r => {
            if (r.riskScore >= 10000) return 'rgb(239, 68, 68)';
            if (r.riskScore >= 1000) return 'rgb(249, 115, 22)';
            if (r.riskScore >= 100) return 'rgb(245, 158, 11)';
            return 'rgb(34, 197, 94)';
          }),
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line' as const,
          label: '% Acumulado',
          data: cumulativePercents,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2.5,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointRadius: 4,
          tension: 0.3,
          fill: false,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    };
  }, [results]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyleWidth: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Puntuación Riesgo Potencial',
          font: { size: 12 },
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: '% Acumulado',
          font: { size: 12 },
        },
        grid: { drawOnChartArea: false },
      },
    },
  }), []);

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-surface-400">
        Sin datos para mostrar
      </div>
    );
  }

  return <Chart ref={chartRef} type="bar" data={data} options={options} />;
}
