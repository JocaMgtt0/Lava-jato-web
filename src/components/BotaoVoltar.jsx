import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Volta no histórico quando há para onde voltar; senão cai no calendário.
 * Evita o beco sem saída de abrir o app direto numa rota interna.
 */
function BotaoVoltar({ rotulo = 'Voltar' }) {
  const navegar = useNavigate()
  const { key } = useLocation()

  const voltar = () => {
    if (key !== 'default') navegar(-1)
    else navegar('/')
  }

  return (
    <button className="btn-voltar nao-imprimir" onClick={voltar}>
      <span aria-hidden="true">‹</span>
      <span>{rotulo}</span>
    </button>
  )
}

export default BotaoVoltar
