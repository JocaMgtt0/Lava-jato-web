import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendario from '../components/Calendario.jsx'
import { useDados } from '../context/DadosContext.jsx'
import { moeda } from '../lib/format.js'
import {
  competenciaDe,
  gradeDaSemana,
  hojeISO,
  rotuloIntervaloSemana,
  rotuloMesAno,
  somarDias,
  somarMeses,
  toISO,
} from '../lib/dates.js'

function Agenda() {
  const [visualizacao, setVisualizacao] = useState('mes')
  const [referencia, setReferencia] = useState(() => new Date())
  const navegar = useNavigate()

  const { resumoDoMes, lavagensDoDia, gastosDoDia } = useDados()

  const mover = (direcao) =>
    setReferencia((atual) =>
      visualizacao === 'mes' ? somarMeses(atual, direcao) : somarDias(atual, direcao * 7)
    )

  const resumo =
    visualizacao === 'mes'
      ? resumoDoMes(competenciaDe(toISO(referencia)))
      : gradeDaSemana(referencia).reduce(
          (acc, data) => {
            const iso = toISO(data)
            const bruto = lavagensDoDia(iso).reduce((s, l) => s + Number(l.valor || 0), 0)
            const despesas = gastosDoDia(iso).reduce((s, g) => s + Number(g.valor || 0), 0)
            return {
              bruto: acc.bruto + bruto,
              despesas: acc.despesas + despesas,
              liquido: acc.liquido + (bruto - despesas),
            }
          },
          { bruto: 0, despesas: 0, liquido: 0 }
        )

  const rotulo =
    visualizacao === 'mes' ? rotuloMesAno(referencia) : rotuloIntervaloSemana(referencia)

  return (
    <>
      <div className="pagina-topo">
        <div className="pagina-titulo">
          <h1>Calendário</h1>
          <p className="pagina-subtitulo">Toque num dia para lançar lavagens e gastos</p>
        </div>

        <button className="btn btn-primario" onClick={() => navegar(`/dia/${hojeISO()}`)}>
          + Lançar hoje
        </button>
      </div>

      <div className="barra-periodo">
        <div className="segmentado">
          <button
            className={visualizacao === 'mes' ? 'ativo' : ''}
            onClick={() => setVisualizacao('mes')}
          >
            Mês
          </button>
          <button
            className={visualizacao === 'semana' ? 'ativo' : ''}
            onClick={() => setVisualizacao('semana')}
          >
            Semana
          </button>
        </div>

        <div className="navegacao-periodo">
          <button className="btn-icone" onClick={() => mover(-1)} aria-label="Anterior">
            ‹
          </button>
          <span className="periodo-rotulo">{rotulo}</span>
          <button className="btn-icone" onClick={() => mover(1)} aria-label="Próximo">
            ›
          </button>
        </div>

        <button className="btn btn-suave btn-pequeno" onClick={() => setReferencia(new Date())}>
          Hoje
        </button>
      </div>

      <div className="resumo-linha">
        <div className="resumo-item">
          <span>Bruto</span>
          <strong className="num">{moeda(resumo.bruto)}</strong>
        </div>
        <div className="resumo-item">
          <span>Gastos</span>
          <strong className="num negativo">{moeda(resumo.despesas)}</strong>
        </div>
        <div className="resumo-item">
          <span>Líquido</span>
          <strong className={resumo.liquido < 0 ? 'num negativo' : 'num positivo'}>
            {moeda(resumo.liquido)}
          </strong>
        </div>
      </div>

      <Calendario
        visualizacao={visualizacao}
        referencia={referencia}
        aoSelecionarDia={(iso) => navegar(`/dia/${iso}`)}
      />
    </>
  )
}

export default Agenda
