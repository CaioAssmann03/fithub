/**
 * Projeção de leitura cross-tenant pro painel do Platform Admin — não é
 * uma entidade de domínio própria (mesmo raciocínio do Dashboard, ver
 * DDD-MODEL.md seção 7: "não há ganho em modelar agregado onde não há
 * regra de negócio, só leitura"). O agregado `Tenant` de verdade (auto-
 * gestão do personal) vive em TenancyModule; este módulo nunca importa o
 * repositório de outro módulo (CLAUDE.md, regra 2) — tem o seu próprio,
 * com exatamente o shape que a listagem de Admin precisa.
 */
export interface AdminTenantSummary {
  id: string;
  name: string;
  plan: string;
  status: string;
  ownerUserId: string | null;
  createdAt: Date;
}

export interface IAdminTenantRepository {
  findAll(): Promise<AdminTenantSummary[]>;
  existsById(id: string): Promise<boolean>;
}

export const ADMIN_TENANT_REPOSITORY = Symbol('IAdminTenantRepository');
