import {Body, Controller, Delete, Get, Param, ParseIntPipe, Put, Query, Request} from '@nestjs/common';
import {teamSizeList} from 'src/static/team-size-list';
import {AssignWorkspacesDto} from './dto/assign-workspaces.dto';
import {OrganizationService} from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('my-org-info')
  async myOrgInfo(@Request() req: any) {
    return await this.organizationService.myOrgInfo(req?.user?.id);
  }

  @Get('team-size-list')
  async teamSizeList() {
    return teamSizeList;
  }

  @Put('update-my-org-team-size')
  async updateMyOrgTeamSize(@Request() req: any, @Query('teamSizeId', ParseIntPipe) teamSizeId: number) {
    return await this.organizationService.updateMyOrgTeamSize(req?.user?.id, teamSizeId);
  }

  @Put('update-my-org-name')
  async updateMyOrgName(@Request() req: any, @Query('name') name: string) {
    return await this.organizationService.updateMyOrgName(req?.user?.id, name);
  }

  @Get('invite-user-in-my-org')
  async inviteUserInMyOrg(@Request() req: any, @Query('email') email: string) {
    return await this.organizationService.inviteUserInMyOrg(req?.user, email);
  }

  @Get('my-org-users')
  async myOrgUsers(@Request() req: any) {
    return await this.organizationService.myOrgUsers(req?.user);
  }

  @Delete('remove-user-from-my-org/:uId')
  async removeUserFromMyOrg(@Request() req: any, @Param('uId', ParseIntPipe) uId: number) {
    return await this.organizationService.removeUserFromMyOrg(req?.user, uId);
  }

  @Get('my-pending-invitations')
  async myPendingInvitations(@Request() req: any) {
    return await this.organizationService.myPendingInvitations(req?.user);
  }

  @Put('accept-invitation/:ouId')
  async acceptInvitation(@Param('ouId', ParseIntPipe) ouId: number) {
    return await this.organizationService.acceptInvitation(ouId);
  }

  @Delete('reject-invitation/:ouId')
  async rejectInvitation(@Param('ouId', ParseIntPipe) ouId: number) {
    return await this.organizationService.rejectInvitation(ouId);
  }

  @Get('assigned-workspaces-for-user-in-my-org/:uId')
  async assignedWorkspacesForUserInMyOrg(@Request() req: any, @Param('uId', ParseIntPipe) uId: number) {
    return await this.organizationService.assignedWorkspacesForUserInMyOrg(req?.user, uId);
  }

  @Get('my-org-workspaces')
  async myOrgWorkspaces(@Request() req: any) {
    return await this.organizationService.myOrgWorkspaces(req?.user);
  }

  @Put('update-workspaces-for-user-in-my-org/:uId')
  async updateWorkspacesForUserInMyOrg(
    @Request() req: any,
    @Body() assignWorkspacesDto: AssignWorkspacesDto,
    @Param('uId', ParseIntPipe) uId: number,
  ) {
    return await this.organizationService.updateWorkspacesForUserInMyOrg(req?.user, assignWorkspacesDto, uId);
  }

  @Get('my-related-orgs')
  async myRelatedOrgs(@Request() req: any) {
    return await this.organizationService.myRelatedOrgs(req?.user);
  }

  @Get('my-related-workspaces-by-org/:oId')
  async myRelatedWorkspacesByOrg(@Request() req: any, @Param('oId', ParseIntPipe) oId: number) {
    return await this.organizationService.myRelatedWorkspacesByOrg(req?.user, oId);
  }
}
