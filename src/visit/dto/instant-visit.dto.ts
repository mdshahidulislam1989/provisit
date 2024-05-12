import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class InstantVisitDto {
  @IsNotEmpty()
  taskName: string;

  @IsString()
  @IsOptional()
  lat: string;

  @IsString()
  @IsOptional()
  lng: string;

  @IsString()
  @IsOptional()
  address: string;
}
