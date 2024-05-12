import {IsEmail, IsNotEmpty, IsOptional} from 'class-validator';

export class UpdateProfileDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsOptional()
  dialCode: string;

  @IsNotEmpty()
  @IsOptional()
  phone: string;

  @IsNotEmpty()
  @IsOptional()
  address: string;
}
