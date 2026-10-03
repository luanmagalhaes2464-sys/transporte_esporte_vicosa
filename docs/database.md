# Banco de dados

PostgreSQL no Neon, acessado via Prisma.

Os principais domínios são:

- identidade: `persons`, `users`, `roles`, `permissions`;
- cidadão/aluno: `students`, `guardians`, `student_guardians`, `addresses`;
- território: `municipalities`, `districts`, `neighborhoods`, `rural_localities`, `streets`, `location_aliases`;
- transporte escolar: períodos, solicitações e histórico;
- extraclasse/frota: solicitações, viagens, veículos, motoristas e atribuições;
- esporte: modalidades, atividades, inscrições, transporte e lista de espera;
- infraestrutura: documentos, notificações, auditoria, cache de CEP/geocodificação e configurações.

UUID é utilizado nas entidades principais. Protocolos visíveis ao cidadão são gerados por contador transacional separado.
