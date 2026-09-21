import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { PeriodizationModule } from './modules/periodization/periodization.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { FoodsModule } from './modules/foods/foods.module';
import { DietsModule } from './modules/diets/diets.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { TenantContextMiddleware } from './shared/middleware/tenant-context.middleware';
import { TokenService } from './infra/security/token.service';
import { TenantContextService } from './infra/prisma/tenant-context.service';

/**
 * NOTA HONESTA (ver BACKEND-AUTH.md, seção 6, e BACKEND-STUDENTS.md):
 * PrismaService, TenantContextService, TransactionContextService e
 * TokenService estão registrados de novo em CADA módulo (Auth, Students,
 * Assessments, Workouts, Dashboard) porque cada sub-etapa foi construída
 * standalone. Isso FUNCIONA — NestJS não reclama de providers "iguais"
 * em módulos diferentes, cada módulo só recebe sua própria instância —
 * mas o custo real é N PrismaClients diferentes conectando ao banco
 * (um por módulo) em vez de um só. Antes de produção, isso deveria
 * migrar pra um InfraModule único com @Global() e providers
 * compartilhados. Registrado aqui como débito técnico explícito, não
 * escondido.
 */
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]), // limite global — /auth/* tem limite mais agressivo, ver auth.controller.ts
    JwtModule.register({ secret: process.env.JWT_SECRET }), // só pro TenantContextMiddleware abaixo — ver nota da correção
    AuthModule,
    StudentsModule,
    AssessmentsModule,
    WorkoutsModule,
    PeriodizationModule,
    ExercisesModule,
    FeedbackModule,
    AppointmentsModule,
    FoodsModule,
    DietsModule,
    TenancyModule,
    AdminModule,
    NotificationsModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // CORREÇÃO (descoberta rodando a API pela primeira vez — nenhum
    // módulo declarava isto): consumer.apply(TenantContextMiddleware)
    // exige que a classe seja resolvível pelo container de DI do módulo
    // onde configure() roda (aqui, AppModule). TenantContextMiddleware
    // não é um Controller nem é importado por nenhum outro módulo, então
    // sem este registro explícito o bootstrap falha com "Nest can't
    // resolve dependencies of TenantContextMiddleware".
    TenantContextMiddleware,
    TokenService,
    TenantContextService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // CORREÇÃO (descoberta testando /auth/register manualmente — dava 401
    // "Token ausente" numa rota que deveria ser pública): main.ts aplica
    // setGlobalPrefix('api/v1') a TODAS as rotas de controller, e o Nest
    // já soma esse prefixo por conta própria tanto em forRoutes('*')
    // quanto em exclude() antes de comparar com o path recebido (dá pra
    // confirmar isso pelo aviso "[LegacyRouteConverter] Unsupported route
    // path: /api/v1/*" no boot — é o forRoutes('*') já com o prefixo
    // aplicado). Escrever 'api/v1/auth/register' aqui somava o prefixo
    // DUAS vezes, então o exclude nunca batia com o path real da
    // requisição e o middleware rodava em cima das três rotas públicas de
    // auth também. Os paths abaixo são relativos ao controller, sem
    // prefixo — igual a como os Controllers já declaram suas rotas.
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
