import { api } from './api'

export type FaixaPreco = 'ATE_150' | 'DE_150_A_400' | 'ACIMA_400'
export type LojaParceira = 'AMAZON' | 'MERCADO_LIVRE'

/** Um perfume da Loja (OfertaDTO). */
export type Oferta = {
  id: number
  nome: string
  marca: string
  familia: string
  intensidade: string
  faixa: FaixaPreco
  loja: LojaParceira | null
  link: string
  genero: Genero | null
  naColecao: boolean
  /** combina com o clima e a hora de agora (só vem quando o catálogo recebe o tempo) */
  combina: boolean
}

export type Genero = 'MASCULINO' | 'FEMININO' | 'UNISSEX'
export type OrdemPreco = 'menor' | 'maior'

/** Resposta de GET /loja (LojaDTO): até 3 ofertas, barato → médio → caro. */
export type RespostaLoja = { tempo: string; titulo: string; ofertas: Oferta[] }

/** tempo = o mesmo da sugestão do dia (CALOR, AMENO, FRIO); graus = temperatura exata. Sem os dois = qualquer clima. */
export function buscarLoja(tempo?: string, graus?: number | null) {
  const q = new URLSearchParams()
  if (tempo && tempo !== 'DESCONHECIDO') q.set('tempo', tempo)
  if (graus != null) q.set('graus', String(graus))
  const texto = q.toString()
  return api<RespostaLoja>(`/loja${texto ? `?${texto}` : ''}`)
}

/** Catálogo inteiro da Loja (GET /loja/catalogo). genero vazio = todos. tempo marca quem "combina hoje". */
export function buscarCatalogo(filtro: { busca?: string; genero?: Genero | ''; ordem?: OrdemPreco; tempo?: string; graus?: number | null }) {
  const q = new URLSearchParams()
  if (filtro.busca?.trim()) q.set('busca', filtro.busca.trim())
  if (filtro.genero) q.set('genero', filtro.genero)
  if (filtro.ordem) q.set('ordem', filtro.ordem)
  if (filtro.tempo && filtro.tempo !== 'DESCONHECIDO') q.set('tempo', filtro.tempo)
  if (filtro.graus != null) q.set('graus', String(filtro.graus))
  const texto = q.toString()
  return api<Oferta[]>(`/loja/catalogo${texto ? `?${texto}` : ''}`)
}

export const NOME_GENERO: Record<Genero, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  UNISSEX: 'Unissex',
}

/** Dica da Loja no Hoje: no máximo 1 vez a cada 3 dias por pessoa (fica no navegador). */
const TRES_DIAS = 3 * 24 * 60 * 60 * 1000
export function podeMostrarDica(clienteId: string) {
  try {
    const ultima = Number(localStorage.getItem(`odri-dica-${clienteId}`) ?? 0)
    return Date.now() - ultima > TRES_DIAS
  } catch {
    return false
  }
}
export function marcarDicaMostrada(clienteId: string) {
  try {
    localStorage.setItem(`odri-dica-${clienteId}`, String(Date.now()))
  } catch {
    // sem localStorage: só não guarda
  }
}

export const NOME_FAIXA: Record<FaixaPreco, { nivel: string; preco: string }> = {
  ATE_150: { nivel: 'Barato', preco: 'até R$150' },
  DE_150_A_400: { nivel: 'Médio', preco: 'R$150 a R$400' },
  ACIMA_400: { nivel: 'Caro', preco: 'acima de R$400' },
}

export const NOME_LOJA: Record<LojaParceira, string> = {
  AMAZON: 'na Amazon',
  MERCADO_LIVRE: 'no Mercado Livre',
}

/** 1, 2 ou 3 "cifras" na vitrine. */
export const ORDEM_FAIXA: Record<FaixaPreco, number> = { ATE_150: 1, DE_150_A_400: 2, ACIMA_400: 3 }
