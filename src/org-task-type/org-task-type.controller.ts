import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Request} from '@nestjs/common';
import {SaveDto} from './dto/save.dto';
import {OrgTaskTypeService} from './org-task-type.service';

@Controller('org-task-type')
export class OrgTaskTypeController {
  constructor(private readonly orgTaskTypeService: OrgTaskTypeService) {}

  @Get('get-selected-workspace-org-task-types')
  async getSelectedWorkspaceOrgTaskTypes(@Request() req: any) {
    return await this.orgTaskTypeService.getSelectedWorkspaceOrgTaskTypes(req?.user);
  }

  @Post('create-in-selected-org')
  async createInSelectedOrg(@Request() req: any, @Body() saveDto: SaveDto) {
    return await this.orgTaskTypeService.createInSelectedOrg(req?.user, saveDto);
  }

  @Put(':id/update-in-selected-org')
  async updateInSelectedOrg(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() saveDto: SaveDto) {
    return await this.orgTaskTypeService.updateInSelectedOrg(req?.user, id, saveDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.orgTaskTypeService.delete(id);
  }
}
