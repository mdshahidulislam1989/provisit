import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Request} from '@nestjs/common';
import {SaveDto} from './dto/save.dto';
import {OrgTaskCategoryService} from './org-task-category.service';

@Controller('org-task-category')
export class OrgTaskCategoryController {
  constructor(private readonly orgTaskCategoryService: OrgTaskCategoryService) {}

  @Get('get-selected-workspace-org-task-categories')
  async getSelectedWorkspaceOrgTaskTypes(@Request() req: any) {
    return await this.orgTaskCategoryService.getSelectedWorkspaceOrgTaskCategories(req?.user);
  }

  @Post('create-in-selected-org')
  async createInSelectedOrg(@Request() req: any, @Body() saveDto: SaveDto) {
    return await this.orgTaskCategoryService.createInSelectedOrg(req?.user, saveDto);
  }

  @Put(':id/update-in-selected-org')
  async updateInSelectedOrg(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() saveDto: SaveDto) {
    return await this.orgTaskCategoryService.updateInSelectedOrg(req?.user, id, saveDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.orgTaskCategoryService.delete(id);
  }
}
