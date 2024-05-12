import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Request} from '@nestjs/common';
import {CreateDto} from './dto/create.dto';
import {MembersDto} from './dto/members.dto';
import {NameDto} from './dto/name.dto';
import {OrgTeamService} from './org-team.service';

@Controller('org-team')
export class OrgTeamController {
  constructor(private readonly orgTeamService: OrgTeamService) {}

  @Get('get-all-from-selected-org')
  async getAllFromSelectedOrg(@Request() req: any) {
    return await this.orgTeamService.getAllFromSelectedOrg(req?.user);
  }

  @Post('create-in-selected-org')
  async createInSelectedOrg(@Request() req: any, @Body() createDto: CreateDto) {
    return await this.orgTeamService.createInSelectedOrg(req?.user, createDto);
  }

  @Put(':id/update-name')
  async updateName(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() nameDto: NameDto) {
    return await this.orgTeamService.updateName(req?.user, id, nameDto);
  }

  @Get(':id/members')
  async members(@Param('id', ParseIntPipe) id: number) {
    return await this.orgTeamService.members(id);
  }

  @Put(':id/update-members')
  async updateMembers(@Param('id', ParseIntPipe) id: number, @Body() membersDto: MembersDto) {
    return await this.orgTeamService.updateMembers(id, membersDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.orgTeamService.delete(id);
  }
}
