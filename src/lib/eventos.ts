import { api } from './api'

export type TipoEvento = 'ADESIVO_DIA' | 'ADESIVO_COLECAO' | 'CLIQUE_LOJA'

/**
 * Avisa o back que algo aconteceu (só pra contar nos números do Admin).
 * Não espera resposta nem mostra erro: se falhar, a pessoa nem percebe.
 * keepalive: o aviso sai mesmo se a pessoa for embora da página (clique na Loja abre outra aba).
 */
export function registrarEvento(tipo: TipoEvento, extra: { perfumeId?: number; detalhe?: string } = {}) {
  api<void>('/eventos', { method: 'POST', body: JSON.stringify({ tipo, ...extra }), keepalive: true }).catch(() => {})
}
