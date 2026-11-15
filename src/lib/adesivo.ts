/**
 * Adesivos do story, desenhados aqui no celular (canvas), sem servidor.
 * Adesivo do dia (Selo e Story pronto) e adesivo "Minha coleção".
 * Coleção: branco = pra foto escura, preto = pra foto clara.
 */
export type CorAdesivo = 'branco' | 'preto'

const CORES = {
  branco: { texto: '#FFFFFF', ponto: '#F0A940', sombra: 'rgba(0, 0, 0, 0.32)', desfoque: 16 },
  preto: { texto: '#17191C', ponto: '#C27A1E', sombra: 'rgba(255, 255, 255, 0.45)', desfoque: 12 },
}

const ESCALA = 2 // imagem em dobro: fica nítida no story
const MARGEM = 40
const LARGURA_MAX = 980

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string }

function fonte(ctx: Ctx, peso: number, tamanho: number, espaco = 0) {
  ctx.font = `${peso} ${tamanho}px Figtree, system-ui, sans-serif`
  ctx.letterSpacing = `${espaco}px`
}

/** Logo "odri" desenhado com linhas (mesmo desenho do SVG, 216 x 106). */
function desenharLogo(ctx: Ctx, x: number, y: number, altura: number, cor: string, ponto: string) {
  const s = altura / 106
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.strokeStyle = cor
  ctx.lineWidth = 13
  ctx.lineCap = 'butt'
  const traco = (desenho: () => void) => { ctx.beginPath(); desenho(); ctx.stroke() }
  traco(() => ctx.arc(40, 65, 23.5, 0, Math.PI * 2))
  traco(() => ctx.arc(106, 65, 23.5, 0, Math.PI * 2))
  traco(() => { ctx.moveTo(129.5, 12); ctx.lineTo(129.5, 95) })
  traco(() => { ctx.moveTo(158, 95); ctx.lineTo(158, 65); ctx.arc(181.5, 65, 23.5, Math.PI, Math.PI * 1.5) })
  traco(() => { ctx.moveTo(200, 35); ctx.lineTo(200, 95) })
  ctx.fillStyle = ponto
  ctx.beginPath(); ctx.arc(200, 18, 8, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

/* ---------- Adesivo do dia: Selo e Story pronto (15/11) ---------- */

export type CorSelo = 'creme' | 'preto'
type Periodo = 'MANHA' | 'TARDE' | 'NOITE'

/** O que o adesivo do dia mostra (vem da sugestão de hoje). */
export type DadosDia = {
  perfume: string
  marca?: string | null
  familia?: string | null
  intensidade?: string | null
  temperatura: number | null
  local: string | null
  periodo: Periodo
  tempo?: string
  motivo?: string
}

const NOME_FAM: Record<string, string> = {
  FRESCO: 'Fresco', CITRICO: 'Cítrico', FLORAL: 'Floral', DOCE: 'Doce', AMADEIRADO: 'Amadeirado', ORIENTAL: 'Oriental',
}
const NOME_INT: Record<string, string> = { LEVE: 'Leve', MEDIA: 'Média', FORTE: 'Forte' }
const NIVEL: Record<string, number> = { LEVE: 0.42, MEDIA: 0.64, FORTE: 0.88 }
const POS_PERIODO: Record<Periodo, number> = { MANHA: 0.16, TARDE: 0.5, NOITE: 0.84 }

const TEMA_SELO = {
  creme: { fundo: '#F6EFE4', texto: '#17191C', apagado: '#6B5A45', vidro: 'rgba(255,255,255,0.75)', contorno: 'rgba(23,25,28,0.22)' },
  preto: { fundo: '#17191C', texto: '#EEF0F0', apagado: '#B9B2A6', vidro: 'rgba(255,255,255,0.14)', contorno: 'rgba(255,255,255,0.35)' },
}

function fonteDe(ctx: Ctx, familia: 'Poppins' | 'Figtree', peso: number, tamanho: number, espaco = 0) {
  ctx.font = `${peso} ${tamanho}px ${familia}, Figtree, system-ui, sans-serif`
  ctx.letterSpacing = `${espaco}px`
}

async function carregarFontes() {
  await Promise.all([
    document.fonts.load('800 120px Poppins'),
    document.fonts.load('800 30px Figtree'),
    document.fonts.load('700 34px Figtree'),
    document.fonts.load('600 34px Figtree'),
  ]).catch(() => {})
}

/** O mesmo frasco do componente Frasco (viewBox 100 x 140), em pixels. */
function desenharFrasco(ctx: Ctx, x: number, y: number, largura: number, d: DadosDia, cores: { tampa: string; vidro: string; contorno: string }) {
  const s = largura / 100
  const nivel = NIVEL[d.intensidade ?? ''] ?? 0.6
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = cores.tampa
  ctx.beginPath(); ctx.roundRect(36, 4, 28, 18, 5); ctx.fill()
  ctx.globalAlpha = 0.8
  ctx.beginPath(); ctx.roundRect(42, 22, 16, 12, 2); ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = cores.vidro
  ctx.beginPath(); ctx.roundRect(16, 34, 68, 84, 16); ctx.fill()
  ctx.save()
  ctx.beginPath(); ctx.roundRect(16, 34, 68, 84, 16); ctx.clip()
  ctx.fillStyle = COR_FAMILIA[d.familia ?? ''] ?? '#AEB4BA'
  const topo = 118 - 84 * nivel
  ctx.fillRect(16, topo, 68, 118 - topo)
  ctx.restore()
  ctx.strokeStyle = cores.contorno
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.roundRect(16, 34, 68, 84, 16); ctx.stroke()
  ctx.restore()
}

/** Régua do dia: faixa do amanhecer à noite com a bolinha na hora de agora. */
function desenharRegua(ctx: Ctx, x: number, y: number, largura: number, periodo: Periodo, fundoPonto: string, bordaPonto: string) {
  const g = ctx.createLinearGradient(x, 0, x + largura, 0)
  g.addColorStop(0, '#F3D9A8'); g.addColorStop(0.45, '#D08A2E'); g.addColorStop(0.8, '#5B4A6B'); g.addColorStop(1, '#17191C')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.roundRect(x, y, largura, 12, 6); ctx.fill()
  const px = x + largura * POS_PERIODO[periodo]
  ctx.fillStyle = fundoPonto
  ctx.strokeStyle = bordaPonto
  ctx.lineWidth = 7
  ctx.beginPath(); ctx.arc(px, y + 6, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
}

/** Diminui a fonte até o texto caber na largura. */
function caber(ctx: Ctx, texto: string, familia: 'Poppins' | 'Figtree', peso: number, maximo: number, minimo: number, largura: number) {
  let t = maximo
  fonteDe(ctx, familia, peso, t, -t * 0.04)
  while (t > minimo && ctx.measureText(texto).width > largura) {
    t -= 4
    fonteDe(ctx, familia, peso, t, -t * 0.04)
  }
  return t
}

/** Quebra o texto em linhas que cabem na largura (no máximo "max" linhas). */
function quebrar(ctx: Ctx, texto: string, largura: number, max: number) {
  const linhas: string[] = []
  let atual = ''
  for (const palavra of texto.split(/\s+/)) {
    const teste = atual ? `${atual} ${palavra}` : palavra
    if (ctx.measureText(teste).width > largura && atual) {
      linhas.push(atual)
      atual = palavra
      if (linhas.length === max) break
    } else {
      atual = teste
    }
  }
  if (linhas.length < max && atual) linhas.push(atual)
  if (linhas.length === max && texto.length > linhas.join(' ').length) {
    linhas[max - 1] = linhas[max - 1].replace(/\s*\S*$/, '') + '…'
  }
  return linhas
}

function linhaClima(d: DadosDia) {
  const t = d.temperatura !== null ? `${Math.round(d.temperatura)} °C` : ''
  return { t, local: d.local ?? '' }
}

function emBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error('sem imagem'))), 'image/png'))
}

