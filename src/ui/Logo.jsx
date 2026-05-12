import { colors } from "../styles/tokens";

/**
 * Logo do FarmaFy — pílula bicolor horizontal.
 * Visual minimalista, escala perfeito em qualquer tamanho.
 *
 * Props:
 *  size : número (largura em px). Default 56. A altura é proporcional.
 */
export default function Logo({ size = 56 }) {
  // Cápsula 2:1 (largura:altura) — proporção real de pílula farmacêutica
  const w = size;
  const h = size * 0.5;
  return (
    <svg
      viewBox="0 0 64 32"
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FarmaFy"
    >
      <defs>
        <clipPath id="farmafy-pill-clip">
          <rect x="2" y="2" width="60" height="28" rx="14" />
        </clipPath>
        <linearGradient id="farmafy-light" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
        <linearGradient id="farmafy-dark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={colors.brand} />
          <stop offset="100%" stopColor={colors.brandDark} />
        </linearGradient>
      </defs>

      <g clipPath="url(#farmafy-pill-clip)">
        {/* Metade esquerda: gradiente claro */}
        <rect x="2"  y="2" width="30" height="28" fill="url(#farmafy-light)" />
        {/* Metade direita: gradiente escuro */}
        <rect x="32" y="2" width="30" height="28" fill="url(#farmafy-dark)" />
        {/* Brilho sutil no topo (acabamento "real" de pílula) */}
        <rect x="6" y="5" width="22" height="3" rx="1.5" fill="#fff" opacity=".55" />
      </g>

      {/* Contorno da cápsula */}
      <rect
        x="2" y="2" width="60" height="28" rx="14"
        fill="none"
        stroke={colors.brandDark}
        strokeWidth="1.4"
      />
      {/* Divisória central */}
      <line
        x1="32" y1="3" x2="32" y2="29"
        stroke={colors.brandDark}
        strokeWidth="1.2"
        strokeOpacity=".55"
      />
    </svg>
  );
}
