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
