/** Cor e ícone de cada ocasião do Plus (o cartão do Hoje se pinta com ela). */

const TRACOS: Record<string, string> = {
  Trabalho: 'M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18',
  Reunião: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2.5 20a5.5 5.5 0 0 1 11 0M14 20a4.5 4.5 0 0 1 7.5-3.4',
  Faculdade: 'M2 9l10-5 10 5-10 5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6',
  Academia: 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12',
  Praia: 'M12 4v1M5.6 6.6l.7.7M18.4 6.6l-.7.7M8 13a4 4 0 0 1 8 0M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5',
  Igreja: 'M12 2v5M10 4h4M5 21v-8l7-5 7 5v8zM10 21v-4a2 2 0 0 1 4 0v4',
  Encontro: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  Festa: 'M4 20l5-14 9 9zM14 4l1 2M19 9l2-1M17 3v2',
}

export const COR_OCASIAO: Record<string, string> = {
  Trabalho: '#1F4E63',
  Reunião: '#1F4E63',
  Faculdade: '#2B4C8C',
  Academia: '#1F6B5E',
  Praia: '#137A86',
  Igreja: '#6B4E3A',
  Encontro: '#6E2342',
  Festa: '#4B2A7A',
}

export default function IconeOcasiao({ nome, tamanho = 22 }: { nome: string; tamanho?: number }) {
  return (
    <svg
      width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d={TRACOS[nome] ?? 'M12 3v18M3 12h18'} />
    </svg>
  )
}
