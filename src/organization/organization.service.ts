import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {Organization, OrganizationUser, User, Workspace, WorkspaceUser} from 'src/db';
import {NotificationService} from 'src/notification/notification.service';
import {FailedResponse, SuccessResponse} from 'src/utils/responses';
import {DataSource, Repository} from 'typeorm';
import {AssignWorkspacesDto} from './dto/assign-workspaces.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(OrganizationUser)
    private organizationUserRepository: Repository<OrganizationUser>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private dataSource: DataSource,
    private notificationService: NotificationService,
  ) {}

  async myOrgInfo(userId: number) {
    return this.dataSource.query(`
    select * from organizations where createdById=${userId}
    `);
  }

  async updateMyOrgTeamSize(userId: number, teamSizeId: number) {
    const user = await this.userRepository.findOneBy({id: userId});
    const org = await this.organizationRepository.findOneBy({createdBy: user});

    await this.organizationRepository.update({id: org.id}, {teamSize: teamSizeId});
    return SuccessResponse('Team size added.');
  }

  async updateMyOrgName(userId: number, name: string) {
    await this.dataSource.query(`
    UPDATE
        organizations
    SET NAME = "${name}"
    WHERE
        createdById = ${userId}
    `);
    return SuccessResponse('Name updated.');
  }

  async inviteUserInMyOrg(authUser: IJwtAuthToken, email: string) {
    const slots = await this.getOrgUserSlots(authUser.organizationId);
    if (slots.free < 0) return FailedResponse('You have no free slot to invite any user!');

    const isExists = await this.userRepository.findOne({
      where: [{email}, {loginId: email}],
    });
    if (!isExists)
      return FailedResponse(
        'User doesn’t exist! Please ask your employee to install this app and sign up first. Then try again!',
      );

    const alreadyAddedOrInvited = await this.dataSource
      .createQueryBuilder(OrganizationUser, 'ou')
      .where('userId = :userId', {userId: isExists.id})
      .andWhere('organizationId = :organizationId', {organizationId: authUser.organizationId})
      .getOne();
    if (alreadyAddedOrInvited)
      return FailedResponse(`Already ${alreadyAddedOrInvited.isPending ? 'invited' : 'added'}!`);

    await this.dataSource.query(
      `INSERT INTO organization_users (userId, organizationId, isPending) VALUES (${isExists.id},${
        authUser.organizationId
      },${true})`,
    );

    const [o] = await this.dataSource.query(`SELECT o.name FROM organizations o WHERE o.id=${authUser.organizationId}`);

    await this.notificationService.sendNotification(isExists.id, {
      title: `New Invitation!`,
      body: `You have a new organization invitation to join '${o.name}'`,
      senderId: authUser.id,
      // organizationId: authUser.selectedWorkspace.organizationId,
      // workspaceId: authUser.selectedWorkspace.workspaceId,
    });
    return SuccessResponse('Invitation sent!');
  }

  async myOrgUsers(authUser: IJwtAuthToken) {
    const slots = await this.getOrgUserSlots(authUser.organizationId);
    const users = await this.dataSource.query(`
    SELECT
        u.id,
        u.name,
        u.image,
        u.loginId,
        u.email,
        ou.isPending,
        (SELECT COUNT(*) FROM workspace_users wu LEFT JOIN workspaces w ON w.id=wu.workspaceId WHERE wu.userId = u.id AND w.organizationId=${authUser.organizationId}) AS totalWorkspacesInOrg
    FROM
        organization_users ou
    LEFT JOIN users u ON
        u.id = ou.userId
    WHERE
        ou.organizationId = ${authUser.organizationId}
    GROUP BY
        u.id
    ORDER BY
      ou.isPending DESC, u.name ASC
    `);

    return {slots, users};
  }

  // valid for only owner in his org
  async removeUserFromMyOrg(authUser: IJwtAuthToken, uId: number) {
    if (authUser.id == uId) return FailedResponse('Organization owner can not be removed!');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(OrganizationUser)
        .where('userId = :userId', {userId: uId})
        .andWhere('organizationId	= :organizationId', {organizationId: authUser.organizationId})
        .execute();

      const workspacesOfOrg = await queryRunner.manager.query(`
        SELECT
            id
        FROM
            workspaces w
        WHERE
            w.organizationId = ${authUser.organizationId}
      `);
      await Promise.all(
        workspacesOfOrg.map(async (w: Workspace) => {
          await queryRunner.manager.query(`
          DELETE
          FROM
              workspace_users
          WHERE
              workspaceId = ${w.id} AND userId = ${uId}
        `);
        }),
      );

      await queryRunner.manager.query(`
      DELETE otu FROM org_team_users otu 
      WHERE 
      otu.teamId IN (SELECT ot.id FROM org_teams ot WHERE ot.organizationId=${authUser.organizationId})
      AND otu.userId=${uId}
      `);

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('User removed!');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not remove user!');
    }
  }

  async myPendingInvitations(authUser: IJwtAuthToken) {
    return await this.dataSource
      .createQueryBuilder(OrganizationUser, 'ou')
      .where('ou.userId = :userId', {userId: authUser.id})
      .andWhere('ou.isPending = :isPending', {isPending: true})
      .leftJoin('ou.organization', 'o')
      .select(['ou.id AS ouId', 'ou.createdAt AS invitedAt', 'ou.isPending AS isPending', 'o.name AS orgName'])
      .orderBy('ou.id', 'DESC')
      .getRawMany();
  }

  async acceptInvitation(ouId: number) {
    await this.organizationUserRepository.update({id: ouId}, {isPending: false});
    return SuccessResponse('Invitation accepted!');
  }

  async rejectInvitation(ouId: number) {
    await this.organizationUserRepository.delete({id: ouId, isPending: true});
    return SuccessResponse('Invitation rejected!');
  }

  async assignedWorkspacesForUserInMyOrg(authUser: IJwtAuthToken, uId: number) {
    return await this.dataSource.query(`
    SELECT
    w.id,
    w.name
    FROM
        workspace_users wu
    LEFT JOIN users u ON
        u.id = wu.userId
    LEFT JOIN workspaces w ON
        w.id = wu.workspaceId
    LEFT JOIN organizations o ON
        o.id = w.organizationId
    WHERE
        wu.userId = ${uId} AND o.id = ${authUser.organizationId}
    `);
  }

  async myOrgWorkspaces(authUser: IJwtAuthToken) {
    return await this.dataSource
      .createQueryBuilder(Workspace, 'w')
      .where('organizationId = :organizationId', {organizationId: authUser.organizationId})
      .orderBy('w.name', 'ASC')
      .getMany();
  }

  async updateWorkspacesForUserInMyOrg(authUser: IJwtAuthToken, assignWorkspacesDto: AssignWorkspacesDto, uId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // inserting new workspaces for user (as user role) if not exists
      await Promise.all(
        assignWorkspacesDto.workspaceIds.map(async workspaceId => {
          // check if exists
          const count = await queryRunner.manager
            .createQueryBuilder(WorkspaceUser, 'wu')
            .where('wu.workspaceId = :workspaceId', {workspaceId})
            .andWhere('wu.userId = :userId', {userId: uId})
            .getCount();
          // adding
          if (count < 1) {
            await queryRunner.manager.query(
              `INSERT INTO workspace_users (roleId, isSelected, workspaceId, userId) VALUES (${3}, ${0}, ${workspaceId}, ${uId})`,
            );
          }
        }),
      );

      // remove all workspaces for this user in my org if not in this list and if not an owner
      if (assignWorkspacesDto.workspaceIds.length > 0) {
        const workspaceIds = assignWorkspacesDto.workspaceIds.join(',');
        await queryRunner.manager.query(`
        DELETE wu
        FROM
            workspace_users wu
        LEFT JOIN workspaces w ON
            w.id = wu.workspaceId
        WHERE
            w.organizationId = ${authUser.organizationId} AND 
            wu.userId = ${uId} AND 
            wu.roleId != 1 AND 
            wu.workspaceId NOT IN(${workspaceIds})
      `);
      } else {
        await queryRunner.manager.query(`
        DELETE wu
        FROM
            workspace_users wu
        LEFT JOIN workspaces w ON
            w.id = wu.workspaceId
        WHERE
            w.organizationId = ${authUser.organizationId} AND 
            wu.userId = ${uId} AND 
            wu.roleId != 1 
      `);
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Projects assigned!');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Failed to assign projects! Please try again.`');
    }
  }

  async myRelatedOrgs(authUser: IJwtAuthToken) {
    return await this.dataSource.query(`
    SELECT
    o.id,
    o.name,
    o.image
    FROM
    organization_users ou
    LEFT JOIN organizations o ON
    o.id = ou.organizationId
    WHERE
    ou.userId = ${authUser.id} AND ou.isPending = 0
    `);
  }

  async myRelatedWorkspacesByOrg(authUser: IJwtAuthToken, oId: number) {
    return await this.dataSource.query(`
    SELECT
        w.id, w.name, wu.roleId, wu.isSelected, w.createdAt, w.updatedAt,
        (SELECT count(*) from workspace_users where workspaceId=w.id) AS totalMembers
    FROM
        workspace_users wu
        
        LEFT JOIN workspaces w ON w.id=wu.workspaceId 
    WHERE
        wu.userId = ${authUser.id} AND w.organizationId=${oId}
    `);
  }

  // helpers
  async getOrgUserSlots(organizationId: number) {
    let userLimit = await this.dataSource.query(`
    SELECT
    o.userLimit
    FROM
        organizations o
    WHERE
        o.id = ${organizationId}
    `);
    userLimit = userLimit[0]?.userLimit | 0;

    let added = await this.dataSource.query(`
    SELECT
    COUNT(*) AS added
    FROM
        organization_users ou
    WHERE
        ou.organizationId = ${organizationId}
    `);
    added = added[0]?.added | 0;

    return {userLimit, added, free: userLimit - added};
  }
}
