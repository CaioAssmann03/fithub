// CORREÇÃO (descoberta ao rodar `npm run start:dev` pela primeira vez):
// precisa ser o primeiro import do arquivo. Todo módulo (Auth, Students,
// Tenancy, Admin, Notifications...) lê `process.env.JWT_SECRET` direto
// no argumento do `@Module({...})`, avaliado no momento em que o arquivo
// é importado — ou seja, antes de qualquer código dentro de bootstrap()
// rodar. Nada no projeto carregava `.env` pra dentro de `process.env`
// (Prisma carrega `.env` sozinho pro Prisma Client, mas isso não afeta
// `process.env` do resto da aplicação) — então JWT_SECRET, PORT,
// REDIS_URL e CORS_ORIGIN nunca vinham do `.env`, só de variável de
// ambiente do shell (nenhuma). Import de efeito colateral, precisa vir
// antes de `./app.module` (e de qualquer import transitivo que leia
// process.env na avaliação do módulo).
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // /health fica fora do prefixo versionado de propósito — load balancer e
  // orquestrador de container não deveriam precisar saber a versão da API
  // só pra checar se ela está viva (seção 15 do ARCHITECTURE.md).
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(helmet());

  // CORS_ORIGIN não definido = reflete qualquer origem — aceitável só em
  // dev local. Em produção, definir a lista real (separada por vírgula) é
  // obrigatório; nunca `*` com credenciais (seção 14 do ARCHITECTURE.md).
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({ origin: corsOrigin ? corsOrigin.split(',') : true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`FitHub API rodando em http://localhost:${port}/api/v1`);
}
bootstrap();
