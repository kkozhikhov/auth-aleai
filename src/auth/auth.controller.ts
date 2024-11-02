import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { SignInUserDto } from './dtos/sign-in-user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @Serialize(UserDto)
  @Post('/signup')
  async signup(@Body() body: CreateUserDto) {
    return this.authService.signup(body);
  }

  @Post('/signin')
  async signin(@Body() body: SignInUserDto) {
    return this.authService.signin(body);
  }

  @Serialize(UserDto)
  @UseGuards(AuthGuard)
  @Get('/self')
  getUserProfile(@Request() req) {
    return this.userService.findByUsername(req.user?.username);
  }
}
