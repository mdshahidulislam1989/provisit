import {IsNotEmpty} from 'class-validator';

export class SaveDto {
  @IsNotEmpty()
  comment: string;
}
