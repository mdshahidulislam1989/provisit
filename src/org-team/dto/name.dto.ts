import {IsNotEmpty} from 'class-validator';

export class NameDto {
  @IsNotEmpty()
  name: string;
}
