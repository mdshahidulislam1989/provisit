import { Module } from '@nestjs/common';
import { OrgTeamController } from './org-team.controller';
import { OrgTeamService } from './org-team.service';

@Module({
  controllers: [OrgTeamController],
  providers: [OrgTeamService]
})
export class OrgTeamModule {}
