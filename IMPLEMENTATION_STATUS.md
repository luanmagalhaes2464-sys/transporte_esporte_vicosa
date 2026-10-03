# Status de implementação

## Implementado na base

- Next.js + TypeScript + React App Router, layout institucional responsivo e mobile-first.
- Prisma/PostgreSQL com UUID, migration inicial e seed exclusivamente fictício.
- Cadastro único, CPF validado, fluxo para menores/responsáveis, sessão assinada com Argon2 e RBAC no backend.
- Território padronizado por IDs: município, bairros, ruas, distritos, localidades rurais e aliases; busca normalizada, CRUD, desativação, mesclagem de bairros e importação CSV/XLSX com pré-validação.
- `CepProvider` com ViaCEP/BrasilAPI e adapter Correios preparado; cache e continuidade do cadastro em falha externa.
- `GeocodingProvider` com Nominatim/Google opcional, cache e mapa Leaflet/OpenStreetMap com marcador escolhido pelo usuário.
- Transporte escolar com períodos, escolas participantes, documentos obrigatórios, protocolo, histórico, análise e mapa de demanda.
- Transporte extraclasse com solicitação por escola, workflow, viagens, frota, motoristas, calendário e bloqueio de conflitos.
- Área mobile do motorista com confirmar/iniciar/finalizar viagem.
- Esporte com modalidades dinâmicas, atividades, horários, vagas transacionais, dependentes, pontos de embarque, transporte, protocolos e lista de espera/convocação.
- Notificações internas visíveis no portal e provider de e-mail (Resend/SMTP).
- Storage privado por provider S3 compatível, com URLs temporárias e autorização de download.
- Auditoria consultável com filtragem de campos sensíveis.
- Relatórios e exportações CSV/XLSX/PDF.
- Health check, GitHub Actions e Blueprint Render.
- Páginas institucionais de acessibilidade, privacidade, termos, contato e ajuda.
- Testes unitários para CPF, normalização territorial, conflito temporal, protocolo e transições de transporte.

## Validação executada neste ambiente

A varredura de sintaxe TypeScript não encontrou erros de parsing. A instalação de dependências não pôde ser concluída neste ambiente porque o acesso ao registry do npm está indisponível; por isso o `next build`, Prisma Client e a suíte Vitest completa devem ser executados pelo CI assim que o código estiver no GitHub.

## Dependências externas para produção

1. Repositório GitHub `transporte_esporte_vicosa` criado na conta pessoal do usuário — o conector disponível nesta conversa não possui a ação de criar repositório.
2. Projeto/branch Neon e URLs reais (`DATABASE_URL` e `DIRECT_URL`).
3. Fotografia panorâmica oficial fornecida em arquivo utilizável para `public/brand/vicosa-panorama.jpg`; o brasão oficial já está em `public/brand/brasao-vicosa.png`.
4. Storage privado de produção (S3 compatível) para documentos.
5. Provider de e-mail, caso a Prefeitura queira envio externo além das notificações internas.
6. Execução do CI (`typecheck`, testes e build) com dependências baixadas.

Nenhuma credencial real é versionada.
