import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Organization, OrganizationUser, User} from 'src/db';
import {NotificationModule} from 'src/notification/notification.module';
import {OrganizationController} from './organization.controller';
import {OrganizationService} from './organization.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User, OrganizationUser]), NotificationModule],
  providers: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
