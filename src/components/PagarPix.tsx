import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { garantirCadastro, Cliente } from '../lib/cadastro'
import { diaMes, PixPedido, pagarPix, statusPix } from '../lib/plus'
import { Check } from './Icones'

type Etapa = 'escolher' | 'gerando' | 'qr' | 'pago' | 'expirou' | 'erro'

/**
 * Plus no Pix (sem cartão): 1 mês R$ 9,90 ou 1 ano R$ 59,90.
 * Mostra o QR Code + "copia e cola" e pergunta pro servidor a cada 4 s se já caiu.
 * Não renova sozinho: perto de acabar chega um e-mail pra renovar.
 */
export default function PagarPix({ aoMudarCliente, aoFechar }: {
  aoMudarCliente: (c: Cliente) => void
  aoFechar: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [pix, setPix] = useState<PixPedido | null>(null)
  const [plusAte, setPlusAte] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const vigia = useRef<number | null>(null)

  // Pergunta "já caiu?" enquanto o QR Code está na tela
  useEffect(() => {
    if (etapa !== 'qr' || !pix) return
    const conferir = async () => {
      try {
        const s = await statusPix(pix.id)
        if (s.status === 'APROVADO') {
          setPlusAte(s.plusAte)
          setEtapa('pago')
          const c = await garantirCadastro().catch(() => null)
          if (c) aoMudarCliente(c)
        } else if (s.status === 'RECUSADO') {
          setEtapa('expirou')
        } else if (pix.expiraEm && Date.now() > new Date(pix.expiraEm).getTime()) {
          setEtapa('expirou')
        }
      } catch { /* sem internet agora: tenta de novo na próxima volta */ }
    }
    vigia.current = window.setInterval(conferir, 4000)
    return () => { if (vigia.current) window.clearInterval(vigia.current) }
  }, [etapa, pix, aoMudarCliente])

  async function gerar(periodicidade: 'MENSAL' | 'ANUAL') {
    setEtapa('gerando')
    setCopiado(false)
    try {
      setPix(await pagarPix(periodicidade))
      setEtapa('qr')
    } catch {
      setEtapa('erro')
    }
  }

  async function copiar() {
    if (!pix?.copiaECola) return
    try {
      await navigator.clipboard.writeText(pix.copiaECola)
      setCopiado(true)
    } catch { /* navegador sem permissão: a pessoa copia segurando o texto */ }
  }

  if (!aberto) {
    return (
      <button type="button" className="plus-pix-abrir" onClick={() => setAberto(true)}>
        Sem cartão? <strong>Pagar no Pix</strong>
      </button>
    )
  }

  return (
    <div className="plus-pix">
      {(etapa === 'escolher' || etapa === 'gerando' || etapa === 'erro') && (
        <>
          <p className="plus-pix-titulo">Pagar no Pix</p>
          <p className="nota">Não renova sozinho: perto de acabar, a gente te manda um e-mail pra renovar.</p>
          <div className="plus-pix-opcoes">
            <button type="button" className="botao botao-escuro botao-largo" disabled={etapa === 'gerando'} onClick={() => gerar('MENSAL')}>
              1 mês · R$ 9,90
            </button>
            <button type="button" className="botao botao-contorno botao-largo" disabled={etapa === 'gerando'} onClick={() => gerar('ANUAL')}>
              1 ano · R$ 59,90
            </button>
          </div>
          {etapa === 'gerando' && <p className="nota">Gerando o Pix…</p>}
          {etapa === 'erro' && <p className="conta-erro" role="alert">Não deu para gerar o Pix agora. Tente de novo em instantes.</p>}
        </>
      )}

      {etapa === 'qr' && pix && (
        <>
          <p className="plus-pix-titulo">Escaneie no app do seu banco</p>
          {pix.qrCode && (
            <img className="plus-pix-qr" src={`data:image/png;base64,${pix.qrCode}`} alt="QR Code do Pix" width={220} height={220} />
          )}
          <button type="button" className="botao botao-destaque botao-largo" onClick={copiar}>
            {copiado ? <><Check tamanho={18} /> Código copiado</> : 'Copiar código Pix (copia e cola)'}
          </button>
          <p className="plus-pix-esperando" aria-live="polite">
            <span className="plus-pix-bolinha" aria-hidden="true" /> Esperando o pagamento… o Plus libera sozinho quando cair.
          </p>
          <p className="nota">O código vale 30 minutos.</p>
        </>
      )}

      {etapa === 'pago' && (
        <>
          <p className="plus-pix-titulo"><Check tamanho={20} /> Pix recebido!</p>
          <p className="texto-2">Seu Plus vale até <strong>{plusAte ? diaMes(plusAte) : '…'}</strong>. Valeu por apoiar a odri.</p>
          <button type="button" className="botao botao-destaque botao-largo" onClick={aoFechar}>Voltar pro app</button>
        </>
      )}

      {etapa === 'expirou' && (
        <>
          <p className="plus-pix-titulo">Esse código expirou</p>
          <p className="nota">Nada foi cobrado. É só gerar outro.</p>
          <button type="button" className="botao botao-escuro botao-largo" onClick={() => setEtapa('escolher')}>Gerar outro Pix</button>
        </>
      )}

      <p className="nota plus-sem-cartao">Ao pagar, você aceita os <Link to="/termos" onClick={aoFechar}>Termos</Link>.</p>
    </div>
  )
}
