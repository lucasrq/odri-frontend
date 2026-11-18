import { api } from './api'
import type { Cliente } from './cadastro'

/** Uma ocasião do Plus (GET /ocasioes). */
export type Ocasiao = { id: number; nome: string }

export function listarOcasioes() {
  return api<Ocasiao[]>('/ocasioes')
}

/** Escolhe (ou tira, com null) a ocasião de hoje. Vale até meia-noite. Só Plus. */
export function escolherOcasiao(ocasiaoId: number | null) {
  return api<Cliente>('/clientes/eu/ocasiao', { method: 'PUT', body: JSON.stringify({ ocasiaoId }) })
}

/** Começa os 14 dias grátis do Plus (uma vez por conta, sem cartão). */
export function comecarTestePlus() {
  return api<Cliente>('/clientes/eu/teste-plus', { method: 'POST' })
}

/** Assinatura do Plus no Mercado Pago (GET /pagamentos/assinatura). */
export type Assinatura = {
  status: 'NENHUMA' | 'PENDENTE' | 'ATIVA' | 'PAUSADA' | 'CANCELADA'
  periodicidade: 'MENSAL' | 'ANUAL' | null
  valor: number | null
  proximaCobranca: string | null
}

export const minhaAssinatura = () => api<Assinatura>('/pagamentos/assinatura')

/** Cria a assinatura e devolve o link do Mercado Pago (a pessoa paga lá e volta pra Conta). */
export const assinarPlus = (periodicidade: 'MENSAL' | 'ANUAL') =>
  api<{ url: string }>('/pagamentos/assinar', { method: 'POST', body: JSON.stringify({ periodicidade }) })

/** Pix avulso do Plus (1 mês ou 1 ano), sem renovação automática. */
export type PixPedido = {
  id: string
  status: 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'ESTORNADO'
  copiaECola: string | null
  qrCode: string | null // PNG em base64
  expiraEm: string | null
  plusAte: string | null
}

export const pagarPix = (periodicidade: 'MENSAL' | 'ANUAL') =>
  api<PixPedido>('/pagamentos/pix', { method: 'POST', body: JSON.stringify({ periodicidade }) })

export const statusPix = (id: string) => api<PixPedido>(`/pagamentos/pix/${encodeURIComponent(id)}`)

export const cancelarAssinatura = () => api<Assinatura>('/pagamentos/cancelar', { method: 'POST' })

/** "02/12" */
export function diaMes(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
}

/** Quantos dias faltam (arredonda pra cima: termina hoje = 1). */
export function diasAte(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}
