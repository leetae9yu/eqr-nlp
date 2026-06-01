type Point = { date: string; value: number };

export function MiniChart({ series, label }: { series: Point[]; label: string }) {
  const values = series.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = series
    .map((point, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * 100;
      const y = 46 - ((point.value - min) / span) * 38;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <figure className="mini-chart" aria-label={`${label} 시계열 차트`}>
      <svg viewBox="0 0 100 52" role="img" aria-label={`${label} 미니 추세선`}>
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <figcaption>
        {series[0]?.date} → {series.at(-1)?.date}
      </figcaption>
    </figure>
  );
}
