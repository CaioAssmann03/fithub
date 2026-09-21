export type UserRole = 'PLATFORM_ADMIN' | 'PERSONAL_TRAINER' | 'STUDENT';

export interface AuthUser {
  sub: string;
  tenantId: string | null;
  role: UserRole;
  /** true só durante uma sessão de acesso assistido (módulo admin) — nunca em login normal. */
  assistedAccess?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
  /** obrigatório pra STUDENT (e-mail não é único globalmente); ausente pra PERSONAL_TRAINER/PLATFORM_ADMIN */
  tenantId?: string;
}

export interface RegisterTrainerInput {
  email: string;
  password: string;
  tenantName: string;
}

export interface RegisterTrainerResponse {
  userId: string;
  tenantId: string;
}

export interface DashboardStats {
  activeStudentCount: number;
}
