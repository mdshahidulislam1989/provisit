import {Module} from '@nestjs/common';
import {NotificationModule} from 'src/notification/notification.module';
import {TaskController} from './task.controller';
import {TaskService} from './task.service';

@Module({
  imports: [NotificationModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
