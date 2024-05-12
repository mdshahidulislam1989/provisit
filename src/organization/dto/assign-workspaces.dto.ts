import {IsInt} from 'class-validator';

export class AssignWorkspacesDto {
  @IsInt({each: true})
  workspaceIds: number[];
}
