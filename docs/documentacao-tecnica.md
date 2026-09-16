# Documentação técnica do AppyFlow

> Status: proposta técnica da Etapa 0. Consulte também a
> [documentação funcional](documentacao-funcional.md). Este documento orienta as
> próximas etapas, mas não congela o schema de `ResumeContent` nem a estrutura
> interna dos templates LaTeX.

## 1. Contexto e objetivos arquiteturais

O AppyFlow é uma aplicação open source, self-hosted e single-user. A arquitetura
deve favorecer instalação simples, baixo custo, auditabilidade das decisões de
matching e rastreabilidade do conteúdo de currículos. Não fazem parte do escopo
multi-tenancy, cadastro público, billing, equipes ou RBAC complexo.

Os principais atributos de qualidade são:

- segurança de credenciais, sessões, uploads e dados pessoais;
- implantação local com Docker Compose e em Render com PostgreSQL externo;
- substituição de provedores de IA, busca, armazenamento e compilação;
- processamento idempotente, observável e econômico;
- preservação estrita de fatos profissionais e dos templates oficiais;
- evolução em etapas pequenas, testáveis e revisáveis.

## 2. Arquitetura proposta

Adotar um **monólito modular** em Next.js e TypeScript, com três pontos de
entrada que compartilham os mesmos módulos de domínio e aplicação:

1. servidor web: interface, autenticação e endpoints;
2. job runner: comandos finitos para buscas agendadas e tarefas assíncronas;
3. ferramentas administrativas: bootstrap e recuperação do usuário único.

PostgreSQL é a fonte de verdade. Prisma implementa persistência atrás de
repositórios. Integrações externas são adapters de portas definidas pela camada
de aplicação. O navegador nunca conversa diretamente com provedores externos.

Começar sem Redis, broker ou microsserviços. `SearchRun`, transações,
restrições únicas e advisory locks do PostgreSQL fornecem idempotência e evitam
execuções concorrentes. Uma fila dedicada só deve ser introduzida quando houver
uma necessidade medida de volume, retry ou paralelismo.

### Diagrama textual

```text
Navegador
   |
   | HTTPS + cookie de sessão
   v
Next.js (UI + boundary HTTP)
   |
   v
Serviços de aplicação  <----------------- Job runner / CLI
   |          |                              ^
   |          +--> Portas -------------------+
   |                 | AIProvider
   |                 | SearchProvider
   |                 | ArtifactStorage
   |                 | PdfCompiler
   |                 | Clock / Logger
   |
   +--> Domínio puro
   |      perfil, fatos, preferências, vagas,
   |      deduplicação, scoring e candidaturas
   |
   +--> Repositórios (interfaces)
              |
              v
       Adapters Prisma --> PostgreSQL

Adapters externos:
SearchProvider --> SerpApi/Serper
AIProvider     --> OpenAI/Gemini/Anthropic/OpenRouter
ArtifactStorage --> filesystem local ou S3-compatible
PdfCompiler    --> processo LaTeX isolado
```

### Regras de dependência

```text
presentation/jobs -> application -> domain
infrastructure ----^              (não depende de Next.js, Prisma ou APIs)
```

- `domain` não importa Next.js, Prisma, SDKs ou variáveis de ambiente;
- `application` coordena casos de uso e declara as portas necessárias;
- `infrastructure` implementa portas, persistência e integrações;
- `presentation` valida a entrada HTTP e converte respostas, sem regra de negócio;
- `jobs` chama os mesmos casos de uso da web, sem duplicá-los.

## 3. Estrutura de diretórios proposta

