import {IsInt} from 'class-validator';

export class RemovePendingInvitationsDto {
  @IsInt({each: true})
  userIds: number[];
}
