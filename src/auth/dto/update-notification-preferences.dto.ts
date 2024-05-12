import {IsBoolean, IsOptional} from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  pushNotification: boolean;
}
