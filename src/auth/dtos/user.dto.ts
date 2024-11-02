import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  readonly id: string;

  @Expose()
  readonly username: string;

  @Expose()
  readonly firstName: string;

  @Expose()
  readonly lastName: string;
}
