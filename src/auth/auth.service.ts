import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { SignInUserDto } from './dtos/sign-in-user.dto';
import { JwtService } from '@nestjs/jwt';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(userData: CreateUserDto) {
    const existedUser = await this.userService.findByUsername(
      userData.username,
    );
    if (existedUser) {
      throw new BadRequestException('Username already in use');
    }

    const hashedPassword = await this.hashPassword(userData.password);

    const [user] = await this.userService.create({
      ...userData,
      password: hashedPassword,
    });

    return user;
  }

  async signin({ username, password }: SignInUserDto) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('Password incorrect');
    }

    const payload = { sub: user.id, username: user.username };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    return `${salt}.${hash.toString('hex')}`;
  }
}
