import {Body, Controller, Get, Param, ParseIntPipe, Post, Request} from '@nestjs/common';
import {SaveDto} from './dto/save.dto';
import {TaskCommentService} from './task-comment.service';

@Controller('task-comment')
export class TaskCommentController {
  constructor(private readonly taskCommentService: TaskCommentService) {}

  @Post('add/:taskId')
  async add(@Request() req: any, @Param('taskId', ParseIntPipe) taskId: number, @Body() saveDto: SaveDto) {
    return await this.taskCommentService.add(req?.user, taskId, saveDto);
  }

  @Get('get-all/task/:taskId')
  async getAllByTaskId(@Param('taskId', ParseIntPipe) taskId: number) {
    return await this.taskCommentService.getAllByTaskId(taskId);
  }
}
