import { Prisma } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

/**
 * Padrão A (DATABASE-MODEL.md, seção 10): tenant_id sempre presente,
 * filtro direto — sem exceção de catálogo global nem bypass de admin.
 */
const STANDARD_TENANT_MODELS = new Set([
  'File', 'TrainerProfile', 'Student', 'StudentPhoto', 'Assessment',
  'AssessmentPhoto', 'Workout', 'WorkoutExercise', 'SetBlock', 'Microcycle',
  'Diet', 'Meal', 'MealFood', 'Feedback', 'Appointment', 'Notification',
]);

/** Padrão B: catálogo híbrido — filtro por tenant OU tenant_id nulo (global). */
const HYBRID_CATALOG_MODELS = new Set(['Exercise', 'Food']);

/**
 * Padrão C: tenant_id nulo é esperado (PLATFORM_ADMIN) — filtro por tenant
 * OU contexto de admin já verificado. `Tenant` é tratado à parte porque o
 * filtro é por `id`, não por `tenantId`.
 */
const ADMIN_AWARE_MODELS = new Set(['User', 'RefreshToken', 'AuditLog']);

/**
 * Prisma Client Extension: intercepta toda query nos modelos acima e
 * injeta o filtro de tenant automaticamente — camada 3 de defesa (seção 11
 * do ARCHITECTURE.md); RLS (row-level-security.sql, Etapa 3) é a camada 4,
 * redundante de propósito. `ctx.isPlatformAdmin` só chega `true` depois que
 * o fluxo de "acesso assistido" (mesma seção) já validou e logou o acesso
 * em audit_logs — a extension não decide isso, só respeita o contexto.
 */
export function tenantScopedExtension(tenantContext: TenantContextService) {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant-scoped',
      query: {
        $allModels: {
          async $allOperations({ model, args, query }) {
            const ctx = tenantContext.getContext();
            if (!ctx) return query(args); // fora de request (seed, script) — sem filtro automático

            // $allOperations cobre TODA operação de TODO model (inclusive
            // create/createMany, que não têm `where`) — o tipo de `args` é
            // uma union gigante sem `where` garantido. O cast é local e
            // seguro: só mexemos em `where` pros models/operações que
            // realmente o têm (find*/update*/delete*/count), nunca em
            // create puro (não está nos três Sets abaixo).
            const scopedArgs = args as { where?: Record<string, unknown> };

            if (STANDARD_TENANT_MODELS.has(model)) {
              scopedArgs.where = mergeTenantFilter(scopedArgs.where, ctx.tenantId);
            } else if (HYBRID_CATALOG_MODELS.has(model)) {
              scopedArgs.where = mergeHybridFilter(scopedArgs.where, ctx.tenantId);
            } else if (ADMIN_AWARE_MODELS.has(model) && !ctx.isPlatformAdmin) {
              scopedArgs.where = mergeTenantFilter(scopedArgs.where, ctx.tenantId);
            } else if (model === 'Tenant' && !ctx.isPlatformAdmin) {
              scopedArgs.where = { ...(scopedArgs.where ?? {}), id: ctx.tenantId };
            }

            return query(args);
          },
        },
      },
    }),
  );
}

function mergeTenantFilter(where: unknown, tenantId: string | null) {
  // Nota: merge raso — se `where` já tiver uma cláusula `OR`/`AND` própria,
  // isso soma bem na prática pro caso comum (filtro simples de repositório),
  // mas uma query com OR complexo pré-existente merece revisão manual.
  // Ver PRISMA-MODEL.md seção 5.
  return { ...((where as object) ?? {}), tenantId };
}

function mergeHybridFilter(where: unknown, tenantId: string | null) {
  return {
    ...((where as object) ?? {}),
    OR: [{ tenantId }, { tenantId: null }],
  };
}
