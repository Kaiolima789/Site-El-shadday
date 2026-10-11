import { useState, useEffect } from 'react'
import './AdminCardapio.css'

const PROTEINAS_SUGERIDAS = [
  'Churrasco',
  'Frango Grelhado',
  'Linguiça Artesanal',
  'Frango Cozido'
]

const GUARNICOES_FIXAS = [
  'Arroz',
  'Feijão',
  'Feijão Tropeiro',
  'Macarrão',
  'Leguminosas',
  'Farofa',
  'Salada (Alface e tomate)',
  'Vinagrete',
  'Maionese'
]

function dataHojeISO() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function AdminCardapio({ voltar, pedidos }) {
  const [data, setData] = useState(dataHojeISO())
  const [preco, setPreco] = useState('18.00')

  const [opcoes, setOpcoes] = useState({
    carne: ['Churrasco', 'Frango Grelhado'],
    guarnicao: ['Arroz', 'Feijão', 'Farofa', 'Salada (Alface e tomate)']
  })

  const [novaOpcao, setNovaOpcao] = useState({
    carne: '',
    guarnicao: ''
  })

  const [modoEdicao, setModoEdicao] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    verificarCardapio(dataHojeISO())
  }, [])

  async function verificarCardapio(dataEscolhida) {
    if (!dataEscolhida) return

    try {
      const resposta = await fetch(
        `http://localhost:3000/cardapios/${dataEscolhida}`
      )

      if (resposta.status === 404) {
        setModoEdicao(false)
        setMensagem('Novo cardápio para esta data.')
        return
      }

      if (!resposta.ok) {
        throw new Error('Erro ao consultar cardápio')
      }

      const dados = await resposta.json()
      setModoEdicao(true)
      setMensagem('Cardápio encontrado. Você está editando.')
      setPreco(String(dados.preco || '18.00'))

      const novasOpcoes = {
        carne: [],
        guarnicao: []
      }

      dados.opcoes.forEach((opcao) => {
        if (novasOpcoes[opcao.categoria]) {
          novasOpcoes[opcao.categoria].push(opcao.nome)
        }
      })

      setOpcoes(novasOpcoes)
    } catch (erro) {
      console.error(erro)
      setMensagem('Modo offline / Não foi possível carregar do servidor.')
    }
  }

  async function salvarCardapio() {
    try {
      const opcoesFormatadas = Object.entries(opcoes).flatMap(
        ([categoria, itens]) =>
          itens.map((nome) => ({
            categoria,
            nome
          }))
      )

      const metodo = modoEdicao ? 'PUT' : 'POST'
      const url = modoEdicao
        ? `http://localhost:3000/cardapios/${data}`
        : 'http://localhost:3000/cardapios'

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data,
          preco: Number(preco),
          opcoes: opcoesFormatadas
        })
      })

      const resultado = await resposta.json()

      if (!resposta.ok) {
        alert(resultado.erro || 'Erro ao salvar cardápio')
        return
      }

      alert(
        modoEdicao
          ? 'Cardápio atualizado e publicado com sucesso!'
          : 'Cardápio criado e publicado com sucesso!'
      )

      setModoEdicao(true)
    } catch (erro) {
      console.error(erro)
      alert('Não foi possível conectar com o servidor.')
    }
  }

  function adicionarOpcao(categoria) {
    const nome = novaOpcao[categoria].trim()
    if (!nome) return

    if (opcoes[categoria].includes(nome)) {
      setNovaOpcao({ ...novaOpcao, [categoria]: '' })
      return
    }

    setOpcoes({
      ...opcoes,
      [categoria]: [...opcoes[categoria], nome]
    })

    setNovaOpcao({
      ...novaOpcao,
      [categoria]: ''
    })
  }

  function alternarProteina(nome) {
    setOpcoes((atual) => {
      const jaSelecionada = atual.carne.includes(nome)
      return {
        ...atual,
        carne: jaSelecionada
          ? atual.carne.filter((item) => item !== nome)
          : [...atual.carne, nome]
      }
    })
  }

  function alternarGuarnicao(nome) {
    setOpcoes((atual) => {
      const jaSelecionada = atual.guarnicao.includes(nome)
      return {
        ...atual,
        guarnicao: jaSelecionada
          ? atual.guarnicao.filter((item) => item !== nome)
          : [...atual.guarnicao, nome]
      }
    })
  }

  return (
    <div className="admin-page">

      <header className="admin-header">
        <div className="admin-header-esquerda">
          <h1>EL SHADDAY • PAINEL ADMIN</h1>
        </div>

        <div className="admin-header-direita">
          <label className="admin-status-toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-switch"></span>
            <span className="toggle-texto">Restaurante Aberto</span>
          </label>

          <button onClick={voltar} className="admin-sair-btn">
            Ver site
          </button>
        </div>
      </header>

      <div className="admin-abas-nav">
        <button className="admin-aba-btn admin-aba-ativa">
          Gerenciar Cardápio
        </button>

        <button className="admin-aba-btn" onClick={pedidos}>
          Pedidos Recebidos
        </button>
      </div>

      <main className="admin-content">

        <section className="admin-card">

          <div className="admin-card-cabecalho">
            <h2>Criar Cardápio do Dia</h2>
            <p className="admin-subtitulo">
              Prepare o cardápio que estará disponível para os clientes hoje.
            </p>
          </div>

          <div className="admin-campos-linha">
            <div className="campo">
              <label>Data do Cardápio</label>
              <input
                type="date"
                value={data}
                onChange={(e) => {
                  const novaData = e.target.value
                  setData(novaData)
                  verificarCardapio(novaData)
                }}
              />
            </div>

            <div className="campo">
              <label>Preço da marmita (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="18.00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </div>
          </div>

          {mensagem && <p className="mensagem-admin">{mensagem}</p>}

          <div className="admin-divisor"></div>

          {/* PROTEÍNAS DO DIA */}
          <div className="categoria-admin">
            <h3>Proteínas do Dia</h3>
            <p className="categoria-info">
              Selecione as opções de carne disponíveis para hoje:
            </p>

            <div className="chips-grid">
              {PROTEINAS_SUGERIDAS.map((nome) => {
                const ativa = opcoes.carne.includes(nome)
                return (
                  <button
                    type="button"
                    key={nome}
                    className={`chip-btn ${ativa ? 'chip-btn-ativo' : ''}`}
                    onClick={() => alternarProteina(nome)}
                  >
                    {ativa ? '✓ ' : '+ '}
                    {nome}
                  </button>
                )
              })}
            </div>

            <div className="adicionar-opcao">
              <input
                type="text"
                placeholder="Adicionar carne"
                value={novaOpcao.carne}
                onChange={(e) =>
                  setNovaOpcao({ ...novaOpcao, carne: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && adicionarOpcao('carne')}
              />
              <button
                type="button"
                className="adicionar-btn"
                onClick={() => adicionarOpcao('carne')}
              >
                +
              </button>
            </div>

            {opcoes.carne.filter((c) => !PROTEINAS_SUGERIDAS.includes(c)).length > 0 && (
              <div className="lista-opcoes-extras">
                {opcoes.carne
                  .filter((c) => !PROTEINAS_SUGERIDAS.includes(c))
                  .map((opcao, index) => (
                    <div className="opcao-admin-extra" key={index}>
                      <span>✓ {opcao}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpcoes({
                            ...opcoes,
                            carne: opcoes.carne.filter((item) => item !== opcao)
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="admin-divisor"></div>

          {/* GUARNIÇÕES DO DIA */}
          <div className="categoria-admin">
            <h3>Guarnições do Dia</h3>
            <p className="categoria-info">
              Toque para ativar ou desativar as opções do dia:
            </p>

            <div className="chips-grid">
              {GUARNICOES_FIXAS.map((nome) => {
                const ativa = opcoes.guarnicao.includes(nome)
                return (
                  <button
                    type="button"
                    key={nome}
                    className={`chip-btn ${ativa ? 'chip-btn-ativo' : ''}`}
                    onClick={() => alternarGuarnicao(nome)}
                  >
                    {ativa ? '✓ ' : '+ '}
                    {nome}
                  </button>
                )
              })}
            </div>

            <div className="adicionar-opcao">
              <input
                type="text"
                placeholder="Adicionar outra guarnição"
                value={novaOpcao.guarnicao}
                onChange={(e) =>
                  setNovaOpcao({ ...novaOpcao, guarnicao: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && adicionarOpcao('guarnicao')}
              />
              <button
                type="button"
                className="adicionar-btn"
                onClick={() => adicionarOpcao('guarnicao')}
              >
                +
              </button>
            </div>

            {opcoes.guarnicao.filter((g) => !GUARNICOES_FIXAS.includes(g)).length > 0 && (
              <div className="lista-opcoes-extras">
                {opcoes.guarnicao
                  .filter((g) => !GUARNICOES_FIXAS.includes(g))
                  .map((opcao, index) => (
                    <div className="opcao-admin-extra" key={index}>
                      <span>✓ {opcao}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpcoes({
                            ...opcoes,
                            guarnicao: opcoes.guarnicao.filter((item) => item !== opcao)
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="salvar-cardapio-btn"
            onClick={salvarCardapio}
          >
            SALVAR E PUBLICAR CARDÁPIO →
          </button>

        </section>

      </main>

    </div>
  )
}

export default AdminCardapio