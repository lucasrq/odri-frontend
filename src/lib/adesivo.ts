/**
 * Adesivo do story: "Hoje eu vou de <perfume>." com fundo transparente.
 * A imagem é desenhada aqui no celular (canvas), sem servidor.
 * Branco = pra foto escura. Preto = pra foto clara.
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

export async function gerarAdesivo(perfume: string, linha: string, cor: CorAdesivo): Promise<Blob> {
  await Promise.all([
    document.fonts.load('800 120px Figtree'),
    document.fonts.load('700 32px Figtree'),
  ]).catch(() => {})

  const c = CORES[cor]
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as Ctx

  // Medidas (nome comprido diminui pra caber)
  fonte(ctx, 800, 36)
  const larguraPre = ctx.measureText('Hoje eu vou de').width
  let tamanho = 120
  fonte(ctx, 800, tamanho, -tamanho * 0.045)
  let larguraNome = ctx.measureText(perfume).width
  if (larguraNome + tamanho * 0.3 > LARGURA_MAX) {
    tamanho = Math.max(56, (tamanho * LARGURA_MAX) / (larguraNome + tamanho * 0.3))
    fonte(ctx, 800, tamanho, -tamanho * 0.045)
    larguraNome = ctx.measureText(perfume).width
  }
  const raio = tamanho * 0.1
  fonte(ctx, 700, 32)
  const larguraLinha = linha ? ctx.measureText(linha).width : 0
  const alturaLogo = 45
  const larguraLogo = (216 / 106) * alturaLogo

  const base1 = MARGEM + 36
  const base2 = base1 + 14 + tamanho * 0.86
  const base3 = base2 + 30 + 32
  const largura = MARGEM * 2 + Math.max(larguraPre, larguraNome + raio * 3, larguraLinha + (linha ? 22 : 0) + larguraLogo)
  const altura = base3 + MARGEM

  canvas.width = Math.ceil(largura * ESCALA)
  canvas.height = Math.ceil(altura * ESCALA)
  ctx.scale(ESCALA, ESCALA)
  ctx.shadowColor = c.sombra
  ctx.shadowBlur = c.desfoque
  ctx.shadowOffsetY = 2
  ctx.fillStyle = c.texto
  ctx.textBaseline = 'alphabetic'

  fonte(ctx, 800, 36)
  ctx.fillText('Hoje eu vou de', MARGEM, base1)

  fonte(ctx, 800, tamanho, -tamanho * 0.045)
  ctx.fillText(perfume, MARGEM, base2)
  ctx.fillStyle = c.ponto
  ctx.beginPath()
  ctx.arc(MARGEM + larguraNome + raio * 1.6, base2 - raio, raio, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = c.texto
  fonte(ctx, 700, 32)
  if (linha) ctx.fillText(linha, MARGEM, base3)
  // o "o" do logo fica na mesma linha de base do texto
  const xLogo = MARGEM + larguraLinha + (linha ? 22 : 0)
  desenharLogo(ctx, xLogo, base3 - (88.5 / 106) * alturaLogo, alturaLogo, c.texto, c.ponto)

  return new Promise((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error('sem imagem'))), 'image/png'))
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
