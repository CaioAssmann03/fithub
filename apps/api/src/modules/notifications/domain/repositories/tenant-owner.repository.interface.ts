/**
 * Porta mínima pra um problema específico: vários eventos que o
 * Notifications consome (StudentCreatedEvent, FeedbackSubmittedEvent)
 * carregam tenantId, mas não o userId de quem deveria ser notificado — o
 * destinatário natural é o dono do tenant (o personal). Em vez de
 * importar o repositório de Tenant de outro módulo (TenancyModule tem o
 * seu, com um shape diferente — só leitura do próprio tenant), este
 * módulo resolve essa única pergunta com a sua própria porta, do jeito
 * mais estreito possível.
 */
export interface ITenantOwnerRepository {
  findOwnerUserId(tenantId: string): Promise<string | null>;
}

export const TENANT_OWNER_REPOSITORY = Symbol('ITenantOwnerRepository');
