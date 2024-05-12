import {IsInt, IsNotEmpty} from 'class-validator';

export class WorkspaceCreateDto {
  @IsNotEmpty()
  name: string;

  @IsInt({each: true})
  userIds: number[];
}
