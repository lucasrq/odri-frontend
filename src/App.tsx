import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Inicio from './pages/Inicio'
import { IconeApp } from './components/Icones'

// Telas do app carregam só quando abertas: a página inicial continua leve
// e não depende do Supabase para abrir.
const CriarConta = lazy(() => import('./pages/CriarConta'))
const Entrar = lazy(() => import('./pages/Entrar'))
const Painel = lazy(() => import('./pages/Painel'))
const Comecar = lazy(() => import('./pages/Comecar'))

/**
 * Telas do site. Passo 7 em andamento: criar conta, entrar, começar e painel prontos;
 * privacidade ainda mostra "em breve".
 */
export default function App() {
  return (
    <Suspense fallback={<main className="conta" />}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/criar-conta" element={<CriarConta />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/app" element={<Painel tela="hoje" />} />
        <Route path="/app/colecao" element={<Painel tela="colecao" />} />
        <Route path="/app/loja" element={<Painel tela="loja" />} />
        <Route path="/app/conta" element={<Painel tela="conta" />} />
        <Route path="/app/admin" element={<Painel tela="admin" />} />
        <Route path="/app/comecar" element={<Comecar />} />
        <Route path="/privacidade" element={<EmBreve />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

/**
 * Provisório até o app abrir: em vez de "em construção",
 * convida a pessoa a seguir o Instagram (assim ela não vai embora de mãos vazias).
 */
function EmBreve() {
  return (
    <main className="em-breve">
      <IconeApp tamanho={72} />
      <p className="sobretitulo"><span className="bolinha" />Em breve</p>
      <h1>O app abre <span className="serif destaque">em breve.</span></h1>
      <p className="em-breve-texto">
        Enquanto isso, siga a odri no Instagram: dicas de perfume pro clima de cada dia e o aviso do lançamento em primeira mão.
      </p>
      <div className="em-breve-botoes">
        <a href="https://instagram.com/odri.app" target="_blank" rel="noopener noreferrer" className="botao botao-destaque botao-grande">
          Seguir @odri.app
        </a>
        <Link to="/" className="botao botao-contorno botao-grande">Voltar ao início</Link>
      </div>
    </main>
  )
}
