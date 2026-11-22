import { Link } from 'react-router-dom'
import { useTema } from '../lib/useTema'
import { IconeApp, Logo, Lua, Sol } from './Icones'

/** Barra do topo: fica presa no alto ao rolar a página. Logado: só "Abrir o app". */
export default function Topo({ logado = false }: { logado?: boolean }) {
  const { tema, alternar } = useTema()
  const escuro = tema === 'escuro'

  return (
    <header className="topo">
      <div className="topo-dentro">
        <a href="#inicio" aria-label="odri, início" className="topo-logo">
          {/* Ícone âmbar: o mesmo dos vídeos e do poster, pra quem chega das redes reconhecer */}
          <span className="topo-icone"><IconeApp tamanho={30} /></span>
          <Logo />
        </a>
        <nav aria-label="Principal" className="topo-menu">
          <a href="#como-funciona" className="esconde-celular">Como funciona</a>
          <a href="#planos" className="esconde-celular">Planos</a>
          <a href="#duvidas" className="esconde-celular">Dúvidas</a>
          <button
            type="button"
            className="botao-tema"
            onClick={alternar}
            aria-label={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
            aria-pressed={escuro}
          >
            {/* key: o ícone novo entra girando */}
            <span key={tema} className="botao-tema-icone">{escuro ? <Sol /> : <Lua />}</span>
          </button>
          {logado ? (
            <Link to="/app" className="botao botao-escuro botao-pequeno topo-comecar">
              <span>Abrir<span className="so-tela-larga"> o app</span></span>
            </Link>
          ) : (
            <>
              {/* Fica visível também no celular: quem já tem conta entra direto */}
              <Link to="/entrar" className="topo-entrar">Entrar</Link>
              <Link to="/criar-conta" className="botao botao-escuro botao-pequeno topo-comecar">
                <span>Começar<span className="so-tela-larga"> grátis</span></span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
