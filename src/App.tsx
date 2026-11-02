import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Inicio from './pages/Inicio'

/**
 * Telas do site. Por enquanto só a página inicial está pronta;
 * as telas do app (criar conta, entrar, /app...) entram no passo 7.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/criar-conta" element={<EmBreve titulo="Criar conta" />} />
      <Route path="/entrar" element={<EmBreve titulo="Entrar" />} />
      <Route path="/privacidade" element={<EmBreve titulo="Política de privacidade" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Provisório: some quando cada tela for criada
function EmBreve({ titulo }: { titulo: string }) {
  return (
    <main className="em-breve">
      <h1>{titulo}</h1>
      <p>Essa tela está sendo construída.</p>
      <Link to="/" className="botao botao-escuro">Voltar ao início</Link>
    </main>
  )
}
