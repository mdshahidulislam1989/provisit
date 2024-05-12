import {IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {IsHHMMSS, IsYYYYMMDD} from 'src/utils/custom-class-validators';

export class SaveDto {
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  lat: string;

  @IsString()
  @IsOptional()
  lng: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsBoolean()
  @IsOptional()
  isMultipleVisit: boolean;

  @IsInt()
  @IsOptional()
  expectedVisitNo: number;

  @IsYYYYMMDD()
  @IsOptional()
  startDate: Date;

  @IsYYYYMMDD()
  @IsOptional()
  endDate: Date;

  @IsHHMMSS()
  @IsOptional()
  startTime: Date;

  @IsHHMMSS()
  @IsOptional()
  endTime: Date;

  @IsString()
  @IsOptional()
  contactName: string;

  @IsString()
  @IsOptional()
  contactCountryCode: string;

  @IsString()
  @IsOptional()
  contactNo: string;

  @IsString()
  @IsOptional()
  contactAddress: string;

  @IsInt()
  @IsOptional()
  categoryId: number;

  @IsInt()
  @IsOptional()
  typeId: number;

  // for task members table
  @IsInt()
  @IsOptional()
  teamId: number;

  @IsInt({each: true})
  userIds: number[];

  // for task attachments table
  @IsString({each: true})
  attachments: string[];
}
