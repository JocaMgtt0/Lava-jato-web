import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const { entrar, erro } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    await entrar(email.trim(), senha)
    setEnviando(false)
  }

  return (
    <div className="login-tela">
      <form className="login-caixa" onSubmit={enviar}>
        <div className="login-marca">
          <span className="marca-ponto" />
          Garage WM Lava Car
        </div>

        <p className="login-subtitulo">Entre para acessar suas agendas e relatórios</p>

        <div className="campo">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            autoComplete="username"
            autoFocus
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {erro && <p className="campo-erro">{erro}</p>}

        <button type="submit" className="btn btn-primario login-botao" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default Login