```text
.
|-- docs/
|   |-- architecture.md
|   `-- adr/
|-- prisma/
|   |-- schema.prisma
|   `-- migrations/
|-- src/
|   |-- app/                       # App Router, páginas e route handlers
|   |-- presentation/              # DTOs, validação de entrada e presenters
|   |-- application/
|   |   |-- ports/                 # interfaces de providers e repositórios
|   |   `-- use-cases/             # orquestração dos fluxos
|   |-- domain/
|   |   |-- candidate/
|   |   |-- jobs/
|   |   |-- matching/
|   |   |-- applications/
|   |   `-- resume/
|   |-- infrastructure/
|   |   |-- auth/
|   |   |-- database/
|   |   |-- ai/
|   |   |-- search/
|   |   |-- storage/
|   |   |-- latex/
|   |   `-- observability/
|   |-- jobs/                      # entrypoints finitos e scheduler local
|   |-- config/                    # env validado somente no servidor
|   `-- i18n/                      # textos da interface, inicialmente pt-BR
|-- templates/
|   |-- pt-BR/template.tex         # nome canônico proposto, mediante aprovação
|   `-- en/template.tex
|-- tests/
|   |-- unit/
|   |-- integration/
|   |-- contract/
|   |-- e2e/
|   `-- fixtures/
|-- scripts/                       # bootstrap e tarefas operacionais
|-- Dockerfile
|-- compose.yaml
|-- render.yaml
`-- .env.example
```

O repositório atual usa `templates/ptr-br/template.tex`. Isso aparenta ser um
erro de nomenclatura. Nenhum arquivo será movido ou alterado nesta etapa. A troca
para `pt-BR`, se aprovada, deve preservar o conteúdo byte a byte e ser feita em
uma etapa que atualize referências e testes conjuntamente.

## 4. Modelo inicial de dados

O modelo abaixo é um mapa de arquitetura, não uma ordem para criar todas as
tabelas na Etapa 2. Cada etapa adicionará apenas o mínimo que usar.

| Entidade | Responsabilidade e campos principais | Relações/regras |
| --- | --- | --- |
| `User` | email normalizado, nome, `passwordHash`, estado, timestamps | exatamente um registro ativo por instalação |
| `Session` | hash do token, expiração, último uso, metadados mínimos | pertence a `User`; token bruto existe só no cookie |
| `CandidateProfile` | headline, senioridade, localização e resumo estruturado | um perfil ativo por usuário; dados derivados têm versão |
| `ProfessionalFact` | tipo, dados estruturados, origem/evidência, estado de revisão | pertence ao perfil; unidade rastreável usada pela IA |
| `Preference` | cargos, modalidades, locais, idiomas, salário e exclusões | um conjunto ativo por perfil; valores complexos em JSON validado |
| `Resume` | arquivo mestre, tipo, checksum, storage key, texto extraído, estado | versões de upload imutáveis; um pode ser o mestre ativo |
| `SearchQuery` | texto, idioma, origem, filtros e hash normalizado | gerada para um perfil; associada a execuções |
| `SearchRun` | tipo, início/fim, status, contagens, custo e erro sanitizado | chave de idempotência; agrupa queries e resultados |
| `Source` | domínio canônico, tipo, estado, métricas e score explicado | domínio não basta para identificar uma vaga |
| `Job` | título/empresa/local normalizados, descrição, modalidade, datas e fingerprint | oportunidade deduplicada; campos brutos preservados separadamente |
| `JobOccurrence` | URL original/canônica, payload resumido e data de descoberta | liga `Job`, `Source`, `SearchQuery` e `SearchRun`; preserva múltiplas origens |
| `JobMatch` | versão do algoritmo, componentes, score, classe, explicação e timestamp | histórico imutável; pertence a `Job` e perfil |
| `Application` | estado do pipeline, notas e timestamps das transições | no máximo uma ativa por vaga/perfil; histórico de eventos recomendado |
| `ResumeVersion` | idioma, conteúdo validado, template/versionamento, `.tex`, PDF e checksums | pertence à candidatura; imutável após geração |

Tipos de estado previstos:

- candidatura: `FOUND`, `INTERESTING`, `RESUME_PREPARED`, `APPLIED`,
  `INTERVIEW`, `OFFER`, `REJECTED`, `ARCHIVED`;
- execução: `PENDING`, `RUNNING`, `SUCCEEDED`, `PARTIAL`, `FAILED`;
- idioma de currículo: `pt-BR` e `en` como valores de domínio, não textos livres.

Decisões de modelagem:

- IDs opacos (UUID/CUID) e timestamps em UTC;
- dinheiro armazenado como valor decimal + moeda, nunca `float`;
- payloads JSON precisam de schema e versão; JSON não substitui os campos usados
  em filtros, constraints e índices;
- documentos e PDFs ficam no storage; o banco guarda metadados, chaves e hashes;
- dados brutos úteis à auditoria são separados dos dados normalizados;
- `JobMatch` e `ResumeVersion` guardam versão do algoritmo/prompt/template para
  permitir reprodução e comparação;
- exclusão deve contemplar dados pessoais e artefatos, sem depender de cascade
  implícito não revisado.

## 5. Fronteiras entre domínio e providers

### Portas iniciais

- `AIProvider`: recebe tarefa, schema de saída, mensagens já minimizadas e limites;
  devolve resultado estruturado, modelo, uso e identificador da chamada.
- `SearchProvider`: recebe query, região/idioma, paginação e limites; devolve
  resultados brutos normalizados apenas no contrato do provider.
- `ArtifactStorage`: grava, lê e remove uploads/`.tex`/PDF por chave opaca.
- `PdfCompiler`: recebe `.tex` já renderizado e devolve PDF ou diagnóstico seguro.
- repositórios: persistem agregados sem expor tipos do Prisma ao domínio.
- `Clock`, gerador de IDs e logger: tornam regras testáveis e determinísticas.

### Responsabilidades que não pertencem aos providers

- geração de queries, deduplicação, cálculo de score e política de retry;
- escolha de modelo/provedor baseada em configuração e orçamento;
- validação de fatos e do `ResumeContent`;
- renderização LaTeX, seleção de template e escaping;
- persistência de secrets ou envio de API keys ao navegador.

Cada adapter terá health check, timeout, retry somente para falhas transitórias,
limite de concorrência e erros traduzidos para uma taxonomia interna. Mocks não
serão usados como substitutos de contract tests.

## 6. Fluxo completo de busca

```text
perfil + preferências + histórico
  -> gerar queries determinísticas
  -> opcionalmente enriquecer um conjunto pequeno com IA
  -> escolher exploração/exploração de fontes conforme política
  -> criar SearchRun idempotente
  -> executar SearchProvider com orçamento e paginação limitados
  -> registrar ocorrências brutas e métricas do provider
  -> canonicalizar URL e normalizar campos baratos
  -> calcular fingerprints e deduplicar por múltiplos sinais
  -> atualizar Job + JobOccurrence sem perder proveniência
  -> aplicar filtros determinísticos baratos
  -> buscar/enriquecer descrição apenas para candidatos promissores
  -> calcular matching determinístico
  -> chamar IA somente acima do limiar/configuração
  -> persistir JobMatch versionado
  -> atualizar métricas e Source Score
  -> concluir SearchRun e publicar resultados no dashboard
