import {Controller, DefaultValuePipe, Get, ParseBoolPipe, Query, Request} from '@nestjs/common';
import {TaskStatuses} from 'src/static/task-status';
import {MyPanelService} from './my-panel.service';

@Controller('my-panel')
export class MyPanelController {
  constructor(private readonly myPanelService: MyPanelService) {}

  @Get('get-visits-by')
  async getVisitsBy(
    @Request() req: any,
    @Query('all', ParseBoolPipe) all: boolean,
    @Query('started-or-resumed', ParseBoolPipe) startedOrResumed: boolean,
    @Query('paused', ParseBoolPipe) paused: boolean,
    @Query('ended', ParseBoolPipe) ended: boolean,
  ) {
    return await this.myPanelService.getVisitsBy(req?.user, all, startedOrResumed, paused, ended);
  }

  @Get('all-tasks-status-count')
  async allTasksStatusCount(@Request() req: any) {
    return await this.myPanelService.allTasksStatusCount(req?.user);
  }

  @Get('all-visits-status-count')
  async allVisitsStatusCount(@Request() req: any) {
    return await this.myPanelService.allVisitsStatusCount(req?.user);
  }

  @Get('last-team-tasks')
  async lastTeamTasksByLimit(@Request() req: any, @Query('limit') limit: number | null) {
    return await this.myPanelService.lastTeamTasksByLimit(req?.user, limit);
  }

  @Get('recent-tasks')
  async recentTasks(
    @Request() req: any,
    @Query('status', new DefaultValuePipe(0)) status: TaskStatuses | 0,
    @Query('isToday', ParseBoolPipe) isToday: boolean,
  ) {
    return await this.myPanelService.recentTasks(req?.user, status, isToday);
  }
}
