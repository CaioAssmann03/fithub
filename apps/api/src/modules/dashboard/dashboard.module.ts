import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DashboardController } from './presentation/dashboard.controller';
import { StudentDashboardStatsHandler } from './application/event-handlers/student-dashboard-stats.handler';
import { RedisService } from '../../infra/cache/redis.service';
import { TokenService } from '../../infra/security/token.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [DashboardController],
  providers: [StudentDashboardStatsHandler, RedisService, TokenService],
})
export class DashboardModule {}
