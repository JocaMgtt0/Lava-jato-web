import { moeda } from '../lib/format.js'

/**
 * Barras verticais em CSS puro.
 * `dados`: [{ chave, rotulo, valor, destaque? }]
 */
function GraficoBarras({ dados, cor = 'var(--accent)', altura = 130, formatador = moeda }) {
  const maximo = Math.max(...dados.map((d) => Math.abs(d.valor)), 1)
  const temValor = dados.some((d) => d.valor !== 0)

  if (!temValor) {
    return (
      <div className="vazio compacto">
        <p>Sem movimento para exibir.</p>
      </div>
    )
  }

  return (
    <div className="barras" style={{ height: altura }}>
      {dados.map((item) => {
        const proporcao = Math.abs(item.valor) / maximo
        return (
          <div
            className={item.destaque ? 'barra-coluna destaque' : 'barra-coluna'}
            key={item.chave}
            title={`${item.rotulo}: ${formatador(item.valor)}`}
          >
            <div className="barra-trilha">
              <div
                className="barra-preenchida"
                style={{
                  height: `${Math.max(proporcao * 100, item.valor !== 0 ? 3 : 0)}%`,
                  background: item.destaque ? 'var(--accent)' : cor,
                }}
              />
            </div>
            <span className="barra-rotulo">{item.rotulo}</span>
          </div>
        )
      })}
    </div>
  )
}

export default GraficoBarras
