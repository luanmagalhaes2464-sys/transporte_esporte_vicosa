const labels: Record<string,string> = {
  DRAFT: "Rascunho", SCHEDULED: "Agendado", OPEN: "Aberto", CLOSED: "Encerrado", CANCELED: "Cancelado", COMPLETED: "Realizado",
  SUBMITTED: "Enviado", UNDER_REVIEW: "Em análise", PENDING: "Pendência", APPROVED: "Aprovado", DENIED: "Indeferido", ROUTE_DEFINED: "Rota definida", ACTIVE: "Ativo",
  REQUESTED: "Solicitado", VEHICLE_DEFINED: "Veículo definido", DRIVER_DEFINED: "Motorista definido", DRIVER_CONFIRMED: "Confirmado pelo motorista",
  AVAILABLE: "Disponível", ON_TRIP: "Em viagem", MAINTENANCE: "Manutenção", UNAVAILABLE: "Indisponível",
  PLANNED: "Planejada", CONFIRMED: "Confirmada", IN_PROGRESS: "Em andamento",
  WAITING: "Lista de espera", CALLED: "Convocado", EXPIRED: "Prazo expirado",
  URBAN: "Urbano", RURAL: "Rural", DISTRICT: "Distrito", COMMUNITY: "Comunidade", OTHER: "Outro",
  CREATE: "Criação", UPDATE: "Alteração", STATUS_CHANGE: "Mudança de status", ASSIGN: "Atribuição", MERGE: "Mesclagem", VIEW_DOCUMENT: "Visualização de documento", READ: "Consulta", DELETE: "Exclusão"
};
export function statusLabel(value: string | null | undefined) { return value ? (labels[value] ?? value) : "—"; }