/**
 * Selo: cartão com fundo próprio (creme ou preto) e cantos transparentes,
 * pra pôr em cima da foto no story.
 */
export async function gerarSelo(d: DadosDia, cor: CorSelo): Promise<Blob> {
  await carregarFontes()
  const tema = TEMA_SELO[cor]
  const W = 840, PAD = 56, BORDA = 24, FRASCO = 104
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as Ctx

  const tamNome = caber(ctx, d.perfume, 'Poppins', 800, 124, 64, W - PAD * 2 - FRASCO - 24)
  const yRotulo = PAD + 30
  const yNome = yRotulo + 26 + tamNome * 0.92
  const yMarca = yNome + 54
  const yRegua = yMarca + 44
  const yPe = yRegua + 12 + 70
  const H = yPe + PAD - 4

  canvas.width = W + BORDA * 2
  canvas.height = H + BORDA * 2
  ctx.translate(BORDA, BORDA)

  // Cartão (sombra leve só pra destacar da foto)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  ctx.fillStyle = tema.fundo
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 64); ctx.fill()
  ctx.restore()

  // "HOJE EU VOU DE" + logo
  ctx.fillStyle = tema.apagado
  fonteDe(ctx, 'Figtree', 800, 28, 3)
  ctx.fillText('HOJE EU VOU DE', PAD, yRotulo)
  desenharLogo(ctx, W - PAD - (216 / 106) * 40, yRotulo - 36, 40, tema.texto, '#D08A2E')

  // Nome
  ctx.fillStyle = tema.texto
  fonteDe(ctx, 'Poppins', 800, tamNome, -tamNome * 0.04)
  ctx.fillText(d.perfume, PAD, yNome)

  // Marca · família · força
  const detalhe = [d.marca, d.familia && NOME_FAM[d.familia], d.intensidade && NOME_INT[d.intensidade]].filter(Boolean).join(' · ')
  ctx.fillStyle = tema.apagado
  fonteDe(ctx, 'Figtree', 600, 32)
  ctx.fillText(quebrar(ctx, detalhe, W - PAD * 2 - FRASCO - 24, 1)[0] ?? '', PAD, yMarca)

  // Frasco
  desenharFrasco(ctx, W - PAD - FRASCO, yMarca - FRASCO * 1.4 + 8, FRASCO, d, { tampa: tema.texto, vidro: tema.vidro, contorno: tema.contorno })

  // Régua
  desenharRegua(ctx, PAD, yRegua, W - PAD * 2, d.periodo, tema.fundo, tema.texto)

  // Rodapé: 24 °C São Paulo ........ @odri.app (odri.app é de outra pessoa)
  const { t, local } = linhaClima(d)
  fonteDe(ctx, 'Figtree', 800, 34)
  ctx.fillStyle = tema.texto
  ctx.fillText(t, PAD, yPe)
  const lt = t ? ctx.measureText(t + '  ').width : 0
  fonteDe(ctx, 'Figtree', 700, 34)
  ctx.fillStyle = tema.apagado
  ctx.fillText(quebrar(ctx, local, W - PAD * 2 - lt - 200, 1)[0] ?? '', PAD + lt, yPe)
  ctx.textAlign = 'right'
  ctx.fillText('@odri.app', W - PAD, yPe)
  ctx.textAlign = 'left'

  return emBlob(canvas)
}

