import {Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, Request} from '@nestjs/common';
import {InstantVisitDto} from './dto/instant-visit.dto';
import {SaveDto} from './dto/save.dto';
import {VisitService} from './visit.service';

@Controller('visit')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Get('task-my-last-visit-current-state/:taskId')
  async taskMyLastVisitCurrentState(@Request() req: any, @Param('taskId', ParseIntPipe) taskId: number) {
    return await this.visitService.taskMyLastVisitCurrentState(req?.user, taskId);
  }

  @Post('instant-visit')
  async instantVisit(@Request() req: any, @Body() instantVisitDto: InstantVisitDto) {
    return await this.visitService.instantVisit(req?.user, instantVisitDto);
  }

  @Post('visit-in/task/:taskId')
  async visitIn(@Request() req: any, @Param('taskId', ParseIntPipe) taskId: number, @Body() saveDto: SaveDto) {
    return await this.visitService.visitIn(req?.user, taskId, saveDto);
  }

  @Post(':visitId/visit-pause/task/:taskId')
  async visitPause(
    @Request() req: any,
    @Param('visitId', ParseIntPipe) visitId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() saveDto: SaveDto,
  ) {
    return await this.visitService.visitPause(req?.user, visitId, taskId, saveDto);
  }

  @Post(':visitId/visit-resume/task/:taskId')
  async visitResume(
    @Request() req: any,
    @Param('visitId', ParseIntPipe) visitId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() saveDto: SaveDto,
  ) {
    return await this.visitService.visitResume(req?.user, visitId, taskId, saveDto);
  }

  @Post(':visitId/visit-out/task/:taskId')
  async visitOut(
    @Request() req: any,
    @Param('visitId', ParseIntPipe) visitId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() saveDto: SaveDto,
  ) {
    return await this.visitService.visitOut(req?.user, visitId, taskId, saveDto);
  }

  @Get('task-visits/task/:taskId')
  async taskVisits(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('stateId', new DefaultValuePipe(0)) stateId: 0 | 1 | 2 | 3 | 4,
  ) {
    return await this.visitService.taskVisits(taskId, stateId);
  }
}
