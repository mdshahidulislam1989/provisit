import {Body, Controller, Get, Post, Put, Request} from '@nestjs/common';
import {AttendanceService} from './attendance.service';
import {SaveDto} from './dto/save.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('my-attendance-status')
  async myAttendanceStatus(@Request() req: any) {
    return await this.attendanceService.myAttendanceStatus(req?.user);
  }

  @Post('day-start')
  async dayStart(@Request() req: any, @Body() saveDto: SaveDto) {
    return await this.attendanceService.dayStart(req?.user, saveDto);
  }

  @Put('day-end')
  async dayEnd(@Request() req: any, @Body() saveDto: SaveDto) {
    return await this.attendanceService.dayEnd(req?.user, saveDto);
  }
}
