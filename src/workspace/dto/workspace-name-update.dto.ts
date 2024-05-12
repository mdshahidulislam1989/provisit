import {IsNotEmpty} from 'class-validator';

export class WorkspaceNameUpdateDto {
  @IsNotEmpty()
  name: string;
}
