# Aivacol Fleet API

API backend para gestão de frota com autenticação JWT, controle de acesso por roles, CRUD de marcas, modelos e veículos, processamento assíncrono de eventos, logs de auditoria, notificações e cache Redis.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22 |
| Framework | NestJS + TypeScript |
| Banco Relacional | SQL Server 2022 |
| ORM | TypeORM |
| Banco de Documentos | MongoDB 7 + Mongoose |
| Cache | Redis 7 |
| Mensageria | RabbitMQ 3 |
| Autenticação | JWT + Passport |
| Testes | Jest + ts-jest |
| Containerização | Docker + Docker Compose |
| Documentação | Swagger (OpenAPI) |

---

## Arquitetura

**MVC Modular** — dois processos NestJS compartilhando o mesmo código-fonte:

```
HTTP Client
  └─▶ NestJS API  ──▶ SQL Server   (Brands, Models, Vehicles, Users)
                  ──▶ Redis         (cache de GET /vehicles)
                  ──▶ RabbitMQ ──▶ NestJS Worker ──▶ MongoDB
                                                       ├─ Audit Logs
                                                       └─ Notifications
```

- **API** (`src/main.ts`) — responsável pelo HTTP, autenticação JWT, CRUD, cache e publicação de eventos.
- **Worker** (`src/worker.ts`) — consome eventos do RabbitMQ e persiste logs de auditoria e notificações no MongoDB.
- **SQL Server** — dados transacionais (usuários, marcas, modelos, veículos) com soft-delete e unicidade global.
- **MongoDB** — armazenamento de logs de auditoria e notificações orientadas ao usuário.
- **Redis** — estratégia Cache-Aside para `GET /vehicles` e `GET /vehicles/:id`, com TTL configurável via `CACHE_TTL_SECONDS`.
- **Docker Compose** — stack local completa; `docker-compose.prod.yml` utiliza Dockerfile multistage para execução próxima à produção.

---

## Fluxo de Eventos

```
Vehicle create / update / delete
  └─▶ VehicleService publica VehicleEvent no RabbitMQ
        └─▶ Worker VehicleEventsConsumer recebe o evento
              ├─▶ AuditService      → cria AuditLog     (MongoDB)
              └─▶ NotificationService → cria Notification (MongoDB)
```

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2 (incluído no Docker Desktop)

---

## Executando em Desenvolvimento

```bash
cp .env.example .env           # preencher as variáveis de ambiente
docker compose up -d --build   # sobe API, Worker, SQL Server, MongoDB, Redis e RabbitMQ
docker compose exec api npm run db:setup:dev  # migrations + bootstrap + seeds
```

Hot-reload habilitado em desenvolvimento por meio do ambiente Docker configurado para esse fim.

---

## Executando em Ambiente Production-like

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npm run db:setup:prod
```

- Utiliza o **Dockerfile multistage** (`Dockerfile`) — compila TypeScript e executa o código gerado em `dist/`.
- Sem hot-reload; processo mais próximo de uma execução em produção.
- Mesma topologia de rede e serviços que o ambiente de desenvolvimento.
- **Não substitui um ambiente produtivo real**: não inclui gestão de secrets externos, observabilidade centralizada, balanceamento de carga nem infraestrutura dedicada.

## Valida se o ambiente esta de pé e tudo ok 
curl http://localhost:3000/api/health

Resposta esperada
{"status":"ok","services":{"api":"ok","database":"ok","mongo":"ok","redis":"ok","rabbitmq":"ok"}}
---

## URLs Úteis

| Recurso | URL |
|---|---|
| Health Check | http://localhost:3000/api/health |
| Swagger UI | http://localhost:3000/api/docs |
| RabbitMQ Management | http://localhost:15672 |

> Credenciais do RabbitMQ definidas no `.env` (`RABBITMQ_USER` / `RABBITMQ_PASSWORD`).

---

## Credenciais Iniciais (seeds)

| Role | E-mail | Senha |
|---|---|---|
| ADMIN | admin@aivacol.com | 123456 |
| OPERATOR | operador@aivacol.com | 123456 |

---

## Autenticação no Swagger

1. Acesse http://localhost:3000/api/docs.
2. Execute `POST /auth/login` com as credenciais desejadas.
3. Copie o valor de `accessToken` retornado no campo `data`.
4. Clique no botão **Authorize** (cadeado) no topo da página.
5. Cole o token no campo **Value** e confirme clicando em **Authorize**.
6. Todos os endpoints protegidos passarão a enviar o header `Authorization: Bearer <token>` automaticamente.

---

## Scripts

Todos os comandos devem ser executados **dentro do container Docker**, pois Jest e TypeScript estão instalados apenas nele:

```bash
# Testes unitários
docker compose exec api npm test

