import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { JwtPayload } from '../interfaces/auth.interfaces';

/** Public user representation, never including the password hash. */
export interface SafeUser {
  id: number;
  nickname: string;
  name: string;
  email: string;
  role: {
    id: number;
    value: string;
    name: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates credentials. Returns the sanitized user on success or null on
   * failure. The caller decides the (generic) error response, so this method
   * never leaks whether the email or the password was the invalid part.
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { role: true },
    });

    if (!user) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return null;
    }

    return this.toSafeUser(user);
  }

  /** Validates credentials and issues a signed access token. */
  async login(dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.value,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
  }

  private toSafeUser(user: UserEntity): SafeUser {
    return {
      id: user.id,
      nickname: user.nickname,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        value: user.role.value,
        name: user.role.name,
      },
    };
  }
}
