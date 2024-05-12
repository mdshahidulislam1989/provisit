import {IsEmail, IsNotEmpty} from 'class-validator';

export class ForgotPasswordUpdateDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  newPassword: string;
}
