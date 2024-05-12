import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuthModule} from 'src/auth/auth.module';
import {Organization, User, Workspace, WorkspaceUser} from 'src/db';
import {CheckSelectedWorkspace} from 'src/middleware/check-selected-workspace.middleware';
import {NotificationModule} from 'src/notification/notification.module';
import {WorkspaceController} from './workspace.controller';
import {WorkspaceService} from './workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, Workspace, WorkspaceUser]), AuthModule, NotificationModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
})
export class WorkspaceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CheckSelectedWorkspace)
      .exclude(
        {path: '/', method: RequestMethod.GET},
        {path: '/auth/(.*)', method: RequestMethod.ALL},
        {path: '/workspace/create-initial-and-select', method: RequestMethod.POST},
        {path: '/workspace/my-related', method: RequestMethod.GET},
        {path: '/workspace/set-my-current-workspace', method: RequestMethod.PUT},
        {path: '/organization/my-related-orgs', method: RequestMethod.GET},
        {path: '/organization/my-related-workspaces-by-org/:oId', method: RequestMethod.GET},
        {path: '/organization/invite-user-in-my-org', method: RequestMethod.GET},
        {path: '/organization/my-pending-invitations', method: RequestMethod.GET},
        {path: '/organization/accept-invitation/:ouId', method: RequestMethod.PUT},
        {path: '/organization/reject-invitation/:ouId', method: RequestMethod.DELETE},
        {path: '/organization/my-org-users', method: RequestMethod.GET},
        {path: '/organization/remove-user-from-my-org/:uId', method: RequestMethod.DELETE},
        {path: '/organization/my-org-workspaces', method: RequestMethod.GET},
        {path: '/organization/update-workspaces-for-user-in-my-org/:uId', method: RequestMethod.PUT},
        {path: '/organization/update-my-org-name', method: RequestMethod.PUT},
      )
      .forRoutes('*');

    /* .forRoutes(
        {path: '/organization/remove-user-from-my-org/*', method: RequestMethod.DELETE},
        {path: '/workspace/org-not-pending-users', method: RequestMethod.GET},
        {path: '/workspace/create', method: RequestMethod.POST},
      ); */
  }
}
