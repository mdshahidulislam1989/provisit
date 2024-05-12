import {IsNotEmpty} from 'class-validator';

export class SaveDto {
  @IsNotEmpty()
  name: string;
}
