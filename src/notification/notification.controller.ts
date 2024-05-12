import {Controller, Get, Request} from '@nestjs/common';
import {NotificationService} from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('get-my')
  async getMy(@Request() req: any) {
    return await this.notificationService.getMy(req?.user);
  }
}
