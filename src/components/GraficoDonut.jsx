import { useState } from 'react'
import { moeda } from '../lib/format.js'

const TAU = Math.PI * 2

/** Ponto na circunferência (0 rad = topo, sentido horário) */
function ponto(cx, cy, raio, angulo) {
  return {
    x: cx + raio * Math.cos(angulo - Math.PI / 2),
    y: cy + raio * Math.sin(angulo - Math.PI / 2),
  }
}

/**
 * Path de um segmento de anel. `deslocamento` empurra a fatia para fora,
 * no sentido do seu próprio meio — é o que dá o efeito de "elevar".
 */
function arco(cx, cy, rInterno, rExterno, anguloIni, anguloFim, deslocamento = 0) {
  const meio = (anguloIni + anguloFim) / 2
  const dx = Math.cos(meio - Math.PI / 2) * deslocamento
  const dy = Math.sin(meio - Math.PI / 2) * deslocamento

  const cxD = cx + dx
  const cyD = cy + dy

  const externoIni = ponto(cxD, cyD, rExterno, anguloIni)
  const externoFim = ponto(cxD, cyD, rExterno, anguloFim)
  const internoFim = ponto(cxD, cyD, rInterno, anguloFim)
  const internoIni = ponto(cxD, cyD, rInterno, anguloIni)

  const maior = anguloFim - anguloIni > Math.PI ? 1 : 0

  return [
    `M ${externoIni.x} ${externoIni.y}`,
    `A ${rExterno} ${rExterno} 0 ${maior} 1 ${externoFim.x} ${externoFim.y}`,
    `L ${internoFim.x} ${internoFim.y}`,
    `A ${rInterno} ${rInterno} 0 ${maior} 0 ${internoIni.x} ${internoIni.y}`,
    'Z',
  ].join(' ')
}

/**
 * `dados`: [{ nome, valor, cor, detalhe?: string[] }]
 * `centro`: { rotulo, valor, estado?: 'positivo' | 'negativo' }
 */
function GraficoDonut({ dados, tamanho = 190, espessura = 30, centro, aoFocar }) {
  const [ativo, setAtivo] = useState(null)

  const positivos = dados.filter((d) => Math.max(0, d.valor) > 0)
  const total = positivos.reduce((acc, d) => acc + d.valor, 0)

  const cx = tamanho / 2
  const cy = tamanho / 2
  const rExterno = tamanho / 2 - 6
  const rInterno = rExterno - espessura

  let acumulado = 0
  const fatias = positivos.map((d) => {
    const proporcao = d.valor / total
    const ini = acumulado * TAU
    const fim = (acumulado + proporcao) * TAU
    acumulado += proporcao
    return { ...d, ini, fim, proporcao }
  })

  const fatiaAtiva = fatias.find((f) => f.nome === ativo)

  const focar = (nome) => {
    setAtivo(nome)
    aoFocar?.(nome)
  }

  return (
    <div className="donut-bloco">
      <div className="donut-svg" style={{ width: tamanho, height: tamanho }}>
        <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
          {/* Anel de fundo: representa o total bruto */}
          <circle
            cx={cx}
            cy={cy}
            r={rExterno - espessura / 2}
            fill="none"
            stroke="var(--superficie-3)"
            strokeWidth={espessura}
          />

          {fatias.map((f) => {
            const destacada = ativo === f.nome
            return (
              <path
                key={f.nome}
                d={arco(cx, cy, rInterno, rExterno, f.ini, f.fim, destacada ? 7 : 0)}
                fill={f.cor}
                className={destacada ? 'fatia destacada' : 'fatia'}
                onMouseEnter={() => focar(f.nome)}
                onMouseLeave={() => focar(null)}
                onFocus={() => focar(f.nome)}
                onBlur={() => focar(null)}
                tabIndex={0}
                role="img"
                aria-label={`${f.nome}: ${moeda(f.valor)}`}
              />
            )
          })}
        </svg>

        <div className="donut-centro">
          {fatiaAtiva ? (
            <>
              <span className="donut-centro-rotulo">{fatiaAtiva.nome}</span>
              <strong className="donut-centro-valor num">{moeda(fatiaAtiva.valor)}</strong>
              <span className="donut-centro-pct num">
                {(fatiaAtiva.proporcao * 100).toFixed(0)}%
              </span>
            </>
          ) : (
            centro && (
              <>
                <span className="donut-centro-rotulo">{centro.rotulo}</span>
                <strong className="donut-centro-valor num">{centro.valor}</strong>
                {centro.estado && (
                  <span className={`donut-estado ${centro.estado}`}>
                    {centro.estado === 'positivo' ? 'positivo' : 'negativo'}
                  </span>
                )}
              </>
            )
          )}
        </div>

        {/* Detalhe da fatia (ex: quais funcionários compõem o valor) */}
        {fatiaAtiva?.detalhe?.length > 0 && (
          <div className="donut-detalhe">
            {fatiaAtiva.detalhe.map((linha) => (
              <span key={linha}>{linha}</span>
            ))}
          </div>
        )}
      </div>

      <ul className="donut-legenda">
        {dados.map((d) => {
          const pct = total > 0 ? (Math.max(0, d.valor) / total) * 100 : 0
          return (
            <li
              key={d.nome}
              className={ativo === d.nome ? 'ativo' : undefined}
              onMouseEnter={() => focar(d.nome)}
              onMouseLeave={() => focar(null)}
            >
              <span className="legenda-cor" style={{ background: d.cor }} />
              <span className="legenda-nome">{d.nome}</span>
              <span className="legenda-valor num">{moeda(d.valor)}</span>
              <span className="legenda-pct num">{pct.toFixed(0)}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default GraficoDonut