# Testes unitários com relatório de cobertura
docker compose exec api npm run test:cov

# Testes e2e (requer stack completa em execução)
docker compose exec api npm run db:setup:dev  # preparar banco antes dos testes e2e
docker compose exec api npm run test:e2e

# Setup do banco (desenvolvimento)
docker compose exec api npm run db:setup:dev

# Setup do banco (produção)
docker compose exec api npm run db:setup:prod

# Passos individuais
docker compose exec api npm run migration:run
docker compose exec api npm run bootstrap
docker compose exec api npm run seed
```

---

## Evolução da Implementação

| Etapa | Entregável |
|---|---|
| 1 | Scaffold do projeto, Dockerfiles, Docker Compose, Swagger inicial e Health Check |
| 2 | Infraestrutura e conectividade entre serviços |
| 3 | Banco relacional, migrations, bootstrap idempotente e seeds |
| 4 | Autenticação JWT, login, `/me`, `/admin-check`, roles e guards |
| 5 | CRUD completo de marcas, modelos e veículos, paginação, filtros, ordenação e Soft Delete |
| 6 | RabbitMQ, Worker assíncrono, Audit Logs e Notifications |
| 7 | Cache Redis (Cache-Aside) para `GET /vehicles` e `GET /vehicles/:id`, TTL e invalidação |
| 8 | 58 testes unitários e 31 testes e2e cobrindo os principais fluxos e módulos |
| 9 | README final, Swagger revisado e checklist de validação |

---

## Testes

**Testes unitários** utilizam mocks para todas as dependências externas (TypeORM, Mongoose, Redis, RabbitMQ, JWT) e executam sem necessidade de infraestrutura em execução.

**Testes e2e** realizam chamadas HTTP reais contra a API rodando na stack Docker. O banco deve estar previamente configurado.

```bash
# 1. Preparar o banco (obrigatório antes dos testes e2e)
docker compose exec api npm run db:setup:dev

# 2. Testes unitários (58 testes — 8 suítes)
docker compose exec api npm test

# 3. Testes e2e — executados contra a API real via HTTP (31 testes — 6 suítes)
docker compose exec api npm run test:e2e

