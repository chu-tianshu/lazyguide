import { starPoints } from "./UsFlag";

/** People's Republic of China flag as inline SVG (no external image). */

const BIG = { x: 5, y: 5, r: 3 };
const SMALL = [
  { x: 10, y: 2 },
  { x: 12, y: 4 },
  { x: 12, y: 7 },
  { x: 10, y: 9 },
];

export function CnFlag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 20"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="30" height="20" fill="#de2910" />
      <polygon points={starPoints(BIG.x, BIG.y, BIG.r, BIG.r * 0.382)} fill="#ffde00" />
      {SMALL.map((s, i) => {
        // Each small star points one tip toward the large star.
        const angle = (Math.atan2(BIG.y - s.y, BIG.x - s.x) * 180) / Math.PI + 90;
        return (
          <polygon
            key={i}
            points={starPoints(0, 0, 1, 0.382)}
            fill="#ffde00"
            transform={`translate(${s.x} ${s.y}) rotate(${angle.toFixed(2)})`}
          />
        );
      })}
    </svg>
  );
}
