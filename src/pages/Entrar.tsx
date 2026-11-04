import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { garantirCadastro } from '../lib/cadastro'
import { ErroApi } from '../lib/api'
import { Logo, Seta } from '../components/Icones'

/**
 * Tela "Entrar".
 * Também é para onde o link de confirmação do e-mail leva: nesse caso a
 * pessoa já chega logada e vai direto para o app.
 */
export default function Entrar() {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [naoConfirmado, setNaoConfirmado] = useState(false)

  // Depois do login: garante o cadastro no back-end e abre o app
  async function seguirParaOApp() {
    try {
      await garantirCadastro()
      navegar('/app', { replace: true })
    } catch (e) {
      setEnviando(false)
      setErro(
        e instanceof ErroApi && e.status === 0
          ? 'Não conseguimos falar com a odri agora. Tente de novo em instantes.'
          : 'Você entrou, mas não deu para carregar sua conta. Tente de novo.',
      )
    }
  }

  // Chegou pelo link do e-mail (ou já estava logado)?
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('error_code') === 'otp_expired') {
      setErro('Esse link expirou ou já foi usado. Entre com e-mail e senha.')
      window.history.replaceState(null, '', '/entrar')
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        if (hash.get('type') === 'signup') setAviso('E-mail confirmado! Abrindo sua conta…')
        setEnviando(true)
        seguirParaOApp()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setNaoConfirmado(false)

    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) {
      setEnviando(false)
      const m = error.message.toLowerCase()
      if (m.includes('not confirmed')) {
        setNaoConfirmado(true)
        return setErro('Falta confirmar seu e-mail. Abra o link que mandamos.')
      }
      if (m.includes('invalid login')) return setErro('E-mail ou senha errados.')
      if (m.includes('rate limit')) return setErro('Muitas tentativas seguidas. Espere alguns minutos.')
      return setErro('Não deu para entrar agora. Tente de novo em instantes.')
    }
    await seguirParaOApp()
  }

  async function reenviar() {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/entrar` },
    })
    setErro('')
    setNaoConfirmado(false)
    if (error) setErro('Não deu para reenviar agora. Espere alguns minutos.')
    else setAviso('Mandamos o link de novo. Veja também o spam.')
  }

  return (
    <main className="conta">
      <Link to="/" className="conta-logo" aria-label="odri, início"><Logo largura={88} /></Link>

      <form className="conta-cartao" onSubmit={entrar} noValidate>
        <div className="conta-cabeca">
          <h1>Bom te <span className="serif destaque">ver.</span></h1>
          <p className="texto-2">Entre para ver qual perfume usar hoje.</p>
        </div>

        <label className="campo">
          <span>E-mail</span>
          <input
            type="email" autoComplete="email" inputMode="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </label>

        <label className="campo">
          <span>Senha</span>
          <div className="campo-senha">
            <input
              type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" required
              value={senha} onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button" className="campo-mostrar"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              aria-pressed={mostrarSenha}
            >
              {mostrarSenha ? 'Esconder' : 'Mostrar'}
            </button>
          </div>
        </label>

        {aviso && <p className="conta-aviso" role="status">{aviso}</p>}
        {erro && (
          <p className="conta-erro" role="alert">
            {erro}
            {naoConfirmado && (
              <> <button type="button" className="conta-link" onClick={reenviar}>Reenviar e-mail</button></>
            )}
          </p>
        )}

        <button type="submit" className="botao botao-destaque botao-largo" disabled={enviando}>
          {enviando ? 'Entrando…' : <>Entrar <Seta /></>}
        </button>

        <p className="conta-rodape">
          Ainda não tem conta? <Link to="/criar-conta">Criar conta grátis</Link>
        </p>
      </form>
    </main>
  )
}