```

Falhas por item não derrubam toda a execução: o run pode terminar `PARTIAL`, com
contagens e erros sanitizados. Repetir um run com a mesma chave não deve criar
vagas, ocorrências ou matches duplicados.

## 7. Fluxo de matching

1. Construir uma visão versionada do perfil e preferências.
2. Extrair sinais determinísticos da vaga: skills, senioridade, localização,
   modalidade, idioma, recência e salário quando comparável.
3. Aplicar bloqueios explícitos antes do score.
4. Calcular componentes com pesos configuráveis e explicáveis.
5. Produzir `Match Score` de 0 a 100 e classe inicialmente configurável, sem
   apresentá-lo como probabilidade de contratação.
6. Se habilitado e economicamente justificável, pedir à IA análise estruturada
   de strengths/gaps, validá-la e combiná-la sem ocultar o score determinístico.
7. Persistir entradas relevantes, versão do algoritmo, componentes e explicação.

Ausência de informação não equivale automaticamente a incompatibilidade. Cada
componente deve distinguir `MATCH`, `MISMATCH`, `UNKNOWN` e `NOT_APPLICABLE`.
Limiares de quente/morna/fria serão definidos e testados na etapa de matching.

## 8. Fluxo de preparação do currículo

```text
Job + CandidateProfile + ProfessionalFacts revisados + Resume mestre
  -> detectar idioma da vaga por regras
  -> aplicar preferência em caso ambíguo
  -> aceitar override manual antes de gerar
  -> selecionar somente fatos elegíveis e suas evidências
  -> AIProvider produz ResumeContent estruturado, citando IDs dos fatos
  -> validar schema e idioma
  -> validar cada afirmação contra fatos/evidências conhecidos
  -> rejeitar ou pedir revisão quando houver conteúdo sem sustentação
  -> resolver template oficial pelo idioma
  -> renderer determinístico aplica escaping e omite seções vazias
  -> gerar `.tex` e checksums
  -> compilar sem shell escape, com timeout e diretório temporário isolado
  -> armazenar PDF e diagnóstico
  -> criar ResumeVersion imutável e atualizar a candidatura
