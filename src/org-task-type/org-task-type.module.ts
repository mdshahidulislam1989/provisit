import { Module } from '@nestjs/common';
import { OrgTaskTypeService } from './org-task-type.service';
import { OrgTaskTypeController } from './org-task-type.controller';

@Module({
  providers: [OrgTaskTypeService],
  controllers: [OrgTaskTypeController]
})
export class OrgTaskTypeModule {}