const FUNDO_STORY: Record<Periodo, { cores: string[]; texto: string; apagado: string; cartao: string; cartaoTexto: string; cartaoApagado: string }> = {
  MANHA: { cores: ['#FBF1E1', '#F6DDB8', '#EFC28A'], texto: '#17191C', apagado: '#5E4A30', cartao: '#17191C', cartaoTexto: '#EEF0F0', cartaoApagado: '#B9B2A6' },
  TARDE: { cores: ['#F7E7CF', '#F2C890', '#E39A55', '#C4703A'], texto: '#17191C', apagado: '#5E3A18', cartao: '#17191C', cartaoTexto: '#EEF0F0', cartaoApagado: '#B9B2A6' },
  NOITE: { cores: ['#3A3552', '#22243A', '#121420'], texto: '#EEF0F0', apagado: '#B7B4C8', cartao: '#F6EFE4', cartaoTexto: '#17191C', cartaoApagado: '#6B5A45' },
}
// "Tarde amena.", "Noite fria.", "Manhã quente."
const ADJ_TEMPO: Record<string, string> = { CALOR: 'quente', AMENO: 'amena', FRIO: 'fria' }
const NOME_PER: Record<Periodo, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' }

/**
 * Story pronto (1080 x 1920): fundo na cor da hora do dia, temperatura grande e o cartão do perfume.
 * O conteúdo fica longe das bordas de cima e de baixo, onde o Instagram põe os botões.
 */
