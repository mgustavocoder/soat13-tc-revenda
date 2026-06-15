# soat13-tc-revenda

Plataforma de revenda de veículos automotores. API REST para cadastro e venda de veículos online.

## Funcionalidades

- Cadastrar veículo para venda (marca, modelo, ano, cor, preço)
- Editar dados do veículo
- Cadastrar clientes (obrigatório antes de efetuar compra)
- Comprar veículo via internet (somente clientes cadastrados)
- Listar veículos à venda, ordenados por preço (mais barato → mais caro)
- Listar veículos vendidos, ordenados por preço (mais barato → mais caro)

## Tecnologias

- **Node.js 22** com ES Modules
- **Express 5**
- **MySQL 8.4** via Knex
- **Docker Compose** para ambiente local
- **Jest + Supertest** para testes

## Como rodar

### Pré-requisitos

- Docker e Docker Compose instalados

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

### 2. Subir os serviços

```bash
docker-compose up -d
```

O banco de dados é inicializado automaticamente com o schema em `script.sql`.  
A API estará disponível em `http://localhost:3000`.

### 3. Verificar saúde da API

```bash
curl http://localhost:3000/api/health
```

## Endpoints

### Clientes

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/clientes` | Cadastrar cliente |
| `GET` | `/api/clientes` | Listar todos os clientes |
| `GET` | `/api/clientes/:cpf` | Buscar cliente por CPF |

**Cadastrar cliente:**
```json
POST /api/clientes
{
  "nome": "Maria Silva",
  "cpf": "12345678901",
  "email": "maria@email.com"
}
```

### Veículos

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/veiculos` | Cadastrar veículo |
| `PUT` | `/api/veiculos/:id` | Editar dados do veículo |
| `GET` | `/api/veiculos/:id` | Buscar veículo por ID |
| `GET` | `/api/veiculos/disponiveis` | Listar veículos à venda (ordem por preço ↑) |
| `GET` | `/api/veiculos/vendidos` | Listar veículos vendidos (ordem por preço ↑) |

**Cadastrar veículo:**
```json
POST /api/veiculos
{
  "marca": "Toyota",
  "modelo": "Corolla",
  "ano": 2022,
  "cor": "Branco",
  "preco": 85000
}
```

**Editar veículo** (qualquer subconjunto dos campos abaixo):
```json
PUT /api/veiculos/1
{
  "preco": 80000,
  "cor": "Prata"
}
```

### Vendas

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/vendas` | Comprar veículo |

**Comprar veículo** (cliente deve estar previamente cadastrado):
```json
POST /api/vendas
{
  "veiculoId": 1,
  "clienteCpf": "12345678901"
}
```

## Regras de negócio

- O cliente **deve estar cadastrado** antes de efetuar uma compra
- Um veículo **vendido não pode ser editado** nem comprado novamente
- O CPF deve ter **11 dígitos numéricos**
- O ano do veículo deve estar entre **1886 e o ano atual + 1**
- O preço deve ser um **valor positivo**

## Testes

```bash
# Executar todos os testes
npm test

# Apenas os testes E2E
npm run test:e2e

# Com cobertura
npm run test:coverage
```

O teste E2E em `tests/e2e/fluxo-completo.e2e.test.js` cobre o fluxo completo de negócio:
cadastro de clientes → cadastro de veículos → listagem ordenada → edição → compra → verificação dos estados finais.

## Estrutura do projeto

```
src/
├── domain/
│   ├── entities/          # Cliente, Veiculo, Venda + value objects
│   └── errors/            # Erros de domínio tipados
├── application/
│   ├── usecases/          # Regras de negócio
│   └── gateways/          # Repositórios + adapters
└── infrastructure/
    ├── api/               # Servidor Express + tratamento de erros
    ├── controllers/       # Controllers + factory de injeção
    ├── datasource/        # Configuração do Knex/MySQL
    └── logger.js
tests/
├── helpers/               # Utilitários de teste
└── e2e/                   # Teste end-to-end do fluxo completo
```
