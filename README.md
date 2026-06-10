# RotaLivre - Plataforma de Acessibilidade Urbana

O RotaLivre e um sistema para registro e acompanhamento de solicitacoes relacionadas a acessibilidade urbana. A proposta atende ao desafio da AEP 2026.1: aproximar cidadaos e prefeitura, aumentar transparencia e organizar a fila de atendimento de problemas urbanos.

## Funcionalidades

- Cadastro de solicitacao com categoria, descricao, localizacao e prioridade.
- Envio identificado ou anonimo.
- Geracao de protocolo.
- Consulta publica por protocolo.
- Status: aberto, triagem, em execucao, resolvido e encerrado.
- Historico de movimentacoes com data, responsavel e comentario.
- Painel da prefeitura com filtros por bairro, categoria e prioridade.
- Atualizacao de status com comentario obrigatorio.

## Estrutura Tecnica

- `model`: classes de dominio, como `Solicitacao`, `Usuario`, `HistoricoStatus`, `Prioridade` e `Status`.
- `repository`: contrato e implementacao em memoria.
- `service`: regras de negocio e validacoes.
- `controller`: endpoints REST usados pelo front.
- `resources/static`: interface web em HTML, CSS e JavaScript.
- `ui`: versao antiga em terminal, mantida como referencia da beta.

## Como executar

Pre-requisitos:

- JDK 17 ou superior.
- Maven ou Maven Wrapper do projeto.

Com Maven Wrapper:

```bash
./mvnw spring-boot:run
```

No Windows:

```bash
.\mvnw.cmd spring-boot:run
```

Depois acesse:

```text
http://localhost:8080
```

## Endpoints principais

- `POST /api/solicitacoes`: cria uma nova solicitacao.
- `GET /api/solicitacoes`: lista demandas, com filtros opcionais `bairro`, `categoria` e `prioridade`.
- `GET /api/solicitacoes/{protocolo}`: consulta uma solicitacao.
- `PATCH /api/solicitacoes/{protocolo}/status`: atualiza o status com responsavel e comentario.

## Academicos

- Heloisa Sayuri Silva Saito - RA: 24062631-2
- Maria Eduarda de Castro Lachimia - RA: 24055202-2
- Matheus Costa E Silva - RA: 24000729-2
