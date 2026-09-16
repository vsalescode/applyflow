# AppyFlow

Sistema open source, self-hosted e single-user para descoberta inteligente de
vagas e preparação de candidaturas.

O projeto está no início do desenvolvimento. A fundação técnica e a autenticação
single-user já estão disponíveis; busca, matching e currículos serão adicionados
incrementalmente.

## Requisitos

- Node.js 24 ou superior;
- npm 11 ou superior;
- Docker com Compose, para execução containerizada.

## Configuração local

Copie o arquivo de exemplo e ajuste as variáveis quando necessário:

```powershell
Copy-Item .env.example .env.local
```

Instale as dependências e inicie o servidor:

```powershell
npm install
npm run dev
```

A aplicação estará disponível em <http://localhost:3000>.

## Primeiro acesso

Ao abrir a aplicação pela primeira vez, acesse <http://localhost:3000/setup> e
cadastre o único usuário da instalação. A senha deve ter entre 12 e 128
caracteres. Depois da configuração inicial, novos cadastros são bloqueados e o
acesso passa a ser feito em <http://localhost:3000/login>.

O botão `Sair` do painel encerra a sessão atual. As sessões também expiram após
sete dias e um novo login invalida sessões anteriores.

## Docker Compose

```powershell
docker compose up --build
```

O Compose inicia a aplicação e o PostgreSQL. A integração da aplicação com o
banco é configurada automaticamente e as migrations são aplicadas antes do
servidor iniciar.

Para encerrar os containers sem remover os dados:

```powershell
docker compose down
```

## Verificações de qualidade

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

O teste de integração cria um PostgreSQL isolado na porta `5433`, aplica as
migrations, executa os testes e remove o container e seus dados ao terminar.

## Banco de dados

Com o PostgreSQL configurado em `DATABASE_URL`:

```powershell
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:studio
```

- `db:migrate:dev`: cria/aplica migrations durante o desenvolvimento;
- `db:migrate:deploy`: aplica migrations já versionadas em outros ambientes;
- `db:studio`: abre a ferramenta de inspeção do Prisma.

O modelo contém o usuário principal da instalação e suas sessões. A senha é
armazenada somente como hash Argon2id; tokens de sessão também não são persistidos
em texto puro.

## Health checks

- `GET /api/health/live`: confirma que o processo está respondendo;
- `GET /api/health/ready`: valida a configuração e a conexão com PostgreSQL.

## Variáveis de ambiente

| Variável          | Obrigatória | Finalidade                                                  |
| ----------------- | ----------- | ----------------------------------------------------------- |
| `APP_URL`         | sim         | URL pública da instalação                                   |
| `DATABASE_URL`    | sim         | conexão com PostgreSQL                                      |
| `AI_PROVIDER`     | não         | `disabled`, `openai`, `gemini`, `anthropic` ou `openrouter` |
| `AI_API_KEY`      | condicional | chave server-side quando o provider de IA é habilitado      |
| `AI_MODEL`        | condicional | modelo usado pelo provider de IA                            |
| `SEARCH_PROVIDER` | não         | `disabled`, `serpapi` ou `serper`                           |
| `SEARCH_API_KEY`  | condicional | chave server-side quando a busca é habilitada               |

Os providers ficam desabilitados por padrão. Nesta etapa, a configuração e os
contratos estão disponíveis, mas ainda não existem adapters que façam chamadas
às APIs externas.

Nunca versione `.env` ou `.env.local`. O arquivo `.env.example` contém apenas
valores seguros para desenvolvimento.

## Estrutura inicial

```text
src/app/            interface e endpoints HTTP
src/infrastructure/ integrações técnicas, incluindo PostgreSQL
src/server/         configuração e serviços server-side
prisma/             schema e migrations versionadas
docs/               documentação funcional e técnica
public/             assets públicos
```

## Documentação

- [Visão funcional](docs/documentacao-funcional.md)
- [Documentação técnica](docs/documentacao-tecnica.md)

## Licença

A licença open source será definida antes da primeira versão pública.
