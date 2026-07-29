import { useState } from 'react'
import { paraNumero } from '../lib/format.js'
import { competenciaDe, hojeISO } from '../lib/dates.js'

/**
 * Um gasto é de um dos dois tipos:
 *  - diário: cai num dia específico (produto, cera avulsa)
 *  - mensal: custo fixo da competência (salário, aluguel)
 */
function FormGasto({
  inicial,
  dataPadrao,
  aoSalvar,
  aoCancelar,
  permitirTrocarTipo = true,
  compacto = false,
  categoria = 'geral',
  rotuloDescricao = 'Descrição',
  placeholderDescricao,
  textoBotao,
}) {
  const base = dataPadrao ?? hojeISO()

  const [tipo, setTipo] = useState(inicial?.tipo ?? 'diario')
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [valor, setValor] = useState(inicial ? String(inicial.valor) : '')
  const [data, setData] = useState(inicial?.data ?? base)
  const [competencia, setCompetencia] = useState(inicial?.competencia ?? competenciaDe(base))
  const [erro, setErro] = useState('')

  const limpar = () => {
    setDescricao('')
    setValor('')
    setErro('')
  }

  const enviar = (e) => {
    e.preventDefault()

    if (!descricao.trim()) return setErro('Informe a descrição do gasto.')

    const numero = paraNumero(valor)
    if (Number.isNaN(numero)) return setErro('Valor inválido. Use apenas números.')
    if (numero < 0) return setErro('O valor não pode ser negativo.')

    if (tipo === 'diario' && !data) return setErro('Escolha a data do gasto.')
    if (tipo === 'mensal' && !competencia) return setErro('Escolha o mês de referência.')

    const base = { tipo, categoria, descricao: descricao.trim(), valor: numero }

    aoSalvar(tipo === 'diario' ? { ...base, data } : { ...base, competencia })

    if (!inicial) limpar()
  }

  return (
    <form onSubmit={enviar} className={compacto ? 'form compacto' : 'form'}>
      {permitirTrocarTipo && (
        <div className="tipo-gasto">
          <button
            type="button"
            className={tipo === 'diario' ? 'tipo-opcao ativo' : 'tipo-opcao'}
            onClick={() => setTipo('diario')}
          >
            <strong>Gasto do dia</strong>
            <span>Produto, cera, avulso</span>
          </button>
          <button
            type="button"
            className={tipo === 'mensal' ? 'tipo-opcao ativo' : 'tipo-opcao'}
            onClick={() => setTipo('mensal')}
          >
            <strong>Custo fixo do mês</strong>
            <span>Salário, aluguel, luz</span>
          </button>
        </div>
      )}

      <div className="campo">
        <label htmlFor={`descricao-${categoria}`}>{rotuloDescricao}</label>
        <input
          id={`descricao-${categoria}`}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder={
            placeholderDescricao ??
            (tipo === 'diario' ? 'Cera, shampoo, almoço' : 'Salário, aluguel')
          }
          autoComplete="off"
        />
      </div>

      <div className="campo-linha">
        <div className="campo">
          <label htmlFor="valor-gasto">Valor</label>
          <input
            id="valor-gasto"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
          />
        </div>

        {tipo === 'diario' ? (
          <div className="campo">
            <label htmlFor="data-gasto">Data</label>
            <input
              id="data-gasto"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        ) : (
          <div className="campo">
            <label htmlFor="competencia-gasto">Mês</label>
            <input
              id="competencia-gasto"
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
            />
          </div>
        )}
      </div>

      {erro && <p className="campo-erro">{erro}</p>}

      <div className="form-acoes">
        {aoCancelar && (
          <button type="button" className="btn btn-fantasma" onClick={aoCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primario">
          {inicial ? 'Salvar alterações' : (textoBotao ?? 'Registrar gasto')}
        </button>
      </div>
    </form>
  )
}

export default FormGasto
