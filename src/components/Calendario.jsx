import { useDados } from '../context/DadosContext.jsx'
import { moeda } from '../lib/format.js'
import {
  DIAS_SEMANA_CURTO,
  ehHoje,
  ehMesmoMes,
  gradeDaSemana,
  gradeDoMes,
  toISO,
} from '../lib/dates.js'

/**
 * Quantos itens mostrar por célula.
 * No mês eles aparecem como pontinhos no celular e como etiquetas no desktop.
 */
const LIMITE = { mes: 4, semana: 8 }

function Celula({ data, visualizacao, referencia, aoSelecionar }) {
  const { lavagensDoDia, gastosDoDia, resumoDoDia } = useDados()

  const iso = toISO(data)
  const lavagens = lavagensDoDia(iso)
  const gastos = gastosDoDia(iso)
  const { bruto } = resumoDoDia(iso)

  const itens = [
    ...lavagens.map((l) => ({
      id: l.id,
      nome: l.cliente || l.modelo,
      tipo: 'lavagem',
    })),
    ...gastos.map((g) => ({ id: g.id, nome: g.descricao, tipo: 'gasto' })),
  ]

  const limite = LIMITE[visualizacao]
  const visiveis = itens.slice(0, limite)
  const restantes = itens.length - visiveis.length

  const classes = ['dia']
  if (ehHoje(data)) classes.push('hoje')
  if (visualizacao === 'mes' && !ehMesmoMes(data, referencia)) classes.push('fora-do-mes')

  return (
    <button
      className={classes.join(' ')}
      onClick={() => aoSelecionar(iso)}
      aria-label={`${data.getDate()} — ${lavagens.length} lavagem(ns), ${moeda(bruto)}`}
    >
      {visualizacao === 'semana' ? (
        <div className="dia-topo-semana">
          <span className="dia-semana-rotulo">{DIAS_SEMANA_CURTO[data.getDay()]}</span>
          <span className="dia-numero">{data.getDate()}</span>
        </div>
      ) : (
        <span className="dia-numero">{data.getDate()}</span>
      )}

      <div className="dia-conteudo">
        {visiveis.length > 0 && (
          <div className="dia-pontos">
            {visiveis.map((item) => (
              <span
                key={item.id}
                className={item.tipo === 'gasto' ? 'dia-chip gasto' : 'dia-chip'}
                title={item.nome}
              >
                <span className="chip-nome">{item.nome}</span>
              </span>
            ))}
          </div>
        )}
        {restantes > 0 && <span className="dia-mais">+{restantes}</span>}
      </div>

      {bruto > 0 && <span className="dia-total">{moeda(bruto)}</span>}
    </button>
  )
}

function Calendario({ visualizacao, referencia, aoSelecionarDia }) {
  const dias = visualizacao === 'mes' ? gradeDoMes(referencia) : gradeDaSemana(referencia)

  return (
    <div className="calendario">
      {visualizacao === 'mes' && (
        <div className="calendario-cabecalho">
          {DIAS_SEMANA_CURTO.map((dia) => (
            <span key={dia}>{dia}</span>
          ))}
        </div>
      )}

      <div className={`calendario-grade ${visualizacao}`}>
        {dias.map((data) => (
          <Celula
            key={toISO(data)}
            data={data}
            visualizacao={visualizacao}
            referencia={referencia}
            aoSelecionar={aoSelecionarDia}
          />
        ))}
      </div>
    </div>
  )
}

export default Calendario