export async function gerarStoryPronto(d: DadosDia): Promise<Blob> {
  await carregarFontes()
  const W = 1080, H = 1920, M = 90
  const f = FUNDO_STORY[d.periodo]
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d') as Ctx

  const g = ctx.createLinearGradient(0, 0, 0, H)
  f.cores.forEach((c, i) => g.addColorStop(i / (f.cores.length - 1), c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Topo: logo + "Tarde · São Paulo"
  desenharLogo(ctx, M, 250, 64, f.texto, '#D08A2E')
  ctx.fillStyle = f.texto
  fonteDe(ctx, 'Figtree', 800, 34, 3)
  ctx.textAlign = 'right'
  ctx.fillText([NOME_PER[d.periodo], d.local].filter(Boolean).join(' · ').toUpperCase(), W - M, 302)
  ctx.textAlign = 'left'

  // Temperatura grande
  const { t } = linhaClima(d)
  if (t) {
    fonteDe(ctx, 'Poppins', 800, 300, -18)
    ctx.fillText(`${Math.round(d.temperatura as number)}°`, M - 12, 690)
  }
  fonteDe(ctx, 'Figtree', 700, 54)
  const adj = ADJ_TEMPO[d.tempo ?? '']
  ctx.fillText(adj ? `${NOME_PER[d.periodo]} ${adj}.` : ({ MANHA: 'Bom dia.', TARDE: 'Boa tarde.', NOITE: 'Boa noite.' })[d.periodo], M, t ? 790 : 690)

  // Cartão do perfume
  const cx = M - 10, cw = W - (M - 10) * 2, FRASCO = 132
  fonteDe(ctx, 'Figtree', 500, 40)
  const motivo = quebrar(ctx, d.motivo ?? '', cw - 120, 4)
  const tamNome = caber(ctx, d.perfume, 'Poppins', 800, 128, 64, cw - 120 - FRASCO - 20)
  const yRot = 900 + 60 + 34
  const yNome = yRot + 30 + tamNome * 0.92
  const yMarca = yNome + 58
  const yMotivo = yMarca + 80
  const ch = (yMotivo - 900) + motivo.length * 54 + 40
  ctx.fillStyle = f.cartao
  ctx.beginPath(); ctx.roundRect(cx, 900, cw, ch, 64); ctx.fill()

  ctx.fillStyle = f.cartaoApagado
  fonteDe(ctx, 'Figtree', 800, 32, 3)
  ctx.fillText('HOJE EU VOU DE', cx + 60, yRot)
  ctx.fillStyle = f.cartaoTexto
  fonteDe(ctx, 'Poppins', 800, tamNome, -tamNome * 0.04)
  ctx.fillText(d.perfume, cx + 60, yNome)
  const detalhe = [d.marca, d.familia && NOME_FAM[d.familia], d.intensidade && NOME_INT[d.intensidade]].filter(Boolean).join(' · ')
  ctx.fillStyle = f.cartaoApagado
  fonteDe(ctx, 'Figtree', 600, 38)
  ctx.fillText(quebrar(ctx, detalhe, cw - 120 - FRASCO - 20, 1)[0] ?? '', cx + 60, yMarca)
  const escuro = f.cartao === '#17191C'
  desenharFrasco(ctx, cx + cw - 60 - FRASCO, yMarca - FRASCO * 1.4 + 10, FRASCO, d, {
    tampa: f.cartaoTexto,
    vidro: escuro ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)',
    contorno: escuro ? 'rgba(255,255,255,0.35)' : 'rgba(23,25,28,0.22)',
  })
  ctx.strokeStyle = escuro ? '#3F444B' : '#DCCFBC'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx + 60, yMarca + 34); ctx.lineTo(cx + cw - 60, yMarca + 34); ctx.stroke()
  ctx.fillStyle = escuro ? '#C9CDD1' : '#3A3226'
  fonteDe(ctx, 'Figtree', 500, 40)
  motivo.forEach((l, i) => ctx.fillText(l, cx + 60, yMotivo + i * 54))

  // Rodapé: pergunta + @odri.app
  const yPe = Math.max(900 + ch + 150, 1560)
  ctx.fillStyle = f.texto
  fonteDe(ctx, 'Figtree', 800, 50)
  ctx.fillText('Qual é o seu de hoje?', M, yPe)
  fonteDe(ctx, 'Figtree', 800, 40)
  const largLink = ctx.measureText('@odri.app').width + 64
  ctx.fillStyle = f.texto
  ctx.beginPath(); ctx.roundRect(W - M - largLink, yPe - 54, largLink, 76, 38); ctx.fill()
  ctx.fillStyle = d.periodo === 'NOITE' ? '#17191C' : '#F6EFE4'
  ctx.fillText('@odri.app', W - M - largLink + 32, yPe - 2)

  return emBlob(canvas)
}

