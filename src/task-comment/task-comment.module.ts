import { Module } from '@nestjs/common';
import { TaskCommentService } from './task-comment.service';
import { TaskCommentController } from './task-comment.controller';

@Module({
  providers: [TaskCommentService],
  controllers: [TaskCommentController]
})
export class TaskCommentModule {}
