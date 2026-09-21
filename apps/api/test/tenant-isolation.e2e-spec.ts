import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { TenantContextService } from '../src/infra/prisma/tenant-context.service';
import { tenantScopedExtension } from '../src/infra/prisma/tenant-scoped.extension';

/**
 * Teste de integração de verdade — precisa de Postgres rodando com o
 * schema aplicado (ver README.md da raiz). É o teste mais importante do
 * projeto: valida a promessa central da Etapa 1 (ARCHITECTURE.md, seção
 * 1 — "isolamento de tenant é absoluto") na camada que realmente
 * intercepta as queries, não um mock de repositório que passa por
 * construção.
 *
 * Rodar com: DATABASE_URL apontando pro banco (local ou de teste), depois
 * `npm run test:e2e -- tenant-isolation`.
 */
describe('Isolamento de tenant (Prisma Client Extension)', () => {
  const tenantContext = new TenantContextService();
  const base = new PrismaClient();
  const client = base.$extends(tenantScopedExtension(tenantContext));

  let tenantAId: string;
  let tenantBId: string;
  let studentInTenantAId: string;

  beforeAll(async () => {
    const tenantA = await base.tenant.create({ data: { name: `Tenant A ${randomUUID()}` } });
    const tenantB = await base.tenant.create({ data: { name: `Tenant B ${randomUUID()}` } });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    const studentA = await base.student.create({
      data: {
        tenantId: tenantAId,
        name: 'Aluno do Tenant A',
        gender: 'MALE',
        birthDate: new Date('1990-01-01'),
        status: 'ACTIVE',
      },
    });
    studentInTenantAId = studentA.id;

    await base.student.create({
      data: {
        tenantId: tenantBId,
        name: 'Aluno do Tenant B',
        gender: 'FEMALE',
        birthDate: new Date('1992-01-01'),
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    await base.student.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await base.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await base.$disconnect();
  });

  it('não retorna aluno de outro tenant numa listagem, mesmo sem where manual no código', async () => {
    await tenantContext.run(
      { userId: 'test-user', tenantId: tenantAId, role: 'PERSONAL_TRAINER', isPlatformAdmin: false },
      async () => {
        const students = await client.student.findMany({});
        expect(students.length).toBeGreaterThan(0);
        expect(students.every((s) => s.tenantId === tenantAId)).toBe(true);
        expect(students.some((s) => s.tenantId === tenantBId)).toBe(false);
      },
    );
  });

  it('não retorna aluno de outro tenant nem buscando por id direto', async () => {
    await tenantContext.run(
      { userId: 'test-user', tenantId: tenantBId, role: 'PERSONAL_TRAINER', isPlatformAdmin: false },
      async () => {
        const student = await client.student.findFirst({ where: { id: studentInTenantAId } });
        expect(student).toBeNull();
      },
    );
  });

  it('catálogo híbrido (Exercise) mostra itens globais mesmo dentro de um contexto de tenant', async () => {
    const globalExercise = await base.exercise.create({
      data: { tenantId: null, name: `Exercício global ${randomUUID()}`, muscleGroup: 'CHEST', equipment: [] },
    });

    try {
      await tenantContext.run(
        { userId: 'test-user', tenantId: tenantAId, role: 'PERSONAL_TRAINER', isPlatformAdmin: false },
        async () => {
          const found = await client.exercise.findFirst({ where: { id: globalExercise.id } });
          expect(found).not.toBeNull();
        },
      );
    } finally {
      await base.exercise.delete({ where: { id: globalExercise.id } });
    }
  });
});
