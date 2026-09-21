import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/auth.decorators';

/**
 * A validação do token e a montagem do TenantContext já aconteceram no
 * TenantContextMiddleware, que roda antes na pipeline HTTP. Este Guard só
 * confirma que isso realmente aconteceu antes do handler — combina com
 * `@UseGuards(JwtAuthGuard, RolesGuard)` nos controllers protegidos.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('Requisição não autenticada');
    }
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(user?.role)) {
      throw new ForbiddenException('Papel insuficiente para esta ação');
    }
    return true;
  }
}
