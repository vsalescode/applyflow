# Documentação funcional do AppyFlow

> Status: visão funcional inicial da Etapa 0. Este documento descreve o produto
> pela perspectiva do usuário e das regras de negócio, sem detalhar sua
> implementação. A solução está detalhada na
> [documentação técnica](documentacao-tecnica.md).

## 1. Visão do produto

O AppyFlow é um sistema open source, self-hosted e single-user para descobrir
oportunidades de emprego, avaliar compatibilidade e preparar candidaturas com
currículos adaptados à vaga.

Cada instalação pertence a uma única pessoa. Não existe cadastro público,
organização, equipe, cobrança ou administração de múltiplos usuários.

O objetivo é reduzir o trabalho repetitivo da busca por vagas sem retirar do
usuário o controle sobre suas informações profissionais e candidaturas.

## 2. Público e contexto de uso

O usuário principal é uma pessoa que:

- mantém a própria instalação do AppyFlow;
- possui um currículo mestre e fatos profissionais verificáveis;
- deseja encontrar vagas alinhadas ao seu perfil;
- utiliza suas próprias chaves de provedores de IA e pesquisa;
- revisa as oportunidades e decide quando se candidatar;
- precisa gerar currículos em português ou inglês sem inventar experiências.

## 3. Princípios funcionais

### Controle do usuário

- somente o usuário principal acessa a instalação;
- nenhuma candidatura é enviada automaticamente;
- o usuário pode revisar scores, gaps e conteúdo gerado;
- o idioma sugerido pode ser alterado antes da geração do currículo;
- buscas automáticas podem ser ativadas, desativadas e limitadas.

### Fidelidade profissional

- todo conteúdo de currículo deriva de fatos conhecidos;
- empresas, cargos, datas, métricas e tecnologias não podem ser inventados;
- traduções podem mudar a redação, mas não o fato representado;
- cada versão gerada é rastreável à vaga e aos fatos utilizados.

### Explicabilidade

- Match Score significa aderência, não probabilidade de contratação;
- o usuário deve entender fatores positivos, gaps e dados ausentes;
- fontes e links originais das vagas permanecem visíveis;
- decisões automáticas importantes registram sua versão e justificativa.

### Economia e portabilidade

- filtros determinísticos antecedem chamadas de IA;
- resultados e análises reutilizáveis são persistidos;
- qualquer chave externa é fornecida pelo dono da instalação;
- o produto funciona localmente, com Docker e no Render.

## 4. Jornada principal

```text
Configurar a instalação
  -> entrar com o usuário principal
  -> enviar currículo mestre
  -> revisar perfil e fatos profissionais
  -> informar preferências de trabalho
  -> gerar e executar pesquisas
  -> revisar oportunidades classificadas
  -> mover vagas pelo pipeline
  -> preparar candidatura
  -> confirmar idioma
  -> revisar currículo adaptado
  -> baixar .tex e PDF
  -> registrar aplicação e acompanhar histórico
```

## 5. Capacidades funcionais

### 5.1 Acesso à instalação

Na primeira configuração, o proprietário define o único usuário da instalação.
Depois disso, não há cadastro público. O usuário pode entrar, sair, encerrar
sessões e recuperar o acesso por procedimento administrativo local.

### 5.2 Currículo mestre

O usuário envia um currículo que serve como fonte do perfil. O sistema valida o
arquivo, preserva seu histórico e extrai texto para revisão. Um novo upload não
apaga silenciosamente versões anteriores.

### 5.3 Perfil e fatos profissionais

O sistema organiza informações como:

- experiências, cargos, empresas e períodos;
- projetos e resultados;
- skills, tecnologias e idiomas;
- educação, cursos e certificações;
- senioridade, localização e modalidade de trabalho;
- métricas e outras afirmações verificáveis.

Informações extraídas por IA podem ser revisadas. Um fato estruturado é a fonte
estável; os textos em português e inglês são representações desse mesmo fato.

### 5.4 Preferências profissionais