# 4. Relatório de cobertura (HTML + lcov)
docker compose exec api npm run test:cov
```

**Resultados:**

| Suíte | Testes |
|---|---|
| Unitários | 58 passing |
| E2E | 31 passing |
| **Total** | **89 passing** |

Os testes priorizam regras críticas de negócio, autenticação, autorização, domínio, cache, notificações, auditoria e os principais fluxos HTTP. A cobertura global não busca 100% artificial: arquivos como módulos NestJS, DTOs, migrations, bootstrap e entrypoints entram no relatório mas não representam lógica a ser coberta.

---

## Cache Redis

- **Estratégia**: Cache-Aside — a aplicação consulta o Redis primeiro; em caso de MISS, consulta o SQL Server, popula o Redis e retorna a resposta.
- **Escopo**: `GET /vehicles` (lista com hash determinístico dos filtros) e `GET /vehicles/:id`.
- **TTL**: lido da variável de ambiente `CACHE_TTL_SECONDS` — nunca definido no código.
- **Chaves**: `vehicles:list:{sha1-dos-filtros-ordenados}` e `vehicles:id:{id}`.
- **Invalidação**: nas operações `POST /vehicles`, `PUT /vehicles/:id` e `DELETE /vehicles/:id` as chaves afetadas são removidas do cache.
- Brands, Models, Auth, Audit e Notifications **não possuem cache**.

Notifications não foram cacheadas nesta versão por serem dados vinculados ao usuário autenticado e sofrerem alteração de estado ao serem marcadas como lidas. Essa evolução foi registrada como melhoria futura.

---

## Segurança

- JWT obrigatório em todos os endpoints, exceto `POST /auth/login`.
- As senhas são armazenadas utilizando hashes gerados com **bcryptjs** e nunca são retornadas em nenhuma resposta.
- `RolesGuard` restringe os endpoints de Audit Logs exclusivamente a usuários com role `ADMIN`.
- Endpoints de Notifications retornam apenas registros vinculados ao usuário autenticado — nunca de outros usuários.
- `ValidationPipe` configurado com `whitelist: true` e `forbidNonWhitelisted: true`.
- `created_by` é sempre extraído do JWT autenticado — nunca aceito pelo corpo da requisição.
- Tokens, senhas e segredos nunca são persistidos em logs de auditoria, notificações ou cache.

---

## Decisões Técnicas

| Decisão | Justificativa |
|---|---|
| MVC Modular em vez de microserviços completos | Escopo adequado ao teste técnico; implantação mais simples |
| API e Worker no mesmo codebase, processos separados | Simplicidade operacional; API mantém baixa latência HTTP enquanto o Worker isola o processamento assíncrono |
| MongoDB para auditoria e notificações | Modelo de documento adequado para dados de eventos orientados ao usuário |
| Redis apenas para veículos | Veículos são o recurso com maior volume de leitura; evita otimização prematura |
| Bootstrap e seeds idempotentes | Seguro executar `db:setup:dev` múltiplas vezes sem corromper dados |
| Unicidade global mesmo com soft-delete | Evita conflitos e garante integridade dos dados de frota |
| Sem Outbox Pattern | Fora do escopo deste teste; registrado como melhoria futura |
| Sem permissões granulares | Roles ADMIN / OPERATOR cobrem todo o controle de acesso necessário |
| Users sem CRUD público completo | Usuários são provisionados via bootstrap/seed para o escopo do teste; a tabela é utilizada para autenticação, autoria (`created_by`), auditoria e notificações. A gestão completa de usuários fica como evolução futura. |
> Todas as decisões arquiteturais foram tomadas considerando o escopo do teste técnico, priorizando clareza, previsibilidade operacional e validação incremental, evitando complexidade desnecessária sem comprometer boas práticas fundamentais.
---

## Melhorias Futuras

Os itens abaixo foram identificados durante o desenvolvimento como possíveis evoluções da solução, porém não foram implementados por estarem fora do escopo definido para este teste técnico.

- **Outbox Pattern** — garantir atomicidade entre a escrita no SQL Server e a publicação no RabbitMQ.
- **Dead Letter Queue (DLQ)** — tratar mensagens problemáticas no Worker sem perda de dados.
- **Refresh Token** — estender a sessão do usuário sem nova autenticação.
- **CI/CD** — lint, testes e build automatizados em pull requests.
- **Observabilidade** — logs estruturados (Pino), rastreamento distribuído (OpenTelemetry), métricas (Prometheus).
- **Banco isolado para testes** — instâncias dedicadas de SQL Server e MongoDB para execução dos testes e2e.
- **Cobertura de controllers e repositories** — testes unitários atuais focam nos services.
- **Cache de notificações** — chave Redis por usuário com invalidação ao receber novos eventos.
- **Gestão completa de usuários** — criação, atualização, desativação e troca de senha com regras administrativas.

---

## Checklist de Validação Final

Execute os comandos abaixo em ordem para validar a entrega completa:

```bash
# 1. Subir a stack completa
docker compose up -d --build

# 2. Aplicar migrations, bootstrap e seeds
docker compose exec api npm run db:setup:dev

# 3. Testes unitários
docker compose exec api npm test

# 4. Testes e2e
docker compose exec api npm run test:e2e

# 5. Health check
curl http://localhost:3000/api/health
# Esperado: {"status":"ok","services":{"api":"ok","database":"ok","mongo":"ok","redis":"ok","rabbitmq":"ok"}}
```

Todos os cinco passos devem ser concluídos com sucesso para a entrega ser considerada completa.
