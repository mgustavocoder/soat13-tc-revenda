/**
 * Teste E2E contra a API em execução (http://localhost:3000)
 * Cobre o fluxo completo de negócio:
 *   cadastro → listagem → edição → compra → verificação
 *
 * Uso: node tests/e2e/live-api-test.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000'

// CPFs únicos por execução para evitar conflito com dados anteriores
const RUN = Date.now()
const CPF_MARIA = String(RUN).slice(-11).padStart(11, '1')
const CPF_JOAO  = String(RUN + 1).slice(-11).padStart(11, '2')

const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ${GREEN}✓${RESET} ${label}`)
  passed++
}

function fail(label, detail) {
  console.log(`  ${RED}✗ ${label}${RESET}`)
  if (detail) console.log(`    ${RED}→ ${detail}${RESET}`)
  failed++
}

function section(title) {
  console.log(`\n${CYAN}${BOLD}▸ ${title}${RESET}`)
}

async function req(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  let json
  try { json = await res.json() } catch { json = null }
  return { status: res.status, body: json }
}

function assert(label, condition, detail) {
  if (condition) ok(label)
  else fail(label, detail)
}

// ─── Testes ──────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(`\n${BOLD}E2E – API de Revenda de Veículos${RESET}`)
  console.log(`${YELLOW}Base URL: ${BASE_URL}${RESET}`)

  let veiculoCorollaId, veiculoCivicId, veiculoHRVId

  // ── Health ─────────────────────────────────────────────────────────────────
  section('GET /api/health')
  {
    const r = await req('GET', '/api/health')
    assert('status 200', r.status === 200, `status: ${r.status}`)
    assert('body.status === healthy', r.body?.status === 'healthy', JSON.stringify(r.body))
  }

  // ── Cadastro de clientes ───────────────────────────────────────────────────
  section('Cadastro de clientes')
  {
    const r = await req('POST', '/api/clientes', { nome: 'Maria Silva', cpf: CPF_MARIA, email: `maria${RUN}@email.com` })
    assert('Maria cadastrada (201)', r.status === 201, `status: ${r.status} – ${JSON.stringify(r.body)}`)
    assert('retorna id', typeof r.body?.id === 'number', JSON.stringify(r.body))
  }
  {
    const r = await req('POST', '/api/clientes', { nome: 'João Santos', cpf: CPF_JOAO, email: `joao${RUN}@email.com` })
    assert('João cadastrado (201)', r.status === 201, `status: ${r.status} – ${JSON.stringify(r.body)}`)
  }
  {
    // CPF duplicado
    const r = await req('POST', '/api/clientes', { nome: 'Outro', cpf: CPF_MARIA, email: `outro${RUN}@email.com` })
    assert('rejeita CPF duplicado (409)', r.status === 409, `status: ${r.status}`)
  }
  {
    // CPF inválido
    const r = await req('POST', '/api/clientes', { nome: 'Teste', cpf: '123', email: `t${RUN}@email.com` })
    assert('rejeita CPF inválido (400)', r.status === 400, `status: ${r.status}`)
  }
  {
    // Busca por CPF
    const r = await req('GET', `/api/clientes/${CPF_MARIA}`)
    assert('busca Maria pelo CPF (200)', r.status === 200, `status: ${r.status}`)
    assert('retorna dados corretos', r.body?.nome === 'Maria Silva', JSON.stringify(r.body))
  }
  {
    // CPF inexistente
    const r = await req('GET', '/api/clientes/00000000000')
    assert('CPF inexistente retorna 404', r.status === 404, `status: ${r.status}`)
  }

  // ── Cadastro de veículos ───────────────────────────────────────────────────
  section('Cadastro de veículos')
  {
    const r = await req('POST', '/api/veiculos', { marca: 'Toyota', modelo: 'Corolla', ano: 2022, cor: 'Branco', preco: 85000 })
    assert('Corolla cadastrado (201)', r.status === 201, `status: ${r.status} – ${JSON.stringify(r.body)}`)
    assert('status DISPONIVEL', r.body?.status === 'DISPONIVEL', JSON.stringify(r.body))
    veiculoCorollaId = r.body?.id
  }
  {
    const r = await req('POST', '/api/veiculos', { marca: 'Honda', modelo: 'Civic', ano: 2021, cor: 'Prata', preco: 75000 })
    assert('Civic cadastrado (201)', r.status === 201, `status: ${r.status}`)
    veiculoCivicId = r.body?.id
  }
  {
    const r = await req('POST', '/api/veiculos', { marca: 'Honda', modelo: 'HR-V', ano: 2023, cor: 'Preto', preco: 95000 })
    assert('HR-V cadastrado (201)', r.status === 201, `status: ${r.status}`)
    veiculoHRVId = r.body?.id
  }
  {
    // preço inválido
    const r = await req('POST', '/api/veiculos', { marca: 'Fiat', modelo: 'Uno', ano: 2020, cor: 'Vermelho', preco: -500 })
    assert('rejeita preço negativo (400)', r.status === 400, `status: ${r.status}`)
  }
  {
    // ano inválido
    const r = await req('POST', '/api/veiculos', { marca: 'Ford', modelo: 'T', ano: 1800, cor: 'Preto', preco: 50000 })
    assert('rejeita ano inválido (400)', r.status === 400, `status: ${r.status}`)
  }

  // ── Listagem de veículos disponíveis (ordenada por preço) ──────────────────
  section('GET /api/veiculos/disponiveis – ordenação por preço')
  {
    const r = await req('GET', '/api/veiculos/disponiveis')
    assert('status 200', r.status === 200, `status: ${r.status}`)
    // Filtra apenas os veículos desta execução
    const meus = r.body?.filter(v => [veiculoCorollaId, veiculoCivicId, veiculoHRVId].includes(v.id)) ?? []
    assert('retorna os 3 veículos cadastrados', meus.length === 3, `encontrados: ${meus.length}`)
    const precos = meus.map(v => v.preco)
    const sorted = [...precos].sort((a, b) => a - b)
    assert('lista ordenada do mais barato ao mais caro', JSON.stringify(precos) === JSON.stringify(sorted), `preços: ${precos}`)
    // O mais barato deve ser o Civic (75k)
    const civicIdx = meus.findIndex(v => v.id === veiculoCivicId)
    const corollaIdx = meus.findIndex(v => v.id === veiculoCorollaId)
    assert('Civic (R$75k) vem antes do Corolla (R$85k)', civicIdx < corollaIdx, `civic:${civicIdx} corolla:${corollaIdx}`)
  }

  // ── Edição de veículo ──────────────────────────────────────────────────────
  section('PUT /api/veiculos/:id – edição de dados')
  {
    // Baixa o preço do Corolla para R$70k (mais barato que o Civic)
    const r = await req('PUT', `/api/veiculos/${veiculoCorollaId}`, { preco: 70000 })
    assert('preço do Corolla atualizado (200)', r.status === 200, `status: ${r.status}`)
    assert('novo preço é 70000', r.body?.preco === 70000, `preco: ${r.body?.preco}`)
  }
  {
    // Atualiza cor e modelo do Civic
    const r = await req('PUT', `/api/veiculos/${veiculoCivicId}`, { cor: 'Azul', modelo: 'Civic Type R' })
    assert('cor e modelo do Civic atualizados (200)', r.status === 200, `status: ${r.status}`)
    assert('cor é Azul', r.body?.cor === 'Azul', `cor: ${r.body?.cor}`)
  }
  {
    // Nenhum campo válido
    const r = await req('PUT', `/api/veiculos/${veiculoCorollaId}`, { campoInexistente: 'x' })
    assert('rejeita body sem campos válidos (400)', r.status === 400, `status: ${r.status}`)
  }
  {
    // Veículo inexistente
    const r = await req('PUT', '/api/veiculos/999999', { preco: 1000 })
    assert('veículo inexistente retorna 404', r.status === 404, `status: ${r.status}`)
  }
  {
    // Verifica nova ordenação após atualização de preço
    const r = await req('GET', '/api/veiculos/disponiveis')
    const meus = r.body?.filter(v => [veiculoCorollaId, veiculoCivicId, veiculoHRVId].includes(v.id)) ?? []
    const primeiro = meus[0]
    assert('Corolla (R$70k) agora é o mais barato', primeiro?.id === veiculoCorollaId, `id: ${primeiro?.id}, esperado: ${veiculoCorollaId}`)
  }

  // ── Compra de veículo ──────────────────────────────────────────────────────
  section('POST /api/vendas – compra de veículo')
  {
    // Cliente não cadastrado
    const r = await req('POST', '/api/vendas', { veiculoId: veiculoCorollaId, clienteCpf: '00000000000' })
    assert('rejeita cliente não cadastrado (404)', r.status === 404, `status: ${r.status}`)
  }
  {
    // Veículo inexistente
    const r = await req('POST', '/api/vendas', { veiculoId: 999999, clienteCpf: CPF_MARIA })
    assert('rejeita veículo inexistente (404)', r.status === 404, `status: ${r.status}`)
  }
  {
    // CPF inválido
    const r = await req('POST', '/api/vendas', { veiculoId: veiculoCorollaId, clienteCpf: '123' })
    assert('rejeita CPF inválido (400)', r.status === 400, `status: ${r.status}`)
  }
  {
    // Compra bem-sucedida: Maria compra o Corolla
    const r = await req('POST', '/api/vendas', { veiculoId: veiculoCorollaId, clienteCpf: CPF_MARIA })
    assert('Maria compra o Corolla (201)', r.status === 201, `status: ${r.status} – ${JSON.stringify(r.body)}`)
    assert('venda retorna id', typeof r.body?.id === 'number', JSON.stringify(r.body))
    assert('preço registrado é 70000', r.body?.preco === 70000, `preco: ${r.body?.preco}`)
    assert('veículo da venda está VENDIDO', r.body?.veiculo?.status === 'VENDIDO', JSON.stringify(r.body?.veiculo))
    assert('dados do cliente retornados', r.body?.cliente?.nome === 'Maria Silva', JSON.stringify(r.body?.cliente))
  }
  {
    // Compra duplicada do mesmo veículo
    const r = await req('POST', '/api/vendas', { veiculoId: veiculoCorollaId, clienteCpf: CPF_JOAO })
    assert('rejeita compra de veículo já vendido (422)', r.status === 422, `status: ${r.status}`)
  }
  {
    // Tentativa de editar veículo vendido
    const r = await req('PUT', `/api/veiculos/${veiculoCorollaId}`, { preco: 60000 })
    assert('rejeita edição de veículo já vendido (400)', r.status === 400, `status: ${r.status}`)
  }

  // ── Listagem após a venda ──────────────────────────────────────────────────
  section('Listagem após venda do Corolla')
  {
    const r = await req('GET', '/api/veiculos/disponiveis')
    const meus = r.body?.filter(v => [veiculoCorollaId, veiculoCivicId, veiculoHRVId].includes(v.id)) ?? []
    assert('apenas 2 veículos disponíveis (Corolla foi vendido)', meus.length === 2, `total: ${meus.length}`)
    assert('Corolla não está na lista de disponíveis', !meus.some(v => v.id === veiculoCorollaId), `ids: ${meus.map(v => v.id)}`)
    const precos = meus.map(v => v.preco)
    const sorted = [...precos].sort((a, b) => a - b)
    assert('ainda ordenado por preço', JSON.stringify(precos) === JSON.stringify(sorted), `preços: ${precos}`)
  }

  // ── Listagem de vendidos ───────────────────────────────────────────────────
  section('GET /api/veiculos/vendidos – listagem de veículos vendidos')
  {
    // João compra o HR-V
    await req('POST', '/api/vendas', { veiculoId: veiculoHRVId, clienteCpf: CPF_JOAO })
  }
  {
    const r = await req('GET', '/api/veiculos/vendidos')
    assert('status 200', r.status === 200, `status: ${r.status}`)
    const meusVendidos = r.body?.filter(v => [veiculoCorollaId, veiculoHRVId].includes(v.id)) ?? []
    assert('2 veículos vendidos desta execução', meusVendidos.length === 2, `total: ${meusVendidos.length}`)
    assert('todos com status VENDIDO', meusVendidos.every(v => v.status === 'VENDIDO'), JSON.stringify(meusVendidos.map(v => v.status)))
    const precos = meusVendidos.map(v => v.preco)
    const sorted = [...precos].sort((a, b) => a - b)
    assert('vendidos ordenados por preço', JSON.stringify(precos) === JSON.stringify(sorted), `preços: ${precos}`)
    // Corolla R$70k deve vir antes do HR-V R$95k
    assert('Corolla (R$70k) antes do HR-V (R$95k)', meusVendidos[0].id === veiculoCorollaId, `primeiro: ${meusVendidos[0]?.id}, esperado: ${veiculoCorollaId}`)
  }
  {
    // Apenas Civic sobrando como disponível
    const r = await req('GET', '/api/veiculos/disponiveis')
    const meus = r.body?.filter(v => [veiculoCorollaId, veiculoCivicId, veiculoHRVId].includes(v.id)) ?? []
    assert('apenas Civic restante como disponível', meus.length === 1 && meus[0].id === veiculoCivicId,
      `ids: ${meus.map(v => v.id)}, esperado: [${veiculoCivicId}]`)
  }

  // ── Resultado ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`)
  const total = passed + failed
  if (failed === 0) {
    console.log(`${GREEN}${BOLD}✓ Todos os ${total} testes passaram${RESET}`)
  } else {
    console.log(`${RED}${BOLD}✗ ${failed} de ${total} testes falharam${RESET}`)
  }
  console.log(`${'─'.repeat(50)}\n`)

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(err => {
  console.error(`\n${RED}Erro fatal: ${err.message}${RESET}`)
  console.error('Verifique se a API está rodando em', BASE_URL)
  process.exit(1)
})
