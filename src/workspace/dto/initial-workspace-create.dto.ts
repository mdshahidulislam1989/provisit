import {IsNotEmpty} from 'class-validator';

export class InitialWorkspaceCreateDto {
  @IsNotEmpty()
  name: string;
}
