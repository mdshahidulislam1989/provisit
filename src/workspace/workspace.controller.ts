import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Request} from '@nestjs/common';
import {InitialWorkspaceCreateDto} from './dto/initial-workspace-create.dto';
import {UpdateMembersDto} from './dto/update-members.dto';
import {WorkspaceCreateDto} from './dto/workspace-create.dto';
import {WorkspaceNameUpdateDto} from './dto/workspace-name-update.dto';
import {WorkspaceService} from './workspace.service';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Put('set-my-current-workspace')
  async setMyCurrentWorkspace(@Request() req: any, @Query('workspaceId', ParseIntPipe) workspaceId: number) {
    return await this.workspaceService.setMyCurrentWorkspace(req.user, workspaceId);
  }

  @Post('create-initial-and-select')
  async createInitialAndSelect(@Request() req: any, @Body() initialWorkspaceCreateDto: InitialWorkspaceCreateDto) {
    return await this.workspaceService.createInitialAndSelect(req.user, initialWorkspaceCreateDto);
  }

  @Get('org-not-pending-users')
  async orgNotPendingUsers(@Request() req: any) {
    return await this.workspaceService.orgNotPendingUsers(req.user);
  }

  @Get('selected-workspace-users')
  async selectedWorkspaceUsers(@Request() req: any) {
    return await this.workspaceService.selectedWorkspaceUsers(req?.user);
  }

  @Post('create')
  async create(@Request() req: any, @Body() workspaceCreateDto: WorkspaceCreateDto) {
    return await this.workspaceService.create(req.user, workspaceCreateDto);
  }

  @Put(':id/update-members')
  async updateMembers(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMembersDto: UpdateMembersDto,
  ) {
    return await this.workspaceService.updateMembers(req?.user, id, updateMembersDto);
  }

  @Put(':id/update-workspace-name')
  async updateWorkspaceName(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() workspaceNameUpdateDto: WorkspaceNameUpdateDto,
  ) {
    return await this.workspaceService.updateWorkspaceName(req?.user, id, workspaceNameUpdateDto);
  }

  @Get('my-related')
  async myRelated(@Request() req: any) {
    return await this.workspaceService.myRelated(req.user);
  }

  @Get(':id')
  async workspaceDetails(@Param('id', ParseIntPipe) id: number) {
    return await this.workspaceService.workspaceDetails(id);
  }

  @Put('assign-new-members-in-selected-workspace')
  async assignNewMembersInSelectedWorkspace(@Request() req: any, @Body() updateMembersDto: UpdateMembersDto) {
    return await this.workspaceService.assignNewMembersInSelectedWorkspace(req?.user, updateMembersDto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return await this.workspaceService.delete(req?.user, id);
  }
}
