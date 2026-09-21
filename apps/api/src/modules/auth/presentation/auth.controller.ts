import { Body, Controller, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { RegisterTrainerUseCase } from '../application/use-cases/register-trainer.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { RegisterTrainerDto, LoginDto, RefreshTokenDto } from '../application/dtos/auth.dtos';

/**
 * Rotas públicas de propósito — não fazem sentido atrás do
 * TenantContextMiddleware (que exige um JWT que ainda não existe nesse
 * ponto do fluxo). Endpoint versionado por convenção (`/api/v1/...`,
 * seção 15 do ARCHITECTURE.md) fica pro bootstrap do Nest na Etapa 5
 * completa (prefixo global), não repetido aqui em cada controller.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerTrainer: RegisterTrainerUseCase,
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshTokenUseCase,
  ) {}

  @Post('register')
  async registerHandler(@Body() dto: RegisterTrainerDto) {
    const result = await this.registerTrainer.execute(dto);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginHandler(@Body() dto: LoginDto) {
    const result = await this.login.execute(dto);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshHandler(@Body() dto: RefreshTokenDto) {
    const result = await this.refresh.execute(dto.refreshToken);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }
}
