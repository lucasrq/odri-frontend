import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ErroApi } from '../lib/api'
import { CAPITAIS } from '../lib/cidades'
import { ItemColecao, listarColecao, mensagemColecao, tirarDaColecao } from '../lib/colecao'
import { supabase } from '../lib/supabase'
import { marcarComecou } from '../lib/cadastro'
import BuscaPerfume from '../components/BuscaPerfume'
import { Fechar, Local, Logo, Seta } from '../components/Icones'

/**
 * Primeira vez no app, em 2 etapas:
 * 1) onde a pessoa está (localização do celular OU uma capital fixa)
 * 2) quais perfumes ela tem (pelo menos 1)
 * Também é usada para trocar a cidade depois (menu da conta).
 */
export default function Comecar() {
  const navegar = useNavigate()
  const [etapa, setEtapa] = useState<1 | 2>(1)

  // Sem login, volta para Entrar. Com login: marca que já passou por aqui.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return navegar('/entrar', { replace: true })
      marcarComecou(data.session.user.id)
    })
  }, [navegar])

  return (
    <main className="conta">
      <Logo largura={88} />
      <div className="conta-cartao" key={etapa}>
        <p className="sobretitulo"><span className="bolinha" />Etapa {etapa} de 2</p>
        {etapa === 1
          ? <EtapaLocal aoTerminar={() => setEtapa(2)} />
          : <EtapaPerfumes aoTerminar={() => navegar('/app', { replace: true })} />}
      </div>
    </main>
  )
}

/* ---------- Etapa 1: onde você está ---------- */

function EtapaLocal({ aoTerminar }: { aoTerminar: () => void }) {
  const [cidade, setCidade] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  // Automático: o celular manda a localização na hora da sugestão (nada fixo no banco)
  function usarLocalizacao() {
    setErro('')
    if (!('geolocation' in navigator)) return setErro('Seu navegador não tem localização. Escolha uma cidade.')
    setOcupado(true)
    navigator.geolocation.getCurrentPosition(
      async () => {
        try {
          await api('/clientes/eu/cidade', { method: 'DELETE' })
          aoTerminar()
        } catch {
          setOcupado(false)
          setErro('Sem conexão com a odri. Tente de novo.')
        }
      },
      () => {
        setOcupado(false)
        setErro('Não deu para pegar sua localização. Escolha uma cidade aqui embaixo.')
      },
      { timeout: 10000, maximumAge: 60 * 60 * 1000 },
    )
  }

  async function fixarCidade(e: FormEvent) {
    e.preventDefault()
    const escolhida = CAPITAIS.find((c) => c.nome === cidade)
    if (!escolhida) return setErro('Escolha uma cidade.')
    setErro('')
    setOcupado(true)
    try {
      await api('/clientes/eu/cidade', { method: 'PUT', body: JSON.stringify(escolhida) })
      aoTerminar()
    } catch (e) {
      setOcupado(false)
      setErro(e instanceof ErroApi && e.status === 0 ? 'Sem conexão com a odri. Tente de novo.' : 'Não deu para salvar a cidade.')
    }
  }

  return (
    <>
      <div className="conta-cabeca">
        <h1>Onde você <span className="serif destaque">está?</span></h1>
        <p className="texto-2">A sugestão depende do clima de hoje na sua cidade.</p>
      </div>

      <button type="button" className="botao botao-destaque botao-largo" onClick={usarLocalizacao} disabled={ocupado}>
        <Local tamanho={18} /> Usar minha localização
      </button>

      <p className="divisor"><span>ou escolha uma cidade</span></p>

      <form className="linha-campo" onSubmit={fixarCidade}>
        <label className="campo">
          <span className="so-leitor">Cidade</span>
          <select value={cidade} onChange={(e) => setCidade(e.target.value)}>
            <option value="">Escolha a capital</option>
            {CAPITAIS.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
          </select>
        </label>
        <button type="submit" className="botao botao-escuro botao-campo" disabled={ocupado || !cidade}>
          Usar
        </button>
      </form>

      {erro && <p className="conta-erro" role="alert">{erro}</p>}
      <p className="conta-dica">Dá para trocar depois, na sua conta.</p>
    </>
  )
}

/* ---------- Etapa 2: seus perfumes ---------- */

function EtapaPerfumes({ aoTerminar }: { aoTerminar: () => void }) {
  const [colecao, setColecao] = useState<ItemColecao[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarColecao().then(setColecao).catch(() => {})
  }, [])

  async function tirar(id: number) {
    setErro('')
    try {
      await tirarDaColecao(id)
      setColecao((c) => c.filter((p) => p.id !== id))
    } catch (e) {
      setErro(mensagemColecao(e))
    }
  }

  return (
    <>
      <div className="conta-cabeca">
        <h1>Quais perfumes você <span className="serif destaque">tem?</span></h1>
        <p className="texto-2">Adicione pelo menos 1. Só o nome já basta.</p>
      </div>

      {colecao.length > 0 && (
        <ul className="lista-colecao" aria-label="Sua coleção">
          {colecao.map((p) => (
            <li key={p.id} className="item-colecao">
              <span>
                <strong>{p.nome}</strong> <span className="apagado">{p.marca}</span>
                {p.pendente && <span className="selo">em análise</span>}
              </span>
              <button type="button" className="item-acao" onClick={() => tirar(p.id)} aria-label={`Tirar ${p.nome}`}>
                <Fechar tamanho={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <BuscaPerfume
        naColecao={colecao.map((p) => p.id)}
        aoAdicionar={(item) => setColecao((c) => [...c, item])}
        placeholder="Busque: Sauvage, Club de Nuit…"
      />

      {erro && <p className="conta-erro" role="alert">{erro}</p>}

      <button
        type="button" className="botao botao-destaque botao-largo"
        onClick={aoTerminar} disabled={colecao.length === 0}
      >
        {colecao.length === 0 ? 'Adicione 1 perfume' : <>Ver meu perfume de hoje <Seta /></>}
      </button>
    </>
  )
}
