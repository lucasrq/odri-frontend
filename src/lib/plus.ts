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

/** "02/12" */
export function diaMes(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
}

/** Quantos dias faltam (arredonda pra cima: termina hoje = 1). */
export function diasAte(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}
