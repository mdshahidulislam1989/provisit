import {IsInt, IsNotEmpty} from 'class-validator';

export class CreateDto {
  @IsNotEmpty()
  name: string;

  @IsInt({each: true})
  userIds: number[];
}