/** Baixa direto (no Android vai pra pasta Download e aparece na galeria). */
export function salvarNoAparelho(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/** "Light Blue" -> "odri-light-blue-selo-creme.png" */
export function nomeArquivoDia(perfume: string, tipo: string) {
  const limpo = perfume.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `odri-${limpo || 'perfume'}-${tipo}.png`
}

/** Cor do líquido de cada família (igual ao --fam-* do CSS). */
export const COR_FAMILIA: Record<string, string> = {
  FRESCO: '#6FA8C4', CITRICO: '#E2BC45', FLORAL: '#E098A8', DOCE: '#D99A5B', AMADEIRADO: '#96694A', ORIENTAL: '#8C4459',
}

/**
 * "Minha coleção": um perfume por linha, com o ponto da cor da família, e o odri no fim.
 * Mostra no máximo 8 (o resto vira "+ N").
 */
export async function gerarAdesivoColecao(perfumes: { nome: string; familia: string | null }[], cor: CorAdesivo): Promise<Blob> {
  await Promise.all([
    document.fonts.load('800 64px Figtree'),
    document.fonts.load('800 36px Figtree'),
  ]).catch(() => {})

  const c = CORES[cor]
  const lista = perfumes.slice(0, 8)
  const sobra = perfumes.length - lista.length
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as Ctx

  const T = 64
  const PONTO = 13
  const RECUO = 44
  fonte(ctx, 800, 36)
  const titulo = `Minha coleção · ${perfumes.length}`
  const larguraTitulo = ctx.measureText(titulo).width
  fonte(ctx, 800, T, -T * 0.04)
  const maior = Math.max(0, ...lista.map((p) => ctx.measureText(p.nome).width))
  const tamanho = maior + RECUO > LARGURA_MAX ? Math.max(36, (T * (LARGURA_MAX - RECUO)) / maior) : T
  const passo = tamanho * 1.22
  const largura = Math.max(larguraTitulo, RECUO + maior * (tamanho / T))

  const topo = MARGEM + 36
  const primeira = topo + 26 + tamanho * 0.9
  const ultima = primeira + (lista.length - 1) * passo + (sobra > 0 ? 50 : 0)
  const alturaLogo = 45
  const baseLogo = ultima + 34 + alturaLogo

  canvas.width = Math.ceil((largura + MARGEM * 2) * ESCALA)
  canvas.height = Math.ceil((baseLogo + MARGEM) * ESCALA)
  ctx.scale(ESCALA, ESCALA)
  ctx.shadowColor = c.sombra
  ctx.shadowBlur = c.desfoque
  ctx.shadowOffsetY = 2

  ctx.fillStyle = c.texto
  fonte(ctx, 800, 36)
  ctx.fillText(titulo, MARGEM, topo)

  fonte(ctx, 800, tamanho, -tamanho * 0.04)
  lista.forEach((p, i) => {
    const y = primeira + i * passo
    ctx.fillStyle = COR_FAMILIA[p.familia ?? ''] ?? c.texto
    ctx.beginPath()
    ctx.arc(MARGEM + PONTO, y - tamanho * 0.34, PONTO * (tamanho / T), 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c.texto
    ctx.fillText(p.nome, MARGEM + RECUO, y)
  })
  if (sobra > 0) {
    fonte(ctx, 700, 32)
    ctx.fillText(`+ ${sobra}`, MARGEM + RECUO, ultima)
  }
  desenharLogo(ctx, MARGEM, baseLogo - (88.5 / 106) * alturaLogo, alturaLogo, c.texto, c.ponto)

  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error('sem imagem'))), 'image/png'))
}

/**
 * Celular: abre a janela de compartilhar (tem "Salvar imagem", que vai pra galeria).
 * Computador: baixa o arquivo.
 */
export async function baixarAdesivo(blob: Blob, nomeArquivo: string) {
  const arquivo = new File([blob], nomeArquivo, { type: 'image/png' })
  const celular = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (celular && navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo] })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return // a pessoa fechou a janela
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/** "Light Blue" -> "odri-light-blue-branco.png" */
export function nomeDoArquivo(perfume: string, cor: CorAdesivo) {
  const limpo = perfume.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `odri-${limpo || 'perfume'}-${cor}.png`
}
