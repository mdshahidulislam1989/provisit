import {Injectable} from '@nestjs/common';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {OrgTaskCategory} from 'src/db';
import {FailedResponse, SuccessResponse} from 'src/utils/responses';
import {DataSource} from 'typeorm';
import {SaveDto} from './dto/save.dto';

@Injectable()
export class OrgTaskCategoryService {
  constructor(private dataSource: DataSource) {}

  async getSelectedWorkspaceOrgTaskCategories(authUser: IJwtAuthToken) {
    return await this.dataSource.query(`
        SELECT otc.id, otc.name, otc.createdAt FROM org_task_categories otc
        WHERE otc.organizationId = ${authUser.selectedWorkspace.organizationId} 
        ORDER BY otc.id DESC
    `);
  }

  async createInSelectedOrg(authUser: IJwtAuthToken, saveDto: SaveDto) {
    const [{count}] = await this.dataSource.query(`
    SELECT
    COUNT(*) AS count
    FROM
        org_task_categories otc
    WHERE
        otc.organizationId = ${authUser.selectedWorkspace.organizationId} AND 
        BINARY otc.name = "${saveDto.name}"
    `);
    if (count > 0)
      return FailedResponse(`In the current organization, this "${saveDto.name}" task category already exists.`);

    await this.dataSource.query(`
    INSERT INTO org_task_categories(
        name,
        createdById,
        updatedById,
        organizationId
    )
    VALUES("${saveDto.name}", ${authUser.id}, ${authUser.id}, ${authUser.selectedWorkspace.organizationId})
    `);
    return SuccessResponse('Task category added!');
  }

  async updateInSelectedOrg(authUser: IJwtAuthToken, id: number, saveDto: SaveDto) {
    const [{count}] = await this.dataSource.query(`
    SELECT
    COUNT(*) AS count
    FROM
        org_task_categories otc
    WHERE
        otc.organizationId = ${authUser.selectedWorkspace.organizationId} AND 
        BINARY otc.name = "${saveDto.name}"
        AND otc.id != ${id}
    `);

    if (count > 0)
      return FailedResponse(`In the current organization, this "${saveDto.name}" task category already exists.`);

    await this.dataSource.query(`
    UPDATE
    org_task_categories otc
    SET
        otc.name = "${saveDto.name}",
        otc.updatedById = ${authUser.id}
    WHERE
        otc.id = ${id}
    `);
    return SuccessResponse('Task category updated successfully!');
  }

  async delete(id: number) {
    try {
      await this.dataSource.manager.delete(OrgTaskCategory, {id});
      return SuccessResponse('Task category removed!');
    } catch (e) {
      return FailedResponse('This task category is currently in use!');
    }
  }
}
