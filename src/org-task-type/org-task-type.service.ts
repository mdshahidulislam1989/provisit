import {Injectable} from '@nestjs/common';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {OrgTaskType} from 'src/db';
import {FailedResponse, SuccessResponse} from 'src/utils/responses';
import {DataSource} from 'typeorm';
import {SaveDto} from './dto/save.dto';

@Injectable()
export class OrgTaskTypeService {
  constructor(private dataSource: DataSource) {}

  async getSelectedWorkspaceOrgTaskTypes(authUser: IJwtAuthToken) {
    return await this.dataSource.query(`
        SELECT ott.id, ott.name, ott.createdAt FROM org_task_types ott
        WHERE ott.organizationId = ${authUser.selectedWorkspace.organizationId} 
        ORDER BY ott.id DESC
    `);
  }

  async createInSelectedOrg(authUser: IJwtAuthToken, saveDto: SaveDto) {
    const [{count}] = await this.dataSource.query(`
    SELECT
    COUNT(*) AS count
    FROM
        org_task_types ott
    WHERE
        ott.organizationId = ${authUser.selectedWorkspace.organizationId} AND 
        BINARY ott.name = "${saveDto.name}"
    `);
    if (count > 0)
      return FailedResponse(`In the current organization, this "${saveDto.name}" task type already exists.`);

    await this.dataSource.query(`
    INSERT INTO org_task_types(
        name,
        createdById,
        updatedById,
        organizationId
    )
    VALUES("${saveDto.name}", ${authUser.id}, ${authUser.id}, ${authUser.selectedWorkspace.organizationId})
    `);
    return SuccessResponse('Task type added!');
  }

  async updateInSelectedOrg(authUser: IJwtAuthToken, id: number, saveDto: SaveDto) {
    const [{count}] = await this.dataSource.query(`
    SELECT
    COUNT(*) AS count
    FROM
        org_task_types ott
    WHERE
        ott.organizationId = ${authUser.selectedWorkspace.organizationId} AND 
        BINARY ott.name = "${saveDto.name}"
        AND ott.id != ${id}
    `);

    if (count > 0)
      return FailedResponse(`In the current organization, this "${saveDto.name}" task type already exists.`);

    await this.dataSource.query(`
    UPDATE
    org_task_types ott
    SET
        ott.name = "${saveDto.name}",
        ott.updatedById = ${authUser.id}
    WHERE
        ott.id = ${id}
    `);
    return SuccessResponse('Task type updated successfully!');
  }

  async delete(id: number) {
    try {
      await this.dataSource.manager.delete(OrgTaskType, {id});
      return SuccessResponse('Task type removed!');
    } catch (e) {
      return FailedResponse('This task type is currently in use!');
    }
  }
}
