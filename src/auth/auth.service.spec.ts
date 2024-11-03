import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { SignInUserDto } from './dtos/sign-in-user.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let redisService: RedisService;

  let user;

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockRedisService = {
    setValue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);

    user = {
      id: 1,
      username: 'jdoe',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should throw BadRequestException if username already exists', async () => {
      jest.spyOn(usersService, 'findByUsername').mockResolvedValueOnce(user);

      await expect(service.signup(user)).rejects.toThrow(BadRequestException);
    });

    it('should create a new user and return it', async () => {
      const userData: CreateUserDto = {
        username: 'jdoe',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest.spyOn(usersService, 'findByUsername').mockResolvedValueOnce(null);
      jest
        .spyOn(usersService, 'create')
        .mockResolvedValueOnce([{ ...userData, id: 1 }]);

      const user = await service.signup(userData);

      expect(user).toEqual({ ...userData, id: 1 });
    });
  });

  describe('signin', () => {
    it('should throw NotFoundException if user not found', async () => {
      const signInData: SignInUserDto = {
        username: 'jdoe',
        password: 'password',
      };
      jest.spyOn(usersService, 'findByUsername').mockResolvedValueOnce(null);

      await expect(service.signin(signInData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      const signInData: SignInUserDto = {
        username: 'jdoe',
        password: 'incorrectPassword',
      };

      jest.spyOn(usersService, 'findByUsername').mockResolvedValueOnce(user);

      jest
        .spyOn(service as any, 'verifyPassword')
        .mockRejectedValueOnce(new BadRequestException('Password incorrect'));

      await expect(service.signin(signInData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return access token if sign in is successful', async () => {
      const signInData: SignInUserDto = {
        username: 'jdoe',
        password: 'password',
      };

      jest.spyOn(usersService, 'findByUsername').mockResolvedValueOnce(user);
      jest
        .spyOn(service as any, 'verifyPassword')
        .mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('accessToken');
      jest.spyOn(redisService, 'setValue').mockResolvedValueOnce(undefined);

      const result = await service.signin(signInData);

      expect(result).toEqual({ accessToken: 'accessToken' });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        username: user.username,
      });
      expect(redisService.setValue).toHaveBeenCalledWith(
        `token:${user.username}`,
        'accessToken',
      );
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const hashedPassword = await (service as any).hashPassword('password');

      expect(hashedPassword).toContain('.');
    });
  });

  describe('verifyPassword', () => {
    it('should throw BadRequestException if password is incorrect', async () => {
      const storedPassword = 'salt.storedHash';

      await expect(
        (service as any).verifyPassword('wrongPassword', storedPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not throw an exception if password is correct', async () => {
      const storedPassword = 'salt.storedHash';
      const verifyPasswordSpy = jest
        .spyOn(service as any, 'verifyPassword')
        .mockResolvedValueOnce(undefined);

      await expect(
        (service as any).verifyPassword('password', storedPassword),
      ).resolves.toBeUndefined();

      expect(verifyPasswordSpy).toHaveBeenCalled();
    });
  });
});
