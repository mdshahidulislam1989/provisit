import {Injectable} from '@nestjs/common';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {OrgTeamUser, Task, TaskAttachment, TaskMember} from 'src/db';
import {NotificationService} from 'src/notification/notification.service';
import {TaskStatuses} from 'src/static/task-status';
import {UserRoles} from 'src/static/user-roles';
import {VisitStates} from 'src/static/visit-states';
import {FailedResponse, SuccessResponse} from 'src/utils/responses';
import {DataSource} from 'typeorm';
import {SaveDto} from './dto/save.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async todaysTasks(authUser: IJwtAuthToken) {
    const [{today}] = await this.dataSource.query(`SELECT DATE_FORMAT(CURRENT_DATE(), "%W, %b %d") AS today`);
    let tasks = [];

    if (authUser.selectedWorkspace.roleId == 3) {
      tasks = await this.dataSource
        .createQueryBuilder(Task, 't')
        .orderBy('t.id', 'DESC')
        .leftJoinAndSelect('t.taskMembers', 'tm')
        .leftJoinAndSelect('t.taskMembers', 'validateUser')
        .leftJoinAndSelect('tm.user', 'u')
        .select([
          't.id',
          't.status',
          't.name',
          't.description',
          't.startTime',
          't.endTime',
          't.lat',
          't.lng',
          't.address',
        ])
        .addSelect(['tm.id', 'tm.user'])
        .addSelect(['u.id', 'u.name', 'u.image'])
        .where('t.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
        .andWhere('t.startDate=CURRENT_DATE()')
        .andWhere('validateUser.userId=:validateUserId', {validateUserId: authUser.id}) // condition for user
        .getMany();
    } else {
      tasks = await this.dataSource
        .createQueryBuilder(Task, 't')
        .orderBy('t.id', 'DESC')
        .leftJoinAndSelect('t.taskMembers', 'tm')
        .leftJoinAndSelect('tm.user', 'u')
        .select([
          't.id',
          't.status',
          't.name',
          't.description',
          't.startTime',
          't.endTime',
          't.lat',
          't.lng',
          't.address',
        ])
        .addSelect(['tm.id', 'tm.user'])
        .addSelect(['u.id', 'u.name', 'u.image'])
        .where('t.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
        .andWhere('t.startDate=CURRENT_DATE()')
        .getMany();
    }
    return {today, tasks};
  }

  async tasks(authUser: IJwtAuthToken, status: TaskStatuses) {
    let tasks = [];

    if (authUser.selectedWorkspace.roleId == 3) {
      tasks = await this.dataSource
        .createQueryBuilder(Task, 't')
        .orderBy('t.id', 'DESC')
        .leftJoinAndSelect('t.taskMembers', 'tm')
        .leftJoinAndSelect('t.taskMembers', 'validateUser')
        .leftJoinAndSelect('tm.user', 'u')
        .select([
          't.id',
          't.status',
          't.name',
          't.totalVisit',
          't.expectedVisitNo',
          't.totalVisitDuration',
          't.startDate',
          't.endDate',
          't.lat',
          't.lng',
          't.address',
        ])
        .addSelect(['tm.id', 'tm.user'])
        .addSelect(['u.id', 'u.name', 'u.image'])
        .where('t.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
        .andWhere('t.status=:status', {status})
        .andWhere('validateUser.userId=:validateUserId', {validateUserId: authUser.id}) // condition for user
        .getMany();
    } else {
      tasks = await this.dataSource
        .createQueryBuilder(Task, 't')
        .orderBy('t.id', 'DESC')
        .leftJoinAndSelect('t.taskMembers', 'tm')
        .leftJoinAndSelect('tm.user', 'u')
        .select([
          't.id',
          't.status',
          't.name',
          't.totalVisit',
          't.expectedVisitNo',
          't.totalVisitDuration',
          't.startDate',
          't.endDate',
          't.lat',
          't.lng',
          't.address',
        ])
        .addSelect(['tm.id', 'tm.user'])
        .addSelect(['u.id', 'u.name', 'u.image'])
        .where('t.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
        .andWhere('t.status=:status', {status})
        .getMany();
    }
    return tasks;
  }

  async create(authUser: IJwtAuthToken, saveDto: SaveDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // create task
      const task = await queryRunner.query(`
      INSERT INTO tasks(
        name,
        description,
        lat,
        lng,
        address,
        isMultipleVisit,
        expectedVisitNo,
        startDate,
        endDate,
        startTime,
        endTime,
        contactName,
        contactCountryCode,
        contactNo,
        contactAddress,
        status,
        totalVisit,
        categoryId,
        typeId,
        createdById,
        updatedById,
        workspaceId,
        organizationId
      )
      VALUES(
        ${saveDto.name ? `"${saveDto.name}"` : null},
        ${saveDto.description ? `"${saveDto.description}"` : null},
        ${saveDto.lat ? `"${saveDto.lat}"` : null},
        ${saveDto.lng ? `"${saveDto.lng}"` : null},
        ${saveDto.address ? `"${saveDto.address}"` : null},
        ${saveDto.isMultipleVisit ? saveDto.isMultipleVisit : false},
        ${saveDto.expectedVisitNo ? saveDto.expectedVisitNo : null},
        ${saveDto.startDate ? `"${saveDto.startDate}"` : 'CURDATE()'},
        ${saveDto.endDate ? `"${saveDto.endDate}"` : 'NULL'},
        ${saveDto.startTime ? `"${saveDto.startTime}"` : 'NULL'},
        ${saveDto.endTime ? `"${saveDto.endTime}"` : 'NULL'},
        ${saveDto.contactName ? `"${saveDto.contactName}"` : null},
        ${saveDto.contactCountryCode ? `"${saveDto.contactCountryCode}"` : null},
        ${saveDto.contactNo ? `"${saveDto.contactNo}"` : null},
        ${saveDto.contactAddress ? `"${saveDto.contactAddress}"` : null},
        ${1},
        ${0},
        ${saveDto.categoryId ? saveDto.categoryId : null},
        ${saveDto.typeId ? saveDto.typeId : null},
        ${authUser.id},
        ${authUser.id},
        ${authUser.selectedWorkspace.workspaceId},
        ${authUser.selectedWorkspace.organizationId}
      )
      `);

      // get teamUserIds if exists teamId
      let teamUserIds: number[] = [];
      if (saveDto.teamId) {
        const teamMembers = await queryRunner.manager
          .createQueryBuilder(OrgTeamUser, 'otu')
          .where('teamId = :teamId', {teamId: saveDto.teamId})
          .select(['otu.userId'])
          .getRawMany();

        if (teamMembers.length > 0) {
          teamMembers.map(member => teamUserIds.push(parseInt(member.userId)));
        }
      }

      // removed userIds who are already in team
      const filteredSingleUserIds = saveDto.userIds.filter(id => teamUserIds.indexOf(id) < 0);

      // inserting team users
      await Promise.all(
        teamUserIds.map(async userId => {
          await queryRunner.query(`
          INSERT INTO task_members(
            userId,
            taskId,
            addedById,
            teamId
        )
        VALUES(
          ${userId},
          ${task.insertId},
          ${authUser.id},
          ${saveDto.teamId}
        )
        `);
        }),
      );

      // interting filteredSingleUserIds
      await Promise.all(
        filteredSingleUserIds.map(async userId => {
          await queryRunner.query(`
          INSERT INTO task_members(
            userId,
            taskId,
            addedById
        )
        VALUES(
          ${userId},
          ${task.insertId},
          ${authUser.id}
        )
        `);
        }),
      );

      // inserting attachments
      await Promise.all(
        saveDto.attachments.map(async attachment => {
          await queryRunner.query(`
          INSERT INTO task_attachments (name, taskId, createdById) VALUES("${attachment}", ${task.insertId}, ${authUser.id})
          `);
        }),
      );

      await this.notificationService.sendNotification([...filteredSingleUserIds, ...teamUserIds], {
        title: 'New Task Assigned!',
        body: `${saveDto.name} has been assigned to you.`,
        senderId: authUser.id,
        organizationId: authUser.selectedWorkspace.organizationId,
        workspaceId: authUser.selectedWorkspace.workspaceId,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Task created!', {taskId: task.insertId});
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not create task!');
    }
  }

  async getById(id: number) {
    const taskDetails = await this.dataSource.manager
      .createQueryBuilder(Task, 't')
      .where('t.id=:id', {id})
      .leftJoin('t.category', 'c')
      .leftJoin('t.type', 'ty')
      .leftJoin('t.createdBy', 'cb')
      .leftJoin('t.updatedBy', 'ub')
      .leftJoin('t.workspace', 'w')
      .leftJoin('t.organization', 'o')
      .leftJoin('t.attachments', 'a')
      .leftJoin('a.createdBy', 'acb')
      .select([
        't.id',
        't.name',
        't.description',
        't.lat',
        't.lng',
        't.address',
        't.isMultipleVisit',
        't.expectedVisitNo',
        't.startDate',
        't.endDate',
        't.startTime',
        't.endTime',
        't.contactName',
        't.contactCountryCode',
        't.contactNo',
        't.contactAddress',
        't.status',
        't.totalVisit',
        't.totalVisitDuration',
        't.createdAt',
        't.updatedAt',
        'c.id',
        'c.name',
        'ty.id',
        'ty.name',
        'cb.id',
        'cb.name',
        'ub.id',
        'ub.name',
        'w.id',
        'w.name',
        'o.id',
        'o.name',
        'a.id',
        'a.name',
        'acb.id',
        'acb.name',
      ])
      .getOne();

    const teamUsers = await this.dataSource.manager
      .createQueryBuilder(TaskMember, 'tm')
      .where('tm.taskId=:id', {id})
      .andWhere('tm.teamId IS NOT NULL')
      .leftJoin('tm.user', 'u')
      .leftJoin('tm.team', 't')
      .select(['u.id AS id', 'u.name AS name', 'u.image AS image', 't.id AS teamId', 't.name AS teamName'])
      .getRawMany();

    const team = teamUsers[0] ? {id: teamUsers[0].teamId, name: teamUsers[0].teamName} : null;

    const assignedUsers = await this.dataSource.manager
      .createQueryBuilder(TaskMember, 'tm')
      .where('tm.taskId=:id', {id})
      .andWhere('tm.teamId IS NULL')
      .leftJoin('tm.user', 'u')
      .select(['u.id AS id', 'u.name AS name', 'u.image AS image'])
      .getRawMany();

    return {...taskDetails, team, teamUsers, assignedUsers};
  }

  async update(id: number, authUser: IJwtAuthToken, saveDto: SaveDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // update task
      await queryRunner.query(`
      UPDATE tasks SET
        name =${saveDto.name ? `"${saveDto.name}"` : null},
        description = ${saveDto.description ? `"${saveDto.description}"` : null},
        lat = ${saveDto.lat ? `"${saveDto.lat}"` : null},
        lng = ${saveDto.lng ? `"${saveDto.lng}"` : null},
        address = ${saveDto.address ? `"${saveDto.address}"` : null},
        isMultipleVisit = ${saveDto.isMultipleVisit ? `"${saveDto.isMultipleVisit}"` : null},
        expectedVisitNo = ${saveDto.expectedVisitNo ? `"${saveDto.expectedVisitNo}"` : null},
        startDate = ${saveDto.startDate ? `"${saveDto.startDate}"` : null},
        endDate = ${saveDto.endDate ? `"${saveDto.endDate}"` : null},
        startTime = ${saveDto.startTime ? `"${saveDto.startTime}"` : null},
        endTime = ${saveDto.endTime ? `"${saveDto.endTime}"` : null},
        contactName = ${saveDto.contactName ? `"${saveDto.contactName}"` : null},
        contactCountryCode = ${saveDto.contactCountryCode ? `"${saveDto.contactCountryCode}"` : null},
        contactNo = ${saveDto.contactNo ? `"${saveDto.contactNo}"` : null},
        contactAddress = ${saveDto.contactAddress ? `"${saveDto.contactAddress}"` : null},
        categoryId = ${saveDto.categoryId ? saveDto.categoryId : null},
        typeId =  ${saveDto.typeId ? saveDto.typeId : null},
        updatedById =  ${authUser.id}
      WHERE id = ${id}
      `);

      // ************************* ATTACHMENT *************************
      // removing attachments if not in in update model list
      if (saveDto.attachments.length > 0) {
        await queryRunner.query(`
      DELETE FROM task_attachments WHERE taskId=${id} AND BINARY name NOT IN (
        ${saveDto.attachments.map(att => `"${att}"`).join(', ')})
      `);
      } else {
        await queryRunner.query(`DELETE FROM task_attachments WHERE taskId=${id}`);
      }

      // inserting new attachments only
      await Promise.all(
        saveDto.attachments.map(async att => {
          // check if exists
          const count = await queryRunner.manager
            .createQueryBuilder(TaskAttachment, 'ta')
            .where('ta.taskId = :taskId', {taskId: id})
            .andWhere('BINARY ta.name = :name', {name: att})
            .getCount();
          // adding
          if (count < 1) {
            await queryRunner.manager.query(
              `INSERT INTO task_attachments (name, taskId, createdById) VALUES ("${att}", ${id}, ${authUser.id})`,
            );
          }
        }),
      );
      // ************************* ATTACHMENT *************************

      // ************************* TEAM *************************
      // get teamUserIds if exists teamId
      let teamUserIds: number[] = [];
      if (saveDto.teamId) {
        const teamMembers = await queryRunner.manager
          .createQueryBuilder(OrgTeamUser, 'otu')
          .where('teamId = :teamId', {teamId: saveDto.teamId})
          .select(['otu.userId'])
          .getRawMany();

        if (teamMembers.length > 0) {
          teamMembers.map(member => teamUserIds.push(parseInt(member.userId)));
        }
      }

      // remove all team members from task if team id changed
      const {oldTeamId} =
        (await queryRunner.manager
          .createQueryBuilder(TaskMember, 'tm')
          .where('tm.taskId=:taskId', {taskId: id})
          .andWhere('tm.teamId IS NOT null')
          .leftJoin('tm.team', 't')
          .select(['t.id AS oldTeamId'])
          .getRawOne()) || {};

      if (oldTeamId && oldTeamId != saveDto.teamId) {
        await queryRunner.query(`
        DELETE FROM task_members WHERE taskId=${id} AND teamId IS NOT NULL AND teamId=${oldTeamId}
        `);
      }

      // removing task team members if not in updated team
      if (teamUserIds.length > 0) {
        await queryRunner.query(`
        DELETE FROM task_members WHERE taskId=${id} AND teamId IS NOT NULL AND userId NOT IN (${teamUserIds.join(', ')})
        `);
      } else {
        await queryRunner.query(`
        DELETE FROM task_members WHERE taskId=${id} AND teamId IS NOT NULL
        `);
      }

      // inserting new task team members if not exists
      await Promise.all(
        teamUserIds.map(async teamUserId => {
          // check if exists
          const count = await queryRunner.manager
            .createQueryBuilder(TaskMember, 'tm')
            .where('tm.taskId = :taskId', {taskId: id})
            .andWhere('tm.userId = :userId', {userId: teamUserId})
            .andWhere('tm.teamId = :teamId', {teamId: saveDto.teamId})
            .getCount();
          // adding
          if (count < 1) {
            await queryRunner.manager.query(
              `INSERT INTO task_members (userId, taskId, addedById, teamId) VALUES (${teamUserId}, ${id}, ${authUser.id}, ${saveDto.teamId})`,
            );
          }
        }),
      );
      // ************************* TEAM *************************

      // ************************* SINGLE USERS *************************
      // removed userIds who are already in team
      const filteredSingleUserIds = saveDto.userIds.filter(id => teamUserIds.indexOf(id) < 0);

      // removing task single members if not in updated filteredSingleUserIds
      if (filteredSingleUserIds.length > 0) {
        await queryRunner.query(`
        DELETE FROM task_members WHERE taskId=${id} AND teamId IS NULL AND userId NOT IN 
        (${filteredSingleUserIds.join(', ')})
        `);
      } else {
        await queryRunner.query(`
        DELETE FROM task_members WHERE taskId=${id} AND teamId IS NULL
        `);
      }

      // inserting new task single members if not exists
      await Promise.all(
        filteredSingleUserIds.map(async singleUserId => {
          // check if exists
          const count = await queryRunner.manager
            .createQueryBuilder(TaskMember, 'tm')
            .where('tm.taskId = :taskId', {taskId: id})
            .andWhere('tm.userId = :userId', {userId: singleUserId})
            .andWhere('tm.teamId IS NULL')
            .getCount();
          // adding
          if (count < 1) {
            await queryRunner.manager.query(
              `INSERT INTO task_members (userId, taskId, addedById) VALUES (${singleUserId}, ${id}, ${authUser.id})`,
            );
          }
        }),
      );
      // ************************* SINGLE USERS *************************

      await this.notificationService.sendNotification([...filteredSingleUserIds, ...teamUserIds], {
        title: 'Task Updated!',
        body: `${saveDto.name} has been updated.`,
        senderId: authUser.id,
        organizationId: authUser.selectedWorkspace.organizationId,
        workspaceId: authUser.selectedWorkspace.workspaceId,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Task updated!');
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not update task!');
    }
  }

  async statusUpdate(id: number, authUser: IJwtAuthToken, status: TaskStatuses) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.query(`
      UPDATE tasks SET
          updatedById ="${authUser.id}",
          status ="${status}"
      WHERE
        id=${id}
    `);

      if (status == TaskStatuses.completed) {
        await queryRunner.manager.query(`
        UPDATE
            visits
        SET
            currentStateId = ${VisitStates.out}
        WHERE
            taskId =${id}
      `);
      }

      let members: number[] = [];
      const tMembers = await queryRunner.manager.query(`SELECT tm.userId FROM task_members tm WHERE tm.taskId=${id}
    `);
      members = tMembers.map(({userId}: {userId: number}) => userId);

      const [t] = await queryRunner.manager.query(`SELECT t.name FROM tasks t WHERE t.id=${id}`);

      await this.notificationService.sendNotification(members, {
        title: 'Task Status Updated!',
        body: `${t.name} has been updated.`,
        senderId: authUser.id,
        organizationId: authUser.selectedWorkspace.organizationId,
        workspaceId: authUser.selectedWorkspace.workspaceId,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Status updated!');
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not update task status!');
    }
  }

  async delete(authUser: IJwtAuthToken, id: number) {
    if (authUser.selectedWorkspace.roleId == UserRoles.user)
      return FailedResponse('Only project owner and admin can delete task.');

    await this.dataSource.query(`DELETE FROM tasks where id=${id}`);
    return SuccessResponse('Task deleted!');
  }
}
