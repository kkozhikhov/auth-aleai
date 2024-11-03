import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { SignInUserDto } from './dtos/sign-in-user.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userService: UsersService;
  let createUserDto: CreateUserDto;
  let signInUserDto: SignInUserDto;

  const mockUsersService = {
    findByUsername: jest.fn(),
  };

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockRedisService = {
    setValue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UsersService>(UsersService);

    createUserDto = {
      username: 'jdoe',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
    };

    signInUserDto = {
      username: 'jdoe',
      password: 'password',
    };
  });

  describe('signup', () => {
    it('should successfully sign up a user', async () => {
      const result = { id: 1, ...createUserDto };

      jest.spyOn(authService, 'signup').mockResolvedValue(result);

      expect(await authController.signup(createUserDto)).toEqual(result);
      expect(authService.signup).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw BadRequestException if username is already in use', async () => {
      jest
        .spyOn(authService, 'signup')
        .mockRejectedValue(new BadRequestException('Username already in use'));

      await expect(authController.signup(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.signup).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('signin', () => {
    it('should successfully sign in a user', async () => {
      const result = { accessToken: 'someToken' };

      jest.spyOn(authService, 'signin').mockResolvedValue(result);

      expect(await authController.signin(signInUserDto)).toEqual(result);
      expect(authService.signin).toHaveBeenCalledWith(signInUserDto);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest
        .spyOn(authService, 'signin')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(authController.signin(signInUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(authService.signin).toHaveBeenCalledWith(signInUserDto);
    });
  });

  describe('getUserProfile', () => {
    it('should return user', async () => {
      const req = { user: { username: 'jdoe' } };
      const result = { id: 1, ...createUserDto };

      jest.spyOn(userService, 'findByUsername').mockResolvedValue(result);

      expect(await authController.getUserProfile(req)).toEqual(result);
      expect(userService.findByUsername).toHaveBeenCalledWith(
        req.user.username,
      );
    });
  });
});
