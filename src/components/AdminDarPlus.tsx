import { FormEvent, useState } from 'react'
import { ErroApi } from '../lib/api'
import { buscarClienteAdmin, ClienteAdmin, darPlusAdmin } from '../lib/admin'
import { diaMes } from '../lib/plus'

const OPCOES: [number, string][] = [[7, '7 dias'], [30, '30 dias'], [90, '90 dias']]

/**
 * Admin > Dar Plus: acha a pessoa pelo e-mail e dá dias de Plus de presente.
 * Os dias somam com o que ela já tem e não gastam o teste grátis dela.
 */
export default function AdminDarPlus() {
  const [email, setEmail] = useState('')
  const [cliente, setCliente] = useState<ClienteAdmin | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [recado, setRecado] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [confirmarTirar, setConfirmarTirar] = useState(false)

  async function buscar(e: FormEvent) {
    e.preventDefault()
    setRecado(null)
    setCliente(null)
    setConfirmarTirar(false)
    if (!email.includes('@')) return setRecado({ tipo: 'erro', texto: 'Digite o e-mail da conta.' })
    setBuscando(true)
    try {
      setCliente(await buscarClienteAdmin(email.trim()))
    } catch (erro) {
      setRecado({
        tipo: 'erro',
        texto: erro instanceof ErroApi && erro.status === 404
          ? 'Nenhuma conta com esse e-mail (ou a pessoa ainda não terminou o cadastro).'
          : 'Não deu para buscar agora. Tente de novo.',
      })
    } finally {
      setBuscando(false)
    }
  }

  async function dar(dias: number) {
    if (!cliente) return
    setSalvando(true)
    setRecado(null)
    try {
      const novo = await darPlusAdmin(cliente.id, dias)
      setCliente(novo)
      setConfirmarTirar(false)
      setRecado({
        tipo: 'ok',
        texto: dias === 0
          ? `Plus de ${primeiro(novo.nome)} tirado.`
          : `Pronto! Plus de ${primeiro(novo.nome)} até ${novo.plusAte ? diaMes(novo.plusAte) : '…'}.`,
      })
    } catch {
      setRecado({ tipo: 'erro', texto: 'Não deu para salvar agora. Tente de novo.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="admin-dar-plus">
      <p className="painel-dica">
        Presente pra quem ajuda a odri (feedback, parceria, problema na cobrança). Os dias somam com o que a pessoa já tem
        e não gastam o teste grátis dela.
      </p>

      <form className="linha-campo" onSubmit={buscar}>
        <label className="campo">
          <span className="sr-only">E-mail da conta</span>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail da conta" autoComplete="off"
          />
        </label>
        <button type="submit" className="botao botao-escuro botao-campo" disabled={buscando}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {cliente && (
        <div className="admin-plus-cartao">
          <div className="admin-plus-quem">
            <strong>{cliente.nome}</strong>
            <span className="apagado">{cliente.email}</span>
            <span className={cliente.plus ? 'admin-plus-estado admin-plus-ativo' : 'admin-plus-estado'}>
              {cliente.plus && cliente.plusAte ? `Plus até ${diaMes(cliente.plusAte)}` : 'Plano grátis'}
              {!cliente.plus && (cliente.testeUsado ? ' · já usou o teste' : ' · teste ainda não usado')}
            </span>
          </div>

          <div className="colecao-filtros" role="group" aria-label="Quantos dias de Plus dar">
            {OPCOES.map(([dias, rotulo]) => (
              <button key={dias} type="button" className="botao botao-destaque botao-mini" disabled={salvando} onClick={() => dar(dias)}>
                + {rotulo}
              </button>
            ))}
          </div>

          {cliente.plus && (
            confirmarTirar ? (
              <div className="colecao-confirma">
                <span>Tirar o Plus agora?</span>
                <button type="button" className="botao botao-contorno botao-mini" onClick={() => setConfirmarTirar(false)}>Não</button>
                <button type="button" className="botao botao-perigo botao-mini" disabled={salvando} onClick={() => dar(0)}>Sim, tirar</button>
              </div>
            ) : (
              <button type="button" className="colecao-tirar" onClick={() => setConfirmarTirar(true)}>Tirar o Plus</button>
            )
          )}
        </div>
      )}

      {recado && <p className={recado.tipo === 'ok' ? 'conta-aviso' : 'conta-erro'} role="status">{recado.texto}</p>}
    </div>
  )
}

function primeiro(nome: string) {
  return nome.trim().split(/\s+/)[0]
}
