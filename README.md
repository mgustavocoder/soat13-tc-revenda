# soat13-tc-revenda

Os três serviços da aplicação foram extraídos para projetos independentes, localizados como diretórios irmãos deste repositório. Cada projeto tem seu próprio código, dependências, API, banco de dados e configuração de infraestrutura. Não há um Compose ou banco compartilhado neste repositório.

```text
dev/
├── soat13-tc-revenda/             # este repositório
├── soat13-tc-revenda-clientes/
├── soat13-tc-revenda-veiculos/
└── soat13-tc-revenda-vendas/
```

## Executar

Em cada projeto, configure seu `.env` e suba somente sua aplicação e seu banco:

```bash
cd ../soat13-tc-revenda-clientes && cp .env.example .env && docker compose up -d --build
cd ../soat13-tc-revenda-veiculos && cp .env.example .env && docker compose up -d --build
cd ../soat13-tc-revenda-vendas && cp .env.example .env && docker compose up -d --build
```

Portas padrão das APIs: clientes `3001`, veículos `3002` e vendas `3003`. Os bancos são isolados, com volumes e portas próprios (`3307`, `3308` e `3309`). O serviço de vendas integra clientes e veículos exclusivamente pelas APIs HTTP; suas URLs podem ser configuradas em `CLIENTES_SERVICE_URL` e `VEICULOS_SERVICE_URL`.

Consulte o README de cada projeto para suas rotas e configurações:

- [Clientes](../soat13-tc-revenda-clientes/README.md)
- [Veículos](../soat13-tc-revenda-veiculos/README.md)
- [Vendas](../soat13-tc-revenda-vendas/README.md)
