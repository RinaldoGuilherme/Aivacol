import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserEntity } from '../../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Pick<Repository<UserEntity>, 'findOne'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;

  const dbUser = {
    id: 1,
    nickname: 'aivacol',
    name: 'Administrador do Sistema',
    email: 'admin@aivacol.com',
    password: 'hashed-password',
    role: { id: 1, value: 'ADMIN', name: 'Administrador' },
  } as unknown as UserEntity;

  beforeEach(() => {
    userRepository = { findOne: jest.fn() } as never;
    jwtService = { signAsync: jest.fn() } as never;
    service = new AuthService(
      userRepository as unknown as Repository<UserEntity>,
      jwtService as unknown as JwtService,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  describe('validateUser', () => {
    it('returns a sanitized user (without password) for valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(dbUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('admin@aivacol.com', '123456');

      expect(result).toEqual({
        id: 1,
        nickname: 'aivacol',
        name: 'Administrador do Sistema',
        email: 'admin@aivacol.com',
        role: { id: 1, value: 'ADMIN', name: 'Administrador' },
      });
      expect(result).not.toHaveProperty('password');
    });

    it('returns null when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      expect(await service.validateUser('ghost@x.com', 'x')).toBeNull();
    });

    it('returns null when the password does not match', async () => {
      userRepository.findOne.mockResolvedValue(dbUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      expect(await service.validateUser('admin@aivacol.com', 'wrong')).toBeNull();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for invalid credentials', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'admin@aivacol.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('issues a signed JWT and returns the user on success', async () => {
      userRepository.findOne.mockResolvedValue(dbUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jwtService.signAsync.mockResolvedValue('signed.jwt.token');

      const result = await service.login({
        email: 'admin@aivacol.com',
        password: '123456',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'admin@aivacol.com',
        role: 'ADMIN',
      });
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.email).toBe('admin@aivacol.com');
    });
  });
});
