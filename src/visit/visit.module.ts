import {Module} from '@nestjs/common';
import {NotificationModule} from 'src/notification/notification.module';
import {VisitController} from './visit.controller';
import {VisitService} from './visit.service';

@Module({
  imports: [NotificationModule],
  providers: [VisitService],
  controllers: [VisitController],
})
export class VisitModule {}
