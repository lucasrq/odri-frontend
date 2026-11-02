import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Inicio from './pages/Inicio'
import { IconeApp } from './components/Icones'

/**
 * Telas do site. Por enquanto só a página inicial está pronta;
 * as telas do app (criar conta, entrar, /app...) entram no passo 7.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/criar-conta" element={<EmBreve />} />
      <Route path="/entrar" element={<EmBreve />} />
      <Route path="/privacidade" element={<EmBreve />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
