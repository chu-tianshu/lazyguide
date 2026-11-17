/** United States flag as inline SVG (no external image). */

const W = 1235;
const H = 650;
const CANTON_W = 494;
const CANTON_H = 350;
const STRIPE_H = H / 13;

// Five-pointed star centred on (cx, cy).
export function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? outer : inner;
    const angle = (-90 + k * 36) * (Math.PI / 180);
    points.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}

// 50 stars in nine rows, alternating 6 and 5 stars.
const stars: string[] = [];
for (let row = 0; row < 9; row++) {
  const count = row % 2 === 0 ? 6 : 5;
  const y = ((row + 1) * CANTON_H) / 10;
  for (let col = 0; col < count; col++) {
    const x = row % 2 === 0 ? ((col + 1) * CANTON_W) / 7 : ((col + 1) * CANTON_W) / 6;
    stars.push(starPoints(x, y, 13, 5.2));
  }
}

export function UsFlag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="American flag"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={W} height={H} fill="#ffffff" />
      {Array.from({ length: 13 }).map((_, i) =>
        i % 2 === 0 ? (
          <rect key={i} y={i * STRIPE_H} width={W} height={STRIPE_H} fill="#b22234" />
        ) : null,
      )}
      <rect width={CANTON_W} height={CANTON_H} fill="#3c3b6e" />
      {stars.map((points, i) => (
        <polygon key={i} points={points} fill="#ffffff" />
      ))}
    </svg>
  );
}
