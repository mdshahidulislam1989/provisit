import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import {TaskStatuses} from 'src/static/task-status';
import {SaveDto} from './dto/save.dto';
import {TaskService} from './task.service';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('todays-tasks')
  async todaysTasks(@Request() req: any) {
    return await this.taskService.todaysTasks(req?.user);
  }

  @Get('tasks')
  async tasks(@Request() req: any, @Query('status', new DefaultValuePipe(TaskStatuses.onGoing)) status: TaskStatuses) {
    return await this.taskService.tasks(req?.user, status);
  }

  @Post('create')
  async create(@Request() req: any, @Body() saveDto: SaveDto) {
    return await this.taskService.create(req?.user, saveDto);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.taskService.getById(id);
  }

  @Put(':id/update')
  async update(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() saveDto: SaveDto) {
    return await this.taskService.update(id, req?.user, saveDto);
  }

  @Put(':id/status-update')
  async statusUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Query('status') status: TaskStatuses,
  ) {
    return await this.taskService.statusUpdate(id, req?.user, status);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return await this.taskService.delete(req?.user, id);
  }
}
