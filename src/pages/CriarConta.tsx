import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo, Seta } from '../components/Icones'
import { Preferencia, PREFERENCIAS } from '../lib/cadastro'

const SENHA_MINIMA = 8

/**
 * Tela "Criar conta".
 * Quem cria a conta é o Supabase Auth (a "portaria"). O nome e o aceite da LGPD
 * vão junto, guardados na conta; depois que a pessoa confirmar o e-mail, o app
 * usa esses dados para chamar POST /clientes no nosso back-end.
 */
export default function CriarConta() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [preferencia, setPreferencia] = useState<Preferencia | ''>('')
  const [aceitou, setAceitou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [enviadoPara, setEnviadoPara] = useState('')

  async function criar(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (nome.trim().length < 2) return setErro('Escreva seu nome.')
    if (!preferencia) return setErro('Escolha que perfume você usa.')
    if (senha.length < SENHA_MINIMA) return setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
    if (!aceitou) return setErro('Para criar a conta, aceite a Política de Privacidade.')

    setEnviando(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        // O link do e-mail de confirmação traz a pessoa de volta pra cá
        emailRedirectTo: `${window.location.origin}/entrar`,
        data: { nome: nome.trim(), aceitou_termos: true, preferencia },
      },
    })
    setEnviando(false)

    if (error) return setErro(traduzirErro(error.message))

    // E-mail que já tem conta: o Supabase não avisa com erro (pra não revelar quem é cliente),
    // mas devolve a conta sem nenhuma "identidade".
    if (data.user && data.user.identities?.length === 0) {
      return setErro('Esse e-mail já tem conta na odri. Entre com ele.')
    }

    setEnviadoPara(email.trim())
  }

  if (enviadoPara) {
    return (
      <main className="conta">
        <Link to="/" className="conta-logo" aria-label="odri, início"><Logo largura={88} /></Link>
        <div className="conta-cartao conta-enviado">
          <p className="sobretitulo"><span className="bolinha" />Quase lá</p>
          <h1>Confirme seu <span className="serif destaque">e-mail.</span></h1>
          <p className="texto-2">
            Mandamos um link para <strong>{enviadoPara}</strong>. Abra o e-mail e toque no link para ativar sua conta.
          </p>
          <p className="conta-dica">Não chegou em 2 minutos? Veja a caixa de spam ou promoções.</p>
          <button type="button" className="botao botao-contorno botao-largo" onClick={() => setEnviadoPara('')}>
            Usar outro e-mail
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="conta">
      <Link to="/" className="conta-logo" aria-label="odri, início"><Logo largura={88} /></Link>

      <form className="conta-cartao" onSubmit={criar} noValidate>
        <div className="conta-cabeca">
          <h1>Crie sua <span className="serif destaque">conta.</span></h1>
          <p className="texto-2">É grátis. Em 1 minuto você descobre qual perfume usar hoje.</p>
        </div>

        <label className="campo">
          <span>Nome</span>
          <input
            type="text" autoComplete="given-name" required
            value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Como quer ser chamado"
          />
        </label>

        <fieldset className="campo escolha-preferencia">
          <legend>Que perfume você usa?</legend>
          <div className="colecao-filtros">
            {PREFERENCIAS.map(([valor, nome]) => (
              <button
                key={valor} type="button" className="colecao-filtro"
                aria-pressed={preferencia === valor} onClick={() => setPreferencia(valor)}
              >
                {nome}
              </button>
            ))}
          </div>
        </fieldset>

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
              type={mostrarSenha ? 'text' : 'password'} autoComplete="new-password" required
              minLength={SENHA_MINIMA}
              value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
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

        <label className="conta-aceite">
          <input type="checkbox" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} />
          <span>
            Li e aceito a <Link to="/privacidade" target="_blank">Política de Privacidade</Link> da odri.
          </span>
        </label>

        {erro && <p className="conta-erro" role="alert">{erro}</p>}

        <button type="submit" className="botao botao-destaque botao-largo" disabled={enviando}>
          {enviando ? 'Criando…' : <>Criar conta grátis <Seta /></>}
        </button>

        <p className="conta-rodape">
          Já tem conta? <Link to="/entrar">Entrar</Link>
        </p>
      </form>
    </main>
  )
}

/** Mensagens do Supabase vêm em inglês: aqui viram português. */
function traduzirErro(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes('rate limit') || m.includes('security purposes')) {
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  }
  if (m.includes('invalid') && m.includes('email')) return 'Esse e-mail não parece válido.'
  if (m.includes('password')) return 'Essa senha é fraca. Use letras e números.'
  if (m.includes('already registered')) return 'Esse e-mail já tem conta na odri. Entre com ele.'
  return 'Não deu para criar a conta agora. Tente de novo em instantes.'
}
