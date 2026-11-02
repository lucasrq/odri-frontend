/**
 * A mesma regra de pontos do Spring (SugestaoService), usada no celular de exemplo
 * da página inicial. O app de verdade pede a sugestão pro Spring.
 */

export type Intensidade = 'LEVE' | 'MEDIA' | 'FORTE'
export type ClimaPerfume = 'CALOR' | 'FRIO' | 'TODOS'
export type Tempo = 'CALOR' | 'AMENO' | 'FRIO'
export type Periodo = 0 | 1 | 2 // manhã, tarde, noite

export interface PerfumeExemplo {
  nome: string
  familia: string
  intensidade: Intensidade
  clima: ClimaPerfume
}

export const PERIODOS = ['Manhã', 'Tarde', 'Noite'] as const

const QUANDO = ['de manhã', 'de tarde', 'de noite']
const INTENSIDADE_TEXTO: Record<Intensidade, string> = {
  LEVE: 'leve',
  MEDIA: 'de intensidade média',
  FORTE: 'marcante',
}
export const INTENSIDADE_CURTA: Record<Intensidade, string> = {
  LEVE: 'Leve',
  MEDIA: 'Média',
  FORTE: 'Intenso',
}
const CLIMA_TEXTO: Record<ClimaPerfume, string> = {
  CALOR: 'combina com calor',
  FRIO: 'combina com frio',
  TODOS: 'vai bem em qualquer clima',
}

/** 26 °C ou mais = calor; 18 °C ou menos = frio; no meio = ameno */
export function tempoDa(graus: number): Tempo {
  if (graus >= 26) return 'CALOR'
  if (graus <= 18) return 'FRIO'
  return 'AMENO'
}

export function pontos(p: PerfumeExemplo, tempo: Tempo, periodo: Periodo): number {
  let n = 0
  if (tempo === 'AMENO') n += 1
  else if (p.clima === tempo) n += 2
  else if (p.clima === 'TODOS') n += 1

  if (periodo === 2) {
    if (p.intensidade !== 'LEVE') n += 1
  } else if (p.intensidade !== 'FORTE') {
    n += 1
  }

  if (tempo === 'CALOR' && p.intensidade === 'FORTE') n -= 2
  return n
}

/** Do melhor pro pior. No exemplo o empate fica na ordem da lista (no app é sorteio). */
export function ranquear(perfumes: PerfumeExemplo[], graus: number, periodo: Periodo) {
  const tempo = tempoDa(graus)
  return [...perfumes].sort((a, b) => pontos(b, tempo, periodo) - pontos(a, tempo, periodo))
}

export function motivo(p: PerfumeExemplo, graus: number, periodo: Periodo): string {
  const tempo = tempoDa(graus)
  const dia = tempo === 'CALOR' ? 'Está calor' : tempo === 'FRIO' ? 'Está frio' : 'O clima está ameno'
  return `${dia} (${graus} °C) e é ${QUANDO[periodo]}: o ${p.nome} é ${INTENSIDADE_TEXTO[p.intensidade]} e ${CLIMA_TEXTO[p.clima]}.`
}
