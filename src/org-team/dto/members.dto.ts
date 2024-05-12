import {IsInt} from 'class-validator';

export class MembersDto {
  @IsInt({each: true})
  userIds: number[];
}
