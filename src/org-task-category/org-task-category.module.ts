import { Module } from '@nestjs/common';
import { OrgTaskCategoryService } from './org-task-category.service';
import { OrgTaskCategoryController } from './org-task-category.controller';

@Module({
  providers: [OrgTaskCategoryService],
  controllers: [OrgTaskCategoryController]
})
export class OrgTaskCategoryModule {}
