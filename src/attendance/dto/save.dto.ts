import {IsOptional, IsString} from 'class-validator';

export class SaveDto {
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
