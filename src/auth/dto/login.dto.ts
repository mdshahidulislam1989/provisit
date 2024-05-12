import {IsNotEmpty} from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  loginId: string;

  @IsNotEmpty()
  password: string;
}
