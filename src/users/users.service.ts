import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/auth/dtos/create-user.dto';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { users } from 'src/drizzle/schema';
import { DrizzleDB } from 'src/drizzle/types/drizzle';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  findByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    });
  }

  create(data: CreateUserDto) {
    return this.db.insert(users).values(data).returning();
  }
}
