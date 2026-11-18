import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Inicio from './pages/Inicio'

// Telas do app carregam só quando abertas: a página inicial continua leve
// e não depende do Supabase para abrir.
const CriarConta = lazy(() => import('./pages/CriarConta'))
const Entrar = lazy(() => import('./pages/Entrar'))
const Painel = lazy(() => import('./pages/Painel'))
const Comecar = lazy(() => import('./pages/Comecar'))
const Privacidade = lazy(() => import('./pages/Privacidade'))
const Termos = lazy(() => import('./pages/Termos'))

/**
 * Telas do site: início, criar conta, entrar, começar, painel e política de privacidade.
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
        <Route path="/app/loja/:tipo" element={<Painel tela="loja" />} />
        <Route path="/app/conta" element={<Painel tela="conta" />} />
        <Route path="/app/admin" element={<Painel tela="admin" />} />
        <Route path="/app/comecar" element={<Comecar />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