O usuário define cargos desejados, senioridade, trabalho remoto ou presencial,
locais aceitos, idiomas, tecnologias, faixa salarial e exclusões. Preferências
ausentes são desconhecidas, não bloqueios automáticos.

### 5.5 Descoberta de vagas

As pesquisas partem do perfil e das preferências, não de uma lista fixa de
portais. O sistema gera consultas relevantes e pode encontrar ATSs, páginas de
carreira, agregadores e portais especializados.

A descoberta equilibra fontes já úteis com exploração de novas fontes. Esse
equilíbrio será configurável e evoluirá com o histórico da instalação.

### 5.6 Qualidade das fontes

Cada fonte desenvolve um Source Score explicável com sinais como quantidade e
recência de vagas, relevância histórica, completude, URLs estáveis, duplicação e
spam. A opinião de um LLM nunca é o único critério.

O usuário poderá consultar, priorizar ou bloquear fontes em uma etapa futura.

### 5.7 Normalização e deduplicação

Resultados de formatos diferentes são convertidos para um modelo comum. Quando
a mesma oportunidade aparece em mais de um lugar, o sistema mantém uma única
vaga, mas preserva todas as ocorrências e links de origem.

A deduplicação considera URL, domínio, empresa, cargo, localização, descrição e
fingerprint. Nenhum campo isolado decide todos os casos.

### 5.8 Matching

Cada oportunidade pode ser comparada ao perfil por:

- skills obrigatórias e desejáveis;
- experiência e senioridade;
- localização e modalidade;
- idioma e área de atuação;
- tecnologias e preferências;
- salário disponível e recência.

O resultado contém score, classificação, pontos fortes, gaps e explicação. Dados
ausentes aparecem como desconhecidos. As classes iniciais são quente, morna e
fria; seus limites serão definidos e testados na etapa de matching.

### 5.9 Dashboard e página da vaga

O dashboard permite encontrar vagas novas e filtrá-las por classificação,
pipeline e critérios relevantes. A página da vaga apresenta descrição, origem,
link externo, data, análise de compatibilidade e ações disponíveis.

### 5.10 Pipeline de candidaturas

Uma vaga funciona como lead e pode percorrer os estados:

```text
encontrada -> interessante -> currículo preparado -> aplicada
           -> entrevista -> oferta
           -> rejeitada
           -> arquivada
```

Transições relevantes mantêm histórico. O sistema não presume que gerar um
currículo significa que a candidatura foi enviada.

### 5.11 Preparar candidatura

Ao solicitar uma preparação, o sistema combina vaga, perfil, currículo mestre,
fatos profissionais e idioma alvo. A IA pode reorganizar e melhorar a redação,
selecionar experiências e incorporar palavras-chave sustentadas pelos fatos.

A IA não pode inventar informações nem aumentar experiência artificialmente.
Conteúdo sem evidência deve ser bloqueado ou enviado para revisão.

### 5.12 Idioma da candidatura

O sistema oferece `pt-BR` e `en`. A sugestão inicial considera o idioma da
descrição e do título, país, indicação explícita e preferência configurada.
Quando o resultado for ambíguo, prevalece a preferência do usuário.

Antes de gerar, o usuário sempre pode escolher Português ou Inglês manualmente.
O idioma da interface, inicialmente PT-BR, é independente do currículo.

### 5.13 Currículo e PDF

Após validar o conteúdo estruturado, o sistema seleciona o template oficial do
idioma, renderiza o `.tex` deterministicamente e compila o PDF. O usuário recebe
os dois arquivos e pode consultar versões anteriores.

Os templates PT-BR e EN são independentes e constituem a fonte de verdade
visual. Um não será produzido pela tradução automática do outro.

### 5.14 Busca diária

O usuário poderá habilitar uma busca diária, escolher horário e configurar
limites. Cada execução registra status, quantidade de resultados e falhas úteis,
sem expor credenciais ou conteúdo pessoal desnecessário.

## 6. Regras de negócio essenciais

