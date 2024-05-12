import {Injectable} from '@nestjs/common';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {OrgTeam, OrgTeamUser} from 'src/db';
import {FailedResponse, SuccessResponse} from 'src/utils/responses';
import {DataSource} from 'typeorm';
import {CreateDto} from './dto/create.dto';
import {MembersDto} from './dto/members.dto';
import {NameDto} from './dto/name.dto';

@Injectable()
export class OrgTeamService {
  constructor(private dataSource: DataSource) {}

  async getAllFromSelectedOrg(authUser: IJwtAuthToken) {
    return await this.dataSource.query(`
    SELECT
        ot.id,
        ot.name,
        SUM(
            (
                CASE WHEN otu.id IS NOT NULL THEN 1 ELSE 0
            END
        )
    ) AS totalMembers
    FROM
        org_teams ot
    LEFT JOIN org_team_users otu ON
        otu.teamId = ot.id
    WHERE
        ot.organizationId = ${authUser.selectedWorkspace.organizationId}
    GROUP BY
        ot.id
    DESC
        ;
    `);
  }

  async createInSelectedOrg(authUser: IJwtAuthToken, createDto: CreateDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const [{count}] = await queryRunner.manager.query(`
        SELECT
        COUNT(*) AS count
        FROM
            org_teams ot
        WHERE
            ot.organizationId = ${authUser.selectedWorkspace.organizationId} AND 
        BINARY ot.name = "${createDto.name}"
    `);
      if (count > 0) {
        await queryRunner.release();
        return FailedResponse(`In the current organization, this "${createDto.name}" team already exists.`);
      }

      const team = await queryRunner.manager.query(`
        INSERT INTO org_teams (name, organizationId) VALUES ("${createDto.name}", ${authUser.selectedWorkspace.organizationId})
        `);

      // adding users in map table
      await Promise.all(
        createDto.userIds.map(async uId => {
          await queryRunner.manager.query(`
            INSERT INTO org_team_users (teamId, userId) VALUES (${team?.insertId}, ${uId})
        `);
        }),
      );

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Team created!');
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not create team!');
    }
  }

  async updateName(authUser: IJwtAuthToken, id: number, nameDto: NameDto) {
    const [{count}] = await this.dataSource.query(`
        SELECT
        COUNT(*) AS count
        FROM
            org_teams ot
        WHERE
            ot.organizationId = ${authUser.selectedWorkspace.organizationId} AND 
            BINARY ot.name = "${nameDto.name}"
            AND ot.id != ${id}
    `);

    if (count > 0) return FailedResponse(`In the current organization, this "${nameDto.name}" team already exists.`);

    await this.dataSource.getRepository(OrgTeam).update({id}, {name: nameDto.name});
    return SuccessResponse('Name updated!');
  }

  async members(id: number) {
    return await this.dataSource
      .createQueryBuilder(OrgTeamUser, 'otu')
      .where('otu.teamId = :teamId', {teamId: id})
      .leftJoin('otu.user', 'u')
      .select(['u.id AS id', 'u.name AS name', 'u.image AS image'])
      .getRawMany();
  }

  async updateMembers(id: number, membersDto: MembersDto) {
    // inserting new users if not exists
    await Promise.all(
      membersDto.userIds.map(async userId => {
        // check if exists
        const count = await this.dataSource
          .createQueryBuilder(OrgTeamUser, 'otu')
          .where('otu.teamId = :teamId', {teamId: id})
          .andWhere('otu.userId = :userId', {userId})
          .getCount();
        // adding
        if (count < 1) {
          await this.dataSource.query(`INSERT INTO org_team_users (teamId, userId) VALUES (${id}, ${userId})`);
        }
      }),
    );

    // remove users if not in list
    if (membersDto.userIds.length > 0) {
      const userIds = membersDto.userIds.join(',');
      await this.dataSource.query(`DELETE FROM org_team_users WHERE teamId = ${id} AND userId NOT IN (${userIds})`);
    } else {
      await this.dataSource.query(`DELETE FROM org_team_users WHERE teamId = ${id}`);
    }

    return SuccessResponse('Team members updated!');
  }

  async delete(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.query(`
      UPDATE
          task_members
      SET
          teamId = NULL
      WHERE
          teamId = ${id}
      `);

      await queryRunner.manager.query(`
      UPDATE
          visits
      SET
          teamId = NULL
      WHERE
          teamId = ${id}
      `);

      await queryRunner.manager.query(`DELETE FROM org_team_users WHERE teamId = ${id}`);
      await queryRunner.manager.query(`DELETE FROM org_teams WHERE id = ${id}`);

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Team deteted!');
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not delete team!');
    }
  }
}
