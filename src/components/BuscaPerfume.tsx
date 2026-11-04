import { FormEvent, useEffect, useState } from 'react'
import { ErroApi } from '../lib/api'
import {
  adicionarNaColecao, buscarPerfumes, ItemColecao,
  mensagemColecao, PerfumeResumo, sugerirPerfume,
} from '../lib/colecao'
import { Check, Mais } from './Icones'

type Props = {
  /** ids que já estão na coleção (aparecem com ✓) */
  naColecao: number[]
  /** chamado depois que o perfume entra na coleção */
  aoAdicionar: (item: ItemColecao) => void
  placeholder?: string
}

/**
 * Busca de perfume + adicionar na coleção.
 * Busca enquanto digita; se não achar, deixa cadastrar um novo (fica "em análise").
 */
export default function BuscaPerfume({ naColecao, aoAdicionar, placeholder }: Props) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<PerfumeResumo[]>([])
  const [buscando, setBuscando] = useState(false)
  const [novo, setNovo] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaMarca, setNovaMarca] = useState('')
  const [erro, setErro] = useState('')

  // Espera 300 ms a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const texto = busca.trim()
    if (texto.length < 2) {
      setResultados([])
      return
    }
    let valido = true
    setBuscando(true)
    const espera = setTimeout(() => {
      buscarPerfumes(texto)
        .then((r) => valido && setResultados(r))
        .catch(() => valido && setResultados([]))
        .finally(() => valido && setBuscando(false))
    }, 300)
    return () => {
      valido = false
      clearTimeout(espera)
    }
  }, [busca])

  async function adicionar(id: number) {
    setErro('')
    try {
      aoAdicionar(await adicionarNaColecao(id))
      return true
    } catch (e) {
      if (e instanceof ErroApi && e.status === 409) return true // já estava
      setErro(mensagemColecao(e))
      return false
    }
  }

  async function adicionarNovo(e: FormEvent) {
    e.preventDefault()
    if (novoNome.trim().length < 2 || novaMarca.trim().length < 2) return setErro('Escreva o nome e a marca.')
    setErro('')
    try {
      const perfume = await sugerirPerfume(novoNome.trim(), novaMarca.trim())
      if (await adicionar(perfume.id)) {
        setNovo(false)
        setNovoNome('')
        setNovaMarca('')
        setBusca('')
      }
    } catch (e) {
      setErro(mensagemColecao(e))
    }
  }

  return (
    <div className="busca-perfume">
      {!novo ? (
        <>
          <label className="campo">
            <span className="so-leitor">Buscar perfume</span>
            <input
              type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder={placeholder ?? 'Busque: Sauvage, Kaiak…'} autoComplete="off"
            />
          </label>

          {busca.trim().length >= 2 && (
            <ul className="lista-busca" aria-live="polite">
              {resultados.map((p) => {
                const tem = naColecao.includes(p.id)
                return (
                  <li key={p.id}>
                    <button type="button" className="item-busca" onClick={() => adicionar(p.id)} disabled={tem}>
                      <span><strong>{p.nome}</strong> <span className="apagado">{p.marca}</span></span>
                      {tem ? <Check tamanho={18} /> : <Mais tamanho={18} />}
                    </button>
                  </li>
                )
              })}
              {!buscando && (
                <li>
                  <button
                    type="button" className="item-busca item-novo"
                    onClick={() => { setNovo(true); setNovoNome(busca.trim()) }}
                  >
                    <span>Não achou? <strong>Adicionar “{busca.trim()}”</strong></span>
                    <Mais tamanho={18} />
                  </button>
                </li>
              )}
            </ul>
          )}
        </>
      ) : (
        <form className="novo-perfume" onSubmit={adicionarNovo}>
          <p className="texto-2">A gente classifica o perfume e ele entra nas sugestões em breve.</p>
          <label className="campo">
            <span>Nome do perfume</span>
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Sauvage" />
          </label>
          <label className="campo">
            <span>Marca</span>
            <input value={novaMarca} onChange={(e) => setNovaMarca(e.target.value)} placeholder="Ex.: Dior" />
          </label>
          <div className="linha-botoes">
            <button type="button" className="botao botao-contorno botao-campo" onClick={() => setNovo(false)}>Voltar</button>
            <button type="submit" className="botao botao-escuro botao-campo">Adicionar</button>
          </div>
        </form>
      )}

      {erro && <p className="conta-erro" role="alert">{erro}</p>}
    </div>
  )
}
