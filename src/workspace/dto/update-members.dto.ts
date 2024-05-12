import {IsInt} from 'class-validator';

export class UpdateMembersDto {
  @IsInt({each: true})
  userIds: number[];
}
