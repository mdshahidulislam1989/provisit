import {Controller, Get, Param, ParseIntPipe, Query, Request} from '@nestjs/common';
import {TaskStatuses} from 'src/static/task-status';
import {VisitStates} from 'src/static/visit-states';
import {ReportService} from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /* my-reports */
  @Get('my-reports')
  async myReports(@Request() req: any, @Query('month') month: number, @Query('year') year: number) {
    return await this.reportService.myReports(req?.user, month, year);
  }

  @Get('my-reports/tasks')
  async myReportsTasks(
    @Request() req: any,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('status') status: TaskStatuses | 0,
  ) {
    return await this.reportService.myReportsTasks(req?.user, month, year, status);
  }
  /* my-reports */

  /* employee-reports */
  @Get('employee-reports/team')
  async employeeTeamReports(@Request() req: any, @Query('lastDays') lastDays: number) {
    return await this.reportService.employeeTeamReports(req?.user, lastDays);
  }

  @Get('employee-reports/individual')
  async employeeIndividualReports(@Request() req: any, @Query('lastDays') lastDays: number) {
    return await this.reportService.employeeIndividualReports(req?.user, lastDays);
  }

  @Get('employee-report-details/team/:teamId')
  async employeeTeamReportDetails(
    @Request() req: any,
    @Query('lastDays') lastDays: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return await this.reportService.employeeTeamReportDetails(req?.user, lastDays, teamId);
  }

  @Get('employee-report-details/individual/:userId')
  async employeeIndividualReportDetails(
    @Request() req: any,
    @Query('lastDays') lastDays: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.reportService.employeeIndividualReportDetails(req?.user, lastDays, userId);
  }

  @Get('employee-report-tasks/team/:teamId')
  async employeeTeamReportTasks(
    @Request() req: any,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('lastDays') lastDays: number,
    @Query('status') status: TaskStatuses | 0,
  ) {
    return await this.reportService.employeeTeamReportTasks(req?.user, lastDays, teamId, status);
  }

  @Get('employee-report-tasks/individual/:userId')
  async employeeIndividualReportTasks(
    @Request() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('lastDays') lastDays: number,
    @Query('status') status: TaskStatuses | 0,
  ) {
    return await this.reportService.employeeIndividualReportTasks(req?.user, lastDays, userId, status);
  }

  @Get('employee-report-visits/team/:teamId')
  async employeeTeamReportVisits(
    @Request() req: any,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('lastDays') lastDays: number,
    @Query('states') states: VisitStates | 0,
  ) {
    return await this.reportService.employeeTeamReportVisits(req?.user, lastDays, teamId, states);
  }

  @Get('employee-report-visits/individual/:userId')
  async employeeIndividualReportVisits(
    @Request() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('lastDays') lastDays: number,
    @Query('states') states: VisitStates | 0,
  ) {
    return await this.reportService.employeeIndividualReportVisits(req?.user, lastDays, userId, states);
  }
  /* employee-reports */

  /* report-summary */
  @Get('report-summary/daily')
  async reportSummaryDaily(
    @Request() req: any,
    @Query('date') date: number | null,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return await this.reportService.reportSummary(req?.user, date, month, year);
  }

  @Get('report-summary/monthly')
  async reportSummaryMonthly(@Request() req: any, @Query('month') month: number, @Query('year') year: number) {
    return await this.reportService.reportSummary(req?.user, null, month, year);
  }
  /* report-summary */

  /* attendance-reports */
  @Get('attendance-report/daily')
  async attendanceReportDaily(
    @Request() req: any,
    @Query('date') date: number | null,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return await this.reportService.attendanceReportDaily(req?.user, date, month, year);
  }

  @Get('attendance-report/monthly')
  async attendanceReportMonthly(@Request() req: any, @Query('month') month: number, @Query('year') year: number) {
    return await this.reportService.attendanceReportMonthlyYearly(req?.user, month, year);
  }

  @Get('attendance-report/yearly')
  async attendanceReportYearly(@Request() req: any, @Query('year') year: number) {
    return await this.reportService.attendanceReportMonthlyYearly(req?.user, null, year);
  }

  /* attendance-reports */
}
