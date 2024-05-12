import { Module } from '@nestjs/common';
import { MyPanelService } from './my-panel.service';
import { MyPanelController } from './my-panel.controller';

@Module({
  providers: [MyPanelService],
  controllers: [MyPanelController]
})
export class MyPanelModule {}
