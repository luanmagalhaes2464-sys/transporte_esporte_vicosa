import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function jsonError(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

const known: Record<string, { message: string; status: number }> = {
  INVALID_CEP: { message: "CEP inválido.", status: 422 },
  CEP_NOT_FOUND: { message: "CEP não encontrado.", status: 404 },
  GEOCODING_PROVIDER_ERROR: { message: "Não foi possível pesquisar o endereço no mapa neste momento.", status: 503 },
  GOOGLE_GEOCODING_NOT_CONFIGURED: { message: "O provedor de mapas selecionado ainda não foi configurado.", status: 503 },
  INVALID_CPF: { message: "CPF inválido.", status: 422 },
  INVALID_PERIOD: { message: "O período informado é inválido.", status: 422 },
  EXTRA_REQUEST_MINIMUM_NOTICE: { message: "A solicitação deve ser enviada com antecedência mínima de 7 dias.", status: 422 },
  EXTRA_REQUEST_OUTSIDE_ALLOWED_WINDOW: { message: "Os horários devem respeitar o turno: manhã de 07h30 a 10h30 ou tarde de 13h30 a 15h30.", status: 422 },
  EXTRA_REQUEST_OTHER_REQUIRED: { message: "Especifique o tipo da atividade.", status: 422 },
  EXTRA_REQUEST_CANCELLATION_NOTICE: { message: "O cancelamento pela escola deve ser comunicado com antecedência mínima de 48 horas.", status: 409 },
  PERIOD_CLOSED: { message: "O período de solicitações não está aberto.", status: 409 },
  INVALID_STATUS_TRANSITION: { message: "Esta mudança de status não é permitida.", status: 409 },
  STUDENT_NOT_OWNED: { message: "O aluno informado não está vinculado à sua conta.", status: 403 },
  STUDENT_SCHOOL_REQUIRED: { message: "Cadastre a escola do aluno antes de solicitar o transporte.", status: 422 },
  STUDENT_SCHOOL_DATA_REQUIRED: { message: "Cadastre o ano/série e o turno do aluno antes de solicitar o transporte.", status: 422 },
  ADDRESS_REQUIRED: { message: "Cadastre seu endereço residencial antes de solicitar o transporte.", status: 422 },
  ADDRESS_NOT_OWNED: { message: "O endereço informado não está vinculado à sua conta.", status: 403 },
  SCHOOL_NOT_AVAILABLE: { message: "A escola informada não está disponível.", status: 422 },
  SCHOOL_NOT_IN_PERIOD: { message: "A escola informada não participa deste período de transporte.", status: 422 },
  REQUIRED_DOCUMENTS_MISSING: { message: "Anexe todos os documentos obrigatórios antes de enviar a solicitação.", status: 422 },
  DOCUMENT_REQUIREMENT_INVALID: { message: "O documento informado não corresponde a uma exigência deste período.", status: 422 },
  DOCUMENT_UPLOAD_CLOSED: { message: "Os anexos desta solicitação não podem mais ser alterados por este fluxo.", status: 409 },
  TRANSPORT_REQUEST_ALREADY_EXISTS: { message: "Já existe uma solicitação para este aluno neste período.", status: 409 },
  SCHOOL_SCOPE_FORBIDDEN: { message: "Você não possui permissão para solicitar em nome desta escola.", status: 403 },
  REGISTRATION_CLOSED: { message: "As inscrições desta atividade não estão abertas.", status: 409 },
  TRANSPORT_NOT_AVAILABLE: { message: "Esta atividade não oferece transporte.", status: 409 },
  TRANSPORT_FULL: { message: "As vagas do transporte estão esgotadas.", status: 409 },
  BOARDING_POINT_REQUIRED: { message: "Selecione um ponto de embarque.", status: 422 },
  BOARDING_POINT_INVALID: { message: "O ponto de embarque selecionado não pertence a esta atividade.", status: 422 },
  AGE_REQUIREMENT_NOT_MET: { message: "A idade cadastrada não atende aos requisitos desta atividade.", status: 422 },
  SPORTS_PARTICIPANT_FORBIDDEN: { message: "A pessoa selecionada não está vinculada à sua conta.", status: 403 },
  NEIGHBORHOOD_REQUIRED: { message: "Selecione um bairro da base municipal.", status: 422 },
  RURAL_LOCALITY_REQUIRED: { message: "Selecione uma localidade rural da base municipal.", status: 422 },
  TERRITORY_REFERENCE_INVALID: { message: "O endereço contém uma referência territorial inválida.", status: 422 },
  VEHICLE_CONFLICT: { message: "O veículo já está atribuído a outra viagem neste período.", status: 409 },
  DRIVER_CONFLICT: { message: "O motorista já está atribuído a outra viagem neste período.", status: 409 },
  DRIVER_LICENSE_EXPIRED: { message: "A CNH do motorista está vencida.", status: 409 },
  DRIVER_UNAVAILABLE: { message: "O motorista está indisponível ou a CNH não cobre o período da viagem.", status: 409 },
  DRIVER_USER_NOT_FOUND: { message: "Não foi encontrada uma conta ativa com o e-mail informado para o motorista.", status: 422 },
  DRIVER_ALREADY_LINKED: { message: "Esta conta já está vinculada a um motorista.", status: 409 },
  VEHICLE_UNAVAILABLE: { message: "O veículo está indisponível.", status: 409 },
  VEHICLE_CAPACITY: { message: "A capacidade do veículo é insuficiente para esta viagem.", status: 409 },
  VEHICLE_CAPACITY_INSUFFICIENT: { message: "A capacidade do veículo é insuficiente para esta viagem.", status: 409 },
  NO_SPORTS_VACANCY: { message: "Não há vaga disponível para convocar a lista de espera.", status: 409 },
  WAITLIST_EMPTY: { message: "Não há ninguém aguardando na lista de espera.", status: 409 },
  SPORTS_TRANSPORT_CAPACITY_INVALID: { message: "As vagas de transporte não podem superar as vagas da atividade.", status: 422 }
};

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: "Revise os campos informados.",
      issues: error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message
      })),
      details: error.flatten()
    }, { status: 422 });
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Não autenticado.", 401);
  if (error instanceof Error && error.message === "FORBIDDEN") return jsonError("Sem permissão.", 403);
  if (error instanceof Error && known[error.message]) {
    const item = known[error.message];
    return jsonError(item.message, item.status, error.message);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return jsonError("Já existe um registro com estes dados.", 409, "DUPLICATE_RECORD");
  }
  console.error("route_error", { name: error instanceof Error ? error.name : "unknown" });
  return jsonError("Não foi possível concluir a operação.", 500);
}
