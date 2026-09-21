import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Argon2id — vencedor do Password Hashing Competition (2015), resistente
 * a ataque por GPU/ASIC. Único ponto do sistema que sabe gerar ou
 * verificar hash de senha — o domínio (PasswordHash VO) só guarda o
 * resultado opaco, nunca chama Argon2 diretamente.
 */
@Injectable()
export class PasswordHasherService {
  async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, { type: argon2.argon2id });
  }

  async verify(hash: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hash, plainPassword);
  }
}