1. Só pode existir um usuário principal ativo por instalação.
2. Não existe cadastro público.
3. Chaves de providers nunca são enviadas ao navegador.
4. Toda afirmação de currículo gerado precisa de sustentação factual.
5. Match Score não pode ser apresentado como chance de contratação.
6. Uma vaga deduplicada pode conservar várias origens.
7. Uma falha em um resultado não invalida toda a execução de busca.
8. Geração repetida cria histórico; não sobrescreve versões anteriores.
9. O override manual de idioma prevalece sobre a detecção automática.
10. Seções vazias não aparecem no currículo final.
11. O LLM não gera o documento LaTeX completo.
12. O sistema não envia candidaturas automaticamente.

## 7. Estados e informações visíveis

### Classificação de oportunidade

- quente: forte aderência segundo os critérios configurados;
- morna: aderência parcial ou informação insuficiente relevante;
- fria: incompatibilidades claras ou baixa aderência.

### Estado de processamento

- pendente;
- em execução;
- concluído;
- parcialmente concluído;
- falhou.

Erros apresentados ao usuário explicam a próxima ação possível sem revelar
secrets, stack traces ou dados internos desnecessários.

## 8. Histórico e rastreabilidade

O sistema deve conservar:

- uploads do currículo mestre;
- fatos e revisões relevantes do perfil;
- queries e execuções de busca;
- origens em que cada vaga foi encontrada;
- versões e componentes do matching;
- mudanças no pipeline;
- idioma e template de cada currículo;
- conteúdo estruturado, `.tex`, PDF e timestamps de cada versão.

A política exata de retenção e exclusão será definida antes de dados reais serem
armazenados em produção.

## 9. Critérios funcionais de segurança

- acesso privado por sessão;
- senha armazenada somente como hash seguro;
- uploads limitados e validados;
- mensagens de autenticação não revelam detalhes da conta;
- segredos são configurados apenas no backend;
- logs evitam currículo, senha, cookies, tokens e API keys;
- ações sensíveis exigem validação server-side;
- links e conteúdo descobertos na web são tratados como não confiáveis.

## 10. Fora do escopo

- SaaS multiusuário;
- cadastro público;
- organizações, equipes e convites;
- billing e assinaturas;
- RBAC complexo;
- envio automático de candidaturas;
- promessa de contratação baseada no score;
- geração livre de LaTeX por IA;
- dependência exclusiva de LinkedIn, Gupy, Indeed ou qualquer site fixo.

## 11. Critérios funcionais por etapa

Uma etapa só é concluída quando:

- o recorte previsto funciona sem antecipar funcionalidades futuras;
- regras relevantes possuem testes proporcionais ao risco;
- lint, typecheck, testes e build aplicáveis passam;
- limitações e validações manuais são documentadas;
- nenhuma alteração é commitada ou enviada automaticamente.

Os fluxos críticos que deverão chegar a cobertura E2E são login, upload,
perfil, descoberta, pipeline, preparação, seleção de idioma e geração de `.tex`
e PDF nos dois idiomas.

## 12. Roadmap funcional resumido

1. fundação: arquitetura, bootstrap, banco, autenticação e providers;
2. conhecimento do candidato: currículo mestre, perfil, fatos e preferências;
3. descoberta: queries, busca, normalização, deduplicação e fontes;
4. avaliação: filtros, matching determinístico e análise assistida por IA;
5. operação: dashboard, vaga e pipeline;
6. candidatura: conteúdo estruturado, templates PT-BR/EN, `.tex` e PDF;
7. automação: histórico, scheduler, busca diária e segundo provider;
8. entrega: Render, hardening, E2E e documentação final.

## 13. Questões funcionais ainda abertas

- formatos aceitos no primeiro upload de currículo;
- limites padrão de busca e orçamento de providers;
- pesos e limites das classes de matching;
- política de confirmação e revisão de fatos extraídos;
- retenção e exclusão de dados e artefatos;
- experiência de recuperação do usuário principal;
- momento em que candidaturas arquivadas deixam as visões padrão.

Essas decisões serão tomadas quando afetarem comportamento implementável,
evitando especificação prematura.
