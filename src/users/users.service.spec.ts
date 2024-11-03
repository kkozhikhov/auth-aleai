import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { CreateUserDto } from 'src/auth/dtos/create-user.dto';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { users } from 'src/drizzle/schema';

describe('UsersService', () => {
  let usersService: UsersService;

  const user = {
    id: 1,
    username: 'jdoe',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockDrizzleDB = {
    query: {
      users: {
        findFirst: jest.fn() as jest.Mock,
      },
    },
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([user]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE,
          useValue: mockDrizzleDB,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('findByUsername', () => {
    it('should return a user when found', async () => {
      mockDrizzleDB.query.users.findFirst.mockResolvedValue(user);

      const result = await usersService.findByUsername('jdoe');

      expect(mockDrizzleDB.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });

      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      mockDrizzleDB.query.users.findFirst.mockResolvedValue(null);

      const result = await usersService.findByUsername('unknown');

      expect(mockDrizzleDB.query.users.findFirst).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a user and return it', async () => {
      const createUserDto: CreateUserDto = {
        username: 'jdoe',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await usersService.create(createUserDto);

      expect(result).toEqual([user]);

      expect(mockDrizzleDB.insert).toHaveBeenCalledWith(users);
      expect(mockDrizzleDB.values).toHaveBeenCalledWith(createUserDto);
      expect(mockDrizzleDB.returning).toHaveBeenCalled();
    });
  });
});
