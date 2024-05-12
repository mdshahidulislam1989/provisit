import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {AuthService} from 'src/auth/auth.service';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {Organization, User, Workspace, WorkspaceUser} from 'src/db';
import {NotificationService} from 'src/notification/notification.service';
import {UserRoles} from 'src/static/user-roles';
import {FailedResponse, SuccessResponse} from 'src/utils/responses';
import {DataSource, Repository} from 'typeorm';
import {InitialWorkspaceCreateDto} from './dto/initial-workspace-create.dto';
import {UpdateMembersDto} from './dto/update-members.dto';
import {WorkspaceCreateDto} from './dto/workspace-create.dto';
import {WorkspaceNameUpdateDto} from './dto/workspace-name-update.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceUser)
    private workspaceUserRepository: Repository<WorkspaceUser>,

    private dataSource: DataSource,
    private notificationService: NotificationService,
    private readonly authService: AuthService,
  ) {}

  async setMyCurrentWorkspace(user: IJwtAuthToken, workspaceId: number) {
    await this.dataSource
      .createQueryBuilder(WorkspaceUser, 'wu')
      .update()
      .set({isSelected: false})
      .where('userId = :userId', {userId: user.id})
      .execute();

    await this.dataSource
      .createQueryBuilder(WorkspaceUser, 'wu')
      .update()
      .set({isSelected: true})
      .where('userId = :userId', {userId: user.id})
      .andWhere('workspaceId = :workspaceId', {workspaceId})
      .execute();

    const userInfo = await this.userRepository.findOneBy({id: user.id});
    const {accessToken} = await this.authService.generateAccessTokenAndRefreshToken(userInfo);

    return SuccessResponse('Project switched!', {accessToken});
  }

  async createInitialAndSelect(user: IJwtAuthToken, initialWorkspaceCreateDto: InitialWorkspaceCreateDto) {
    const authUser = await this.userRepository.findOneBy({id: user.id});

    const org = await this.orgRepository.findOneBy({id: user.organizationId});

    const w = new Workspace();
    w.createdBy = authUser;
    w.updatedBy = authUser;
    w.name = initialWorkspaceCreateDto.name;
    w.organization = org;
    const workspace = await this.workspaceRepository.save(w);

    const wu = new WorkspaceUser();
    wu.isSelected = true;
    wu.roleId = 1;
    wu.user = authUser;
    wu.workspace = workspace;
    await this.workspaceUserRepository.save(wu);

    const {accessToken} = await this.authService.generateAccessTokenAndRefreshToken(authUser);

    return SuccessResponse('Your project has been created and selected by default!', {accessToken});
  }

  async orgNotPendingUsers(authUser: IJwtAuthToken) {
    return await this.dataSource.query(`
    SELECT
    u.id,
    u.name,
    u.image
    FROM
        organization_users ou
    LEFT JOIN users u ON
        ou.userId = u.id
    WHERE
        ou.organizationId = ${authUser.selectedWorkspace.organizationId}
        AND ou.isPending = FALSE
    ORDER BY u.name ASC
    `);
  }

  async selectedWorkspaceUsers(authUser: IJwtAuthToken) {
    return await this.workspaceUserRepository
      .createQueryBuilder('wu')
      .where('wu.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
      .leftJoin('wu.user', 'u')
      .select(['u.id AS id', 'u.name AS name', 'u.image AS image'])
      .orderBy('u.name', 'ASC')
      .getRawMany();
  }

  async create(user: IJwtAuthToken, workspaceCreateDto: WorkspaceCreateDto) {
    const [{count}] = await this.dataSource.query(`
    SELECT
    COUNT(*) AS count
    FROM
        workspaces w
    WHERE
        w.organizationId = ${user.selectedWorkspace.organizationId} AND 
        BINARY w.name = "${workspaceCreateDto.name}"
    `);
    if (count > 0)
      return FailedResponse(`In the current organization, this "${workspaceCreateDto.name}" project already exists.`);

    const userEntity = await this.userRepository.findOneBy({id: user.id});
    const orgEntity = await this.orgRepository.findOne({
      where: {id: user.selectedWorkspace.organizationId},
      relations: {createdBy: true},
    });

    const workspaceEntity = new Workspace();
    workspaceEntity.name = workspaceCreateDto.name;
    workspaceEntity.createdBy = userEntity;
    workspaceEntity.updatedBy = userEntity;
    workspaceEntity.organization = orgEntity;

    const workspaceUserEntity = new WorkspaceUser();
    workspaceUserEntity.workspace = workspaceEntity;
    workspaceUserEntity.isSelected = false;
    workspaceUserEntity.roleId = user.organizationId == user.selectedWorkspace.organizationId ? 1 : 2; //if owner or admin
    workspaceUserEntity.user = userEntity;

    // USERS ADD WITHOUT CREATOR & ORG OWNER
    const userIdsWithoutCreatorAndOrgOwner = workspaceCreateDto.userIds.filter(
      id => id != user.id && id != orgEntity.createdBy.id,
    );

    const usersToSave = await Promise.all(
      userIdsWithoutCreatorAndOrgOwner.map(async userId => {
        const workspaceUserEntity = new WorkspaceUser();
        workspaceUserEntity.isSelected = false;
        workspaceUserEntity.roleId = 3;
        workspaceUserEntity.user = await this.userRepository.findOneBy({id: userId});
        workspaceUserEntity.workspace = workspaceEntity;
        return workspaceUserEntity;
      }),
    );
    // USERS ADD WITHOUT CREATOR & ORG OWNER

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let isSuccess = true;
    try {
      await queryRunner.manager.save(workspaceEntity);
      await queryRunner.manager.save(workspaceUserEntity);
      // IF NOT OWNER THEN ADD OWNER
      if (user.organizationId != user.selectedWorkspace.organizationId) {
        await queryRunner.manager.query(`
          INSERT INTO workspace_users (workspaceId, isSelected, roleId, userId) VALUES (${workspaceEntity.id}, FALSE, 1, ${orgEntity.createdBy.id})
        `);
      }
      // IF NOT OWNER THEN ADD OWNER

      await Promise.all(
        usersToSave.map(async wu => {
          if (wu.user) {
            await queryRunner.manager.save(wu);
          }
        }),
      );

      await this.notificationService.sendNotification(workspaceCreateDto.userIds, {
        title: 'New Project!',
        body: `${workspaceCreateDto.name} has been created.`,
        senderId: user.id,
        organizationId: user.selectedWorkspace.organizationId,
        workspaceId: user.selectedWorkspace.workspaceId,
      });
      await queryRunner.commitTransaction();
    } catch {
      await queryRunner.rollbackTransaction();
      isSuccess = false;
    } finally {
      await queryRunner.release();
    }

    return isSuccess
      ? SuccessResponse('Project has been created in your default project organization!')
      : FailedResponse('Internal server error. You can try again');
  }

  async updateMembers(user: IJwtAuthToken, id: number, updateMembersDto: UpdateMembersDto) {
    let isSuccess = true;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // inserting new users (as user role) if not exists
      await Promise.all(
        updateMembersDto.userIds.map(async userId => {
          // check if exists
          const count = await queryRunner.manager
            .createQueryBuilder(WorkspaceUser, 'wu')
            .where('wu.workspaceId = :workspaceId', {workspaceId: id})
            .andWhere('wu.userId = :userId', {userId})
            .getCount();
          // adding
          if (count < 1) {
            await queryRunner.manager.query(
              `INSERT INTO workspace_users (roleId, isSelected, workspaceId, userId) VALUES (${3}, ${0}, ${id}, ${userId})`,
            );
          }
        }),
      );

      // remove all users in this workspace if not in this list and if not an owner
      if (updateMembersDto.userIds.length > 0) {
        const userIds = updateMembersDto.userIds.join(',');
        await queryRunner.manager.query(
          `DELETE FROM workspace_users WHERE workspaceId = ${id} AND roleId != 1 AND userId NOT IN (${userIds})`,
        );
      } else {
        await queryRunner.manager.query(`DELETE FROM workspace_users WHERE workspaceId = ${id} AND roleId != 1`);
      }

      const [w] = await queryRunner.manager.query(`SELECT w.name FROM workspaces w WHERE w.id=${id}`);
      await this.notificationService.sendNotification(updateMembersDto.userIds, {
        title: 'Project Member Modification!',
        body: `Members updated in '${w.name}'.`,
        senderId: user.id,
        organizationId: user.selectedWorkspace.organizationId,
        workspaceId: user.selectedWorkspace.workspaceId,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      isSuccess = false;
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      return isSuccess
        ? SuccessResponse('Succcessfully updated member list!')
        : FailedResponse('Failed! Please try again.');
    }
  }

  async updateWorkspaceName(user: IJwtAuthToken, id: number, workspaceNameUpdateDto: WorkspaceNameUpdateDto) {
    const [{count}] = await this.dataSource.query(`
    SELECT
    COUNT(*) AS count
    FROM
        workspaces w
    WHERE
        w.organizationId = ${user.selectedWorkspace.organizationId} AND 
        BINARY w.name = "${workspaceNameUpdateDto.name}"
        AND w.id != ${id}
    `);

    if (count > 0)
      return FailedResponse(
        `In the current organization, this "${workspaceNameUpdateDto.name}" project already exists.`,
      );

    await this.dataSource.query(`
    UPDATE
    workspaces w
    SET
        w.name = "${workspaceNameUpdateDto.name}",
        w.updatedById = ${user.id}
    WHERE
        w.id = ${id}
    `);
    return SuccessResponse('Project updated successfully!');
  }

  async myRelated(authUser: IJwtAuthToken) {
    const rawData = await this.dataSource.manager.query(
      `SELECT FW.workspaceId,FW.roleId,FW.totalMember
      ,W.name
      FROM (
          SELECT TT.workspaceId,TT.roleId,TT.createdAt,COUNT(WU.userId) as totalMember FROM(
            SELECT WU.id,WU.workspaceId,WU.roleId,WU.createdAt
            FROM workspace_users WU
            WHERE WU.userId= ${authUser.id} ORDER BY WU.createdAt DESC
        ) as TT INNER JOIN workspace_users WU ON TT.workspaceId=WU.workspaceId
      GROUP BY TT.workspaceId,TT.RoleId,TT.createdAt ORDER by TT.createdAt DESC) as FW
      INNER JOIN workspaces W ON FW.workspaceId=W.Id
      order by FW.createdAt DESC
      `,
    );
    return rawData;
  }

  async workspaceDetails(id: number) {
    // const data = await this.dataSource.createQueryBuilder(WorkspaceUser, 'wu').getMany();
    const workspace = await this.dataSource.query(`SELECT
          w.id,
          w.name,
          COUNT(*) AS totalMember
      FROM
          workspace_users wu
      Right JOIN workspaces w ON
          w.id = wu.workspaceId
      WHERE
          wu.workspaceId = ${id}`);

    const users = await this.dataSource
      .createQueryBuilder(WorkspaceUser, 'wu')
      .where('wu.workspaceId = :workspaceId', {workspaceId: id})
      .leftJoin('wu.user', 'u')
      .select(['u.id AS id', 'u.name AS name', 'u.image AS image', 'wu.roleId AS roleId'])
      .orderBy('u.name', 'ASC')
      .getRawMany();

    return {
      ...workspace[0],
      users,
    };
  }

  async assignNewMembersInSelectedWorkspace(authUser: IJwtAuthToken, updateMembersDto: UpdateMembersDto) {
    await Promise.all(
      updateMembersDto.userIds.map(async userId => {
        // checking if user already exists
        const count = await this.dataSource
          .createQueryBuilder(WorkspaceUser, 'wu')
          .where('wu.workspaceId = :workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
          .andWhere('wu.userId = :userId', {userId})
          .getCount();
        // adding
        if (count < 1) {
          await this.dataSource.query(`
        INSERT INTO workspace_users (roleId, isSelected, workspaceId, userId) VALUES (3, 0, ${authUser.selectedWorkspace.workspaceId}, ${userId})
        
        `);
        }
      }),
    );

    return SuccessResponse('New members assigned!');
  }

  async delete(authUser: IJwtAuthToken, id: number) {
    if (authUser.selectedWorkspace.roleId != UserRoles.owner)
      return FailedResponse('Only project owner can delete a project!');

    const createdWorkspaces = await this.dataSource.query(`
    SELECT * FROM workspace_users wu WHERE wu.roleId=${UserRoles.owner} AND wu.userId=${authUser.id}
    `);

    const isItMyWorkspace = createdWorkspaces.find((wu: {workspaceId: number}) => wu.workspaceId == id);
    if (!isItMyWorkspace) return FailedResponse('You are not owner of this project.');

    if (createdWorkspaces?.length < 2)
      return FailedResponse('There must be a minimum of one project in your organization!');

    const isItSelectedWorkspace = createdWorkspaces.filter(
      (wu: {workspaceId: number; isSelected: boolean}) => wu.workspaceId == id && wu.isSelected == true,
    );

    if (isItSelectedWorkspace?.length > 0) return FailedResponse('Change your default project to delete this!');

    await this.dataSource.query(`DELETE FROM workspaces WHERE id = ${id}`);

    return SuccessResponse('Project deleted!');
  }
}
