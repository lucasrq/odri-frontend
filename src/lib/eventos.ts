import { api, BASE } from './api'

export type TipoEvento = 'ADESIVO_DIA' | 'ADESIVO_COLECAO' | 'CLIQUE_LOJA' | 'PLUS_ABRIU' | 'PLUS_TESTE' | 'OCASIAO' | 'VIU_SUGESTAO'

/**
 * Avisa o back que algo aconteceu (só pra contar nos números do Admin).
 * Não espera resposta nem mostra erro: se falhar, a pessoa nem percebe.
 * keepalive: o aviso sai mesmo se a pessoa for embora da página (clique na Loja abre outra aba).
 */
export function registrarEvento(tipo: TipoEvento, extra: { perfumeId?: number; detalhe?: string } = {}) {
  api<void>('/eventos', { method: 'POST', body: JSON.stringify({ tipo, ...extra }), keepalive: true }).catch(() => {})
}

/**
 * De onde a pessoa veio: primeiro o ?utm_source= do link (ex.: link da bio com ?utm_source=instagram),
 * depois o site anterior (referrer). Sem nada = "direto" (digitou o endereço ou app que esconde a origem).
 */
function origemDaVisita(): string {
  // utm_source + utm_medium viram uma etiqueta só: ?utm_source=instagram&utm_medium=bio -> "instagram-bio"
  // (o banco guarda até 20 letras; números e hífen valem, ex.: "instagram-reel18")
  const params = new URLSearchParams(window.location.search)
  const limpar = (s: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const fonte = limpar(params.get('utm_source'))
  if (fonte) {
    const meio = limpar(params.get('utm_medium'))
    return (meio ? `${fonte}-${meio}` : fonte).slice(0, 20)
  }
  let host = ''
  try { host = document.referrer ? new URL(document.referrer).hostname : '' } catch { /* referrer estranho */ }
  if (!host || host === window.location.hostname) return 'direto'
  const conhecidos = ['instagram', 'tiktok', 'google', 'facebook', 'whatsapp', 'youtube', 'bing', 'pinterest', 'linkedin']
  return conhecidos.find((nome) => host.includes(nome)) ?? (host.includes('wa.me') ? 'whatsapp' : 'outro')
}

/** Conta 1 visita por sessão do navegador (abrir de novo outro dia = outra visita). Sem login. */
export function registrarVisita() {
  try {
    if (sessionStorage.getItem('odri-visita')) return
    sessionStorage.setItem('odri-visita', '1')
  } catch { /* navegador sem sessionStorage: conta mesmo assim */ }
  fetch(BASE + '/eventos/visita', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ detalhe: origemDaVisita() }),
    keepalive: true,
  }).catch(() => {})
}

/** Conta que a pessoa viu a sugestão do dia: no máximo 1 vez por dia neste aparelho. */
export function registrarViuSugestao() {
  const hoje = new Date().toLocaleDateString('sv-SE') // AAAA-MM-DD no horário do aparelho
  try {
    if (localStorage.getItem('odri-viu-sugestao') === hoje) return
    localStorage.setItem('odri-viu-sugestao', hoje)
  } catch { /* sem localStorage: conta mesmo assim */ }
  registrarEvento('VIU_SUGESTAO')
}
