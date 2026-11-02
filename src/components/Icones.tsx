/** Logo, ícone do app e ícones de traço usados no site (sem emoji). */

interface Props {
  tamanho?: number
}

const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Logo({ largura = 76 }: { largura?: number }) {
  return (
    <svg width={largura} height={largura * 0.49} viewBox="0 0 216 106" aria-hidden="true" className="logo">
      <g fill="none" stroke="currentColor" strokeWidth="13">
        <circle cx="40" cy="65" r="23.5" />
        <circle cx="106" cy="65" r="23.5" />
        <line x1="129.5" y1="12" x2="129.5" y2="95" />
        <path d="M158 95 V65 A23.5 23.5 0 0 1 181.5 41.5" />
        <line x1="200" y1="35" x2="200" y2="95" />
      </g>
      <circle cx="200" cy="18" r="8" className="ponto-destaque" />
    </svg>
  )
}

export function IconeApp({ tamanho = 64 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 512 512" aria-hidden="true" className="icone-app">
      <rect width="512" height="512" rx="112" className="icone-app-fundo" />
      <circle cx="246" cy="290" r="110" fill="none" strokeWidth="52" className="icone-app-anel" />
      <circle cx="380" cy="140" r="34" className="ponto-destaque" />
    </svg>
  )
}

export function Seta({ tamanho = 20 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="2.4" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function Check({ tamanho = 18 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="3" aria-hidden="true" className="check">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function Sol({ tamanho = 20 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  )
}

export function Lua({ tamanho = 20 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="2" aria-hidden="true">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
    </svg>
  )
}

export function Local({ tamanho = 14 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="2.4" aria-hidden="true">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}

export function Trocar({ tamanho = 18 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="2.2" aria-hidden="true">
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  )
}

export function Fechar({ tamanho = 18 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function Cadeado({ tamanho = 13 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="2.4" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function Mais({ tamanho = 22 }: Props) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" {...traco} strokeWidth="2.4" aria-hidden="true" className="faq-icone">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