```

O LLM nunca produz o documento LaTeX, nunca escolhe livremente fatos e nunca
altera datas, números, empresas, produtos ou tecnologias. Uma saída que não
possa apontar os IDs dos fatos de origem não é publicável automaticamente.

## 9. Estratégia bilíngue PT-BR/EN

- usar BCP 47 (`pt-BR`, `en`) no domínio e em paths;
- manter fatos em representação neutra e estruturada;
- permitir representações textuais localizadas ligadas aos mesmos IDs de fatos;
- preservar nomes próprios, tecnologias, datas e métricas entre idiomas;
- detectar idioma primeiro por regras/heurística local sobre título e descrição;
- usar preferência configurada no caso ambíguo e sempre permitir override;
- reservar IA para ambiguidade real ou geração da redação, não para decisões
  determinísticas simples;
- manter a UI inicialmente em PT-BR, separada do idioma do currículo;
- testar equivalência factual entre versões PT-BR e EN.

O schema definitivo de `ResumeContent` não é definido aqui. A necessidade
provisória é apenas que conteúdo localizado referencie fatos estáveis e ofereça
seções suficientes para os dois templates.

## 10. Estratégia para os templates LaTeX oficiais

A inspeção preliminar mostra dois documentos independentes, mas paralelos:

- ambos usam `article` A4/10pt, a mesma geometria e os mesmos pacotes, exceto a
  opção de idioma do `babel`;
- ambos contêm cabeçalho, experiências, projetos, skills, educação, cursos e
  idiomas na mesma ordem;
- títulos, exemplos e conteúdo são próprios de cada idioma;
- dados pessoais, links, listas e datas são pontos dinâmicos evidentes;
- não há macros próprias de conteúdo hoje; o conteúdo está inline.

Isso é apenas um inventário para planejamento. Na Etapa 22 será feita a análise
formal de campos comuns/exclusivos, opcionais, macros e pontos de injeção, antes
de fechar `ResumeContent`.

Regras da implementação futura:

- preservar cada arquivo oficial como fonte de verdade e registrar checksum e
  versão do template usado em cada `ResumeVersion`;
- não traduzir um template para criar o outro;
- introduzir o menor mecanismo de placeholders possível, somente após aprovação;
- renderer próprio e determinístico por idioma, podendo compartilhar funções de
  escaping e estruturas comuns;
- escapar pelo contexto (texto, URL e metadados PDF), nunca por substituição
  genérica única;
- omitir blocos opcionais inteiros sem deixar comandos/separadores inválidos;
- compilar com `-no-shell-escape`, timeout, limite de recursos e diretório
  temporário descartável;
- fixtures e compilação independentes para os dois idiomas.

## 11. Estratégia de autenticação single-user

- impedir cadastro público e a criação de um segundo usuário no serviço e no
  banco (chave singleton/constraint além da validação da aplicação);
- hash de senha com Argon2id e parâmetros versionados;
- sessão opaca persistida no banco apenas como hash; cookie `HttpOnly`, `Secure`
  em produção, `SameSite=Lax`, escopo mínimo, expiração e rotação após login;
- proteção de toda rota privada no servidor e checagem de autorização no caso de
  uso, não apenas na UI;
- proteção CSRF para mutações por verificação de origem e token quando aplicável;
- rate limit e atraso progressivo no login, sem revelar se o usuário existe;
- revogação de sessões no logout e em troca de senha;
- recuperação de acesso por comando administrativo local, não por email na
  primeira versão.

Bootstrap proposto:

- local/Docker: comando administrativo interativo que lê a senha sem eco;
- Render: gerar localmente um `ADMIN_PASSWORD_HASH`, fornecê-lo como secret junto
  com `ADMIN_EMAIL` e executar bootstrap idempotente uma única vez;
- após a criação, o comando recusa alterações implícitas e os secrets de
  bootstrap devem ser removidos. Senha em texto puro não vai para `.env`, logs ou
  argumentos de processo.

## 12. Estratégia de worker e scheduler

Casos de uso de jobs serão funções da camada de aplicação chamadas por comandos
finitos, por exemplo `daily-search`. Cada execução:

- adquire advisory lock por tipo/instalação;
- cria ou retoma `SearchRun` por chave de idempotência;
- aplica timeout, orçamento e cancelamento cooperativo;
- registra logs estruturados e métricas sem conteúdo sensível;
- termina com exit code coerente e libera o lock.

No Docker Compose, um serviço `scheduler` opcional usa a mesma imagem e dispara
o comando no horário configurado. No Render, a busca diária é um Cron Job, que
executa e encerra; um background worker contínuo só será adicionado se tarefas
sob demanda realmente exigirem fila. Horários da interface são convertidos do
timezone configurado para UTC, usado pelo agendador.

## 13. Estratégia de testes

| Camada | Cobertura |
| --- | --- |
| Unitários | regras de idioma, scoring, filtros, canonicalização, fingerprints, transições e escaping |
| Integração | Prisma/PostgreSQL real, constraints, transações, locks, storage e serviços principais |
| Contract | cada adapter contra o contrato comum; providers externos com fixtures gravadas/sanitizadas e testes opt-in |
| Template | renderização e compilação PT-BR/EN, opcionais, vazios, caracteres especiais, URLs e conteúdo longo |
| E2E | bootstrap/login, perfil, busca, pipeline e preparação nos dois idiomas |

Princípios:

- banco de teste descartável e isolado; migrations reais, não mocks do Prisma;
- providers falsos determinísticos para testes padrão, sem custo/rede;
- relógio e IDs injetáveis onde alterem resultados;
- snapshot apenas para artefatos estáveis e revisáveis, nunca como única asserção;
- CI executa lint, typecheck, unitários, integração, build e, quando disponível,
  compilação LaTeX; E2E pode ser separado por custo;
- regressões de segurança ganham teste antes da correção ser considerada pronta.

## 14. Estratégia Docker

- Dockerfile multi-stage, usuário não-root e imagem de runtime com apenas os
  artefatos necessários;
- saída standalone do Next.js se a versão adotada mantiver suporte adequado;
- toolchain LaTeX mínima e fixada, sem `shell-escape`;
- `compose.yaml` com `app`, `postgres` e perfil opcional `scheduler`;
- volumes nomeados para PostgreSQL e artifacts locais;
- health checks separados para processo (`/api/health/live`) e dependências
  essenciais (`/api/health/ready`), sem expor secrets;
- migrations executadas por comando explícito de deploy, não por toda réplica ao
  iniciar;
- `.dockerignore`, limites de upload e encerramento gracioso;
- a mesma imagem deve servir web e jobs mudando apenas o comando.

## 15. Estratégia Render

Um Blueprint `render.yaml` deverá descrever, quando essa etapa chegar:

- Web Service Docker para o Next.js, ouvindo em `0.0.0.0:$PORT`;
- Render Postgres ou PostgreSQL externo via `DATABASE_URL`;
- pre-deploy command para aplicar migrations revisadas;
- Cron Job diário usando a mesma imagem e o comando finito de busca;
- env group/secrets para sessão e chaves BYOK, nunca valores no repositório;
- health check público mínimo e serviços na mesma região;
- persistent disk para artifacts apenas na configuração simples de instância
  única, ou storage S3-compatible para portabilidade/escala.

Cron não deve depender de arquivos no disco do Web Service. A busca agendada usa
PostgreSQL e providers; artifacts de currículo ficam atrás de `ArtifactStorage`.
Se o compilador migrar para outro serviço, object storage passa a ser obrigatório
porque discos anexados a serviços diferentes não são compartilhados.

Referências operacionais consultadas em 2026-09-16:

- [Self-hosting do Next.js](https://nextjs.org/docs/app/guides/self-hosting)
- [Web Services do Render](https://render.com/docs/web-services)
- [Cron Jobs do Render](https://render.com/docs/cronjobs)
- [Background Workers do Render](https://render.com/docs/background-workers)
- [Blueprint YAML do Render](https://render.com/docs/blueprint-spec)
- [Deploy de migrations do Prisma](https://docs.prisma.io/docs/orm/prisma-client/deployment/deploy-migrations-from-a-local-environment)

## 16. Segurança, observabilidade e custos transversais

- configuração validada no boot; variáveis públicas separadas das server-only;
- logs JSON com `requestId`, `searchRunId`, provider, duração, contagens e status;
- redaction central de keys, cookies, senhas, currículos e descrições completas;
- auditoria de mudança de pipeline, geração de currículo e login relevante;
- limites configuráveis por execução, dia, provider e número de vagas;
- cache por hash de query/provider/parâmetros e por versão de análise;
- descrição completa só é processada para oportunidades que passam filtros;
- uploads verificados por tamanho, tipo real, extensão e checksum, fora da pasta
  pública e sem usar nome fornecido pelo usuário como path;
- timeouts, limites de resposta e proteção contra SSRF ao buscar URLs descobertas;
- prompt injection em descrições de vagas é tratada como dado não confiável;
- backups e procedimento de restauração incluem banco e artifact storage.

## 17. Riscos técnicos

| Risco | Impacto | Mitigação inicial |
| --- | --- | --- |
| páginas de vagas instáveis, JS-heavy ou bloqueadas | baixa cobertura | começar por search APIs, preservar proveniência, adapters e métricas por fonte |
| falsos positivos na deduplicação | perda aparente de oportunidades | múltiplos sinais, guardar ocorrências e permitir auditoria/reprocessamento |
| hallucination no currículo | dano reputacional | IDs de fatos, validação pós-LLM, revisão e bloqueio de afirmações sem evidência |
| prompt injection na vaga/currículo | exfiltração ou saída manipulada | tratar conteúdo como dados, minimizar contexto, schema estrito e nenhuma tool livre |
| compilação LaTeX insegura ou cara | execução/DoS | renderer controlado, no-shell-escape, timeout e isolamento |
| templates divergem com o tempo | regressão de um idioma | versão/checksum e suites independentes para PT-BR/EN |
| storage local no Render | perda/indisponibilidade entre serviços | persistent disk no MVP, adapter S3-compatible para portabilidade |
| jobs duplicados | custo e duplicatas | advisory lock, idempotency keys, uniqueness e upserts cuidadosos |
| API costs imprevisíveis | inviabilidade self-hosted | budgets, filtros baratos, cache, métricas e opt-in para IA |
| bootstrap mal configurado | takeover da instalação | sem signup, hash gerado localmente, bootstrap único e secrets removíveis |
| PII em logs/backups | incidente de privacidade | redaction, retenção mínima, acesso restrito e documentação de restore/delete |
| dependências de busca mudam termos/APIs | quebra operacional | contratos estreitos, adapters substituíveis e health checks |

## 18. Decisões arquiteturais a documentar em ADRs

Criar ADRs curtos quando a respectiva etapa for autorizada:

1. monólito modular e regras de dependência;
2. Next.js App Router e limites entre Server Components/actions/routes;
3. autenticação própria single-user e fluxo de bootstrap;
4. PostgreSQL + Prisma e política de migrations;
5. estratégia de IDs, timestamps e retenção de dados brutos;
6. contratos de `AIProvider` e `SearchProvider`;
7. deduplicação e identidade de `Job` versus `JobOccurrence`;
8. fórmula/versionamento do Match Score;
9. fatos profissionais, evidências e validação anti-invenção;
10. schema final de `ResumeContent`, após a Etapa 22;
11. versionamento, placeholders e escaping dos templates oficiais;
12. engine e sandbox de compilação LaTeX;
13. filesystem versus object storage;
14. scheduler com PostgreSQL versus fila dedicada;
15. estratégia de deploy e migrations no Render;
16. política de logs, redaction, custos e retenção.

## 19. Critérios de conclusão da Etapa 0

- [x] Escopo e atributos de qualidade foram registrados.
- [x] Arquitetura e diagrama textual foram propostos.
- [x] Estrutura de diretórios foi proposta.
- [x] Modelo inicial e relações foram avaliados sem criar tabelas prematuras.
- [x] Fronteiras de domínio, aplicação e providers foram definidas.
- [x] Fluxos de busca, matching e preparação foram descritos.
- [x] Estratégias bilíngue e de templates foram descritas.
- [x] Autenticação single-user e bootstrap seguro foram planejados.
- [x] Worker/scheduler, testes, Docker e Render foram planejados.
- [x] Riscos e ADRs futuros foram listados.
- [x] Nenhum código de produto ou template oficial foi alterado.

## 20. Sequência recomendada

Seguir o roadmap definido no prompt, sem antecipar funcionalidades. Na Etapa 1,
criar apenas o bootstrap executável, qualidade, configuração, health check,
Docker/Compose e documentação básica. O primeiro recorte de banco permanece na
Etapa 2; autenticação, providers e currículo seguem nas etapas posteriores.

Branch sugerida para esta documentação: `docs/arquitetura-inicial`.

Commit sugerido: `docs: define arquitetura inicial do AppyFlow`.
