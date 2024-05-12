import { Injectable } from '@nestjs/common';
import { IJwtAuthToken } from 'src/auth/i-jwt-auth-token.interface';
import { Visit, VisitState } from 'src/db';
import { NotificationService } from 'src/notification/notification.service';
import { TaskStatuses } from 'src/static/task-status';
import { VisitStates } from 'src/static/visit-states';
import { getDateTimeDiffInSeconds } from 'src/utils/date-time-formats';
import { FailedResponse, SuccessResponse } from 'src/utils/responses';
import { DataSource, QueryRunner } from 'typeorm';
import { InstantVisitDto } from './dto/instant-visit.dto';
import { SaveDto } from './dto/save.dto';

@Injectable()
export class VisitService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async taskMyLastVisitCurrentState(authUser: IJwtAuthToken, taskId: number) {
    return await this.dataSource
      .createQueryBuilder(Visit, 'v')
      .where('v.userId=:userId', {userId: authUser.id})
      .andWhere('v.taskId=:taskId', {taskId})
      .select([
        'v.id AS visitId',
        'v.createdAt AS createdAt',
        'v.endedAt AS endedAt',
        'v.duration AS duration',
        'v.totalPauseTime AS totalPauseTime',
        'v.currentStateId AS currentStateId',
        'v.taskId AS taskId',
      ])
      .orderBy('v.id', 'DESC')
      .getRawOne();
  }

  async instantVisit(authUser: IJwtAuthToken, instantVisitDto: InstantVisitDto) {
    if (await this.isAnyVisitIsInProgress(authUser.id, authUser.selectedWorkspace.workspaceId))
      return FailedResponse('You are already on a visit in this project! Please pause or end it first.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // task create
      const task = await queryRunner.manager.query(`
      INSERT INTO tasks(
        name,
        lat,
        lng,
        address,
        startDate,
        startTime,
        status,
        totalVisit,
        createdById,
        updatedById,
        workspaceId,
        organizationId,
        isInstantVisit
      )
      VALUES(
        "${instantVisitDto.taskName}",
        "${instantVisitDto.lat}",
        "${instantVisitDto.lng}",
        "${instantVisitDto.address}",
        CURDATE(),
        CURTIME(),
        ${TaskStatuses.onGoing},
        1,
        ${authUser.id},
        ${authUser.id},
        ${authUser.selectedWorkspace.workspaceId},
        ${authUser.selectedWorkspace.organizationId},
        1
      )
      `);

      //add user to task_members
      await queryRunner.manager.query(`
      INSERT INTO task_members(
        userId,
        taskId,
        addedById
      )
      VALUES(
        ${authUser.id},
        ${task.insertId},
        ${authUser.id}
      )
      `);

      // Visit in
      const visit = await queryRunner.manager.query(`
        INSERT INTO visits(
            currentStateId,
            userId,
            taskId,
            workspaceId,
            organizationId
        )
        VALUES(
            ${VisitStates.in},
            ${authUser.id},
            ${task.insertId},
            ${authUser.selectedWorkspace.workspaceId},
            ${authUser.selectedWorkspace.organizationId}
        )
        `);

      // insert in visit state
      await queryRunner.manager.query(`
        INSERT INTO visit_states(
            stateId,
            lat,
            lng,
            address,
            visitId
        )
        VALUES(
            ${VisitStates.in},
            "${instantVisitDto.lat}",
            "${instantVisitDto.lng}",
            "${instantVisitDto.address}",
            ${visit.insertId}
        )`);

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Visit started!', {taskId: task.insertId});
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not start visit!');
    }
  }

  async visitIn(authUser: IJwtAuthToken, taskId: number, saveDto: SaveDto) {
    if (await this.isTaskCompleted(taskId))
      return FailedResponse('You can not visit as this task is already completed.');

    if (await this.isAnyVisitIsInProgress(authUser.id, authUser.selectedWorkspace.workspaceId))
      return FailedResponse('You are already on a visit in this project! Please pause or end it first.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const [{teamId}] = await queryRunner.query(
        `SELECT tm.teamId FROM task_members tm WHERE tm.userId=${authUser.id} AND tm.taskId=${taskId}`,
      );

      // Visit in
      const visit = await queryRunner.manager.query(`
        INSERT INTO visits(
            endedAt,
            duration,
            totalPauseTime,
            currentStateId,
            userId,
            taskId,
            workspaceId,
            organizationId,
            teamId
        )
        VALUES(
            ${null},
            ${0},
            ${0},
            ${VisitStates.in},
            ${authUser.id},
            ${taskId},
            ${authUser.selectedWorkspace.workspaceId},
            ${authUser.selectedWorkspace.organizationId},
            ${teamId}
        )
        `);

      // insert in visit state
      const visitState = await queryRunner.manager.query(`
        INSERT INTO visit_states(
            stateId,
            lat,
            lng,
            address,
            comment,
            visitId
        )
        VALUES(
            ${VisitStates.in},
            "${saveDto.lat}",
            "${saveDto.lng}",
            "${saveDto.address}",
            "${saveDto.comment}",
            ${visit.insertId}
        )`);

      // inserting visit attachments
      if (saveDto.attachments?.length > 0) {
        await Promise.all(
          saveDto.attachments.map(async att => {
            await queryRunner.manager.query(`
                INSERT INTO visit_attachments(
                    name,
                    visitStateId,
                    createdById
                )
                VALUES(
                    "${att}",
                    ${visitState.insertId},
                    ${authUser.id}
                )
                `);
          }),
        );
      }

      // updating task status into in progress and increase totalVisit + 1
      await queryRunner.manager.query(`
      UPDATE
        tasks
      SET
        status= ${TaskStatuses.onGoing},
        totalVisit = totalVisit + 1
      WHERE
          id = ${taskId}
      `);

      let members: number[] = [];
      const tMembers = await queryRunner.manager.query(`SELECT tm.userId FROM task_members tm WHERE tm.taskId=${taskId}
    `);
      members = tMembers.map(({userId}: {userId: number}) => userId);

      const [t] = await queryRunner.manager.query(`SELECT t.name FROM tasks t WHERE t.id=${taskId}`);

      await this.notificationService.sendNotification(members, {
        title: `New Visit for ${t.name}!`,
        body: `Started at ${saveDto.address}.`,
        senderId: authUser.id,
        organizationId: authUser.selectedWorkspace.organizationId,
        workspaceId: authUser.selectedWorkspace.workspaceId,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Visit started!');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Only assigned members can start visits!');
    }
  }

  async visitPause(authUser: IJwtAuthToken, visitId: number, taskId: number, saveDto: SaveDto) {
    if (await this.isTaskCompleted(taskId))
      return FailedResponse('You can not pause as this task is already completed.');

    if (await this.isVisitCurrentStateIdMatched(visitId, VisitStates.pause))
      return FailedResponse('Visit already paused!');

    if (!(await this.isVisitIsInProgress(visitId))) return FailedResponse('This task is not in progress!');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //updating last state duration
      await this.updateLastVisitStateDuration(visitId, queryRunner);

      // update visit state to pause and recalculate duration
      await queryRunner.manager.query(`
      UPDATE
        visits
      SET
        duration = (SELECT SUM(duration) FROM visit_states WHERE visitId=${visitId}),
        currentStateId = ${VisitStates.pause}
      WHERE
          id = ${visitId}
      `);

      // insert in visit state
      const visitState = await queryRunner.manager.query(`
        INSERT INTO visit_states(
            stateId,
            lat,
            lng,
            address,
            comment,
            visitId
        )
        VALUES(
            ${VisitStates.pause},
            "${saveDto.lat}",
            "${saveDto.lng}",
            "${saveDto.address}",
            "${saveDto.comment}",
            ${visitId}
        )`);

      // inserting visit attachments
      if (saveDto.attachments?.length > 0) {
        await Promise.all(
          saveDto.attachments.map(async att => {
            await queryRunner.manager.query(`
                INSERT INTO visit_attachments(
                    name,
                    visitStateId,
                    createdById
                )
                VALUES(
                    "${att}",
                    ${visitState.insertId},
                    ${authUser.id}
                )
                `);
          }),
        );
      }

      // updating totalVisitDuration in Task
      await this.updateTaskTotalVisitDuration(taskId, queryRunner);

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Visit paused!');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not pause visit!');
    }
  }

  async visitResume(authUser: IJwtAuthToken, visitId: number, taskId: number, saveDto: SaveDto) {
    //  validate if visit ended
    const {currentStateId} = await this.dataSource
      .createQueryBuilder(Visit, 'v')
      .where('v.id=:visitId', {visitId})
      .select(['v.currentStateId'])
      .getOne();
    if (currentStateId == VisitStates.out) return FailedResponse('This visit already ended!');

    if (await this.isTaskCompleted(taskId))
      return FailedResponse('You can not resume as this task is already completed.');

    if (await this.isVisitCurrentStateIdMatched(visitId, VisitStates.resume))
      return FailedResponse('Visit already resumed!');

    if (await this.isAnyVisitIsInProgress(authUser.id, authUser.selectedWorkspace.workspaceId))
      return FailedResponse('You are already on a visit in this project! Please pause or end it first.');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //updating last state duration
      await this.updateLastVisitStateDuration(visitId, queryRunner);

      // insert in visit state
      const visitState = await queryRunner.manager.query(`
        INSERT INTO visit_states(
            stateId,
            lat,
            lng,
            address,
            comment,
            visitId
        )
        VALUES(
            ${VisitStates.resume},
            "${saveDto.lat}",
            "${saveDto.lng}",
            "${saveDto.address}",
            "${saveDto.comment}",
            ${visitId}
        )`);

      // inserting visit attachments
      if (saveDto.attachments?.length > 0) {
        await Promise.all(
          saveDto.attachments.map(async att => {
            await queryRunner.manager.query(`
                INSERT INTO visit_attachments(
                    name,
                    visitStateId,
                    createdById
                )
                VALUES(
                    "${att}",
                    ${visitState.insertId},
                    ${authUser.id}
                )
                `);
          }),
        );
      }

      // calculating last pause time
      const {lastPausedAt} = await queryRunner.manager
        .createQueryBuilder(VisitState, 'vs')
        .where('vs.visitId=:visitId', {visitId})
        .andWhere('vs.stateId=:stateId', {stateId: VisitStates.pause})
        .orderBy('vs.id', 'DESC')
        .select(['vs.createdAt AS lastPausedAt'])
        .getRawOne();

      const {lastResumedAt} = await queryRunner.manager
        .createQueryBuilder(VisitState, 'vs')
        .where('vs.visitId=:visitId', {visitId})
        .andWhere('vs.stateId=:stateId', {stateId: VisitStates.resume})
        .orderBy('vs.id', 'DESC')
        .select(['vs.createdAt AS lastResumedAt'])
        .getRawOne();

      const lastPauseDuration =
        getDateTimeDiffInSeconds(new Date(lastResumedAt?.toString()), new Date(lastPausedAt?.toString())) || 0;

      // Visit resume and pause time update
      await queryRunner.manager.query(`
      UPDATE
        visits
      SET
        duration = (SELECT SUM(duration) FROM visit_states WHERE visitId=${visitId}),
        totalPauseTime = totalPauseTime + ${lastPauseDuration},
        currentStateId = ${VisitStates.resume}
      WHERE
          id = ${visitId}
      `);

      // updating totalVisitDuration in Task
      await this.updateTaskTotalVisitDuration(taskId, queryRunner);

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Visit resumed!');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not resume visit!');
    }
  }

  async visitOut(authUser: IJwtAuthToken, visitId: number, taskId: number, saveDto: SaveDto) {
    if (await this.isTaskCompleted(taskId)) return FailedResponse('You can not finish as this task is already completed.');

    if (await this.isVisitCurrentStateIdMatched(visitId, VisitStates.out))
      return FailedResponse('Visit already finished!');

    // if (!(await this.isVisitIsInProgress(visitId))) return FailedResponse('This task is not in progress!');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //updating last state duration
      await this.updateLastVisitStateDuration(visitId, queryRunner);

      // updating task status InstantVisit
      await queryRunner.manager.query(
        `UPDATE 
          tasks 
        SET 
          STATUS = ${TaskStatuses.completed},
          endDate = CURDATE(),
          endTime = CURTIME()
          WHERE id = ${taskId} AND isInstantVisit = 1`,
      );

      // update visit state to out and recalculate duration and added endedAt
      await queryRunner.manager.query(`
      UPDATE
        visits
      SET
        endedAt = CURRENT_TIMESTAMP(),
        duration = (SELECT SUM(duration) FROM visit_states WHERE visitId=${visitId}),
        currentStateId = ${VisitStates.out}
      WHERE
          id = ${visitId}
      `);

      // insert in visit state
      const visitState = await queryRunner.manager.query(`
        INSERT INTO visit_states(
            stateId,
            lat,
            lng,
            address,
            comment,
            visitId
        )
        VALUES(
            ${VisitStates.out},
            "${saveDto.lat}",
            "${saveDto.lng}",
            "${saveDto.address}",
            "${saveDto.comment}",
            ${visitId}
        )`);

      // inserting visit attachments
      if (saveDto.attachments?.length > 0) {
        await Promise.all(
          saveDto.attachments.map(async att => {
            await queryRunner.manager.query(`
                INSERT INTO visit_attachments(
                    name,
                    visitStateId,
                    createdById
                )
                VALUES(
                    "${att}",
                    ${visitState.insertId},
                    ${authUser.id}
                )
                `);
          }),
        );
      }

      // updating totalVisitDuration in Task
      await this.updateTaskTotalVisitDuration(taskId, queryRunner);

      let members: number[] = [];
      const tMembers = await queryRunner.manager.query(`SELECT tm.userId FROM task_members tm WHERE tm.taskId=${taskId}
    `);
      members = tMembers.map(({userId}: {userId: number}) => userId);

      const [t] = await queryRunner.manager.query(`SELECT t.name FROM tasks t WHERE t.id=${taskId}`);

      await this.notificationService.sendNotification(members, {
        title: `Finish Visit for ${t.name}!`,
        body: `Finished at ${saveDto.address}.`,
        senderId: authUser.id,
        organizationId: authUser.selectedWorkspace.organizationId,
        workspaceId: authUser.selectedWorkspace.workspaceId,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return SuccessResponse('Visit finished!');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not finish visit!');
    }
  }

  async taskVisits(taskId: number, stateId: 0 | 1 | 2 | 3 | 4) {
    return await this.dataSource
      .createQueryBuilder(Visit, 'v')
      .where('v.taskId=:taskId', {taskId})
      .andWhere(`v.currentStateId ${stateId == 0 ? 'IS NOT NULL' : '=' + stateId}`)
      .leftJoin('v.user', 'u')
      .leftJoin('v.states', 'vs')
      .leftJoin('v.task', 't')
      .leftJoin('vs.attachments', 'att')
      .orderBy('vs.id', 'DESC')
      .select([
        't.id',
        't.name',
        't.lat',
        't.lng',
        't.address',
        'u.id',
        'u.name',
        'u.image',
        'v.id',
        'v.createdAt',
        'v.endedAt',
        'v.duration',
        'v.totalPauseTime',
        'v.currentStateId',
        'vs.id',
        'vs.stateId',
        'vs.duration',
        'vs.comment',
        'vs.lat',
        'vs.lng',
        'vs.address',
        'vs.createdAt',
        'att.id',
        'att.name',
      ])
      .getMany();
  }

  // HELPERS
  async isTaskCompleted(taskId: number) {
    const [row] = await this.dataSource.query(`
    SELECT t.status AS taskStatus FROM tasks t WHERE t.id=${taskId}
    `);
    if (TaskStatuses.completed == row?.taskStatus) return true;
    else return false;
  }

  async isAnyVisitIsInProgress(userId: number, workspaceId: number) {
    const [row] = await this.dataSource.query(`
    SELECT 
    COUNT(*) AS progressCount 
    FROM
        visits v
    WHERE
        v.userId = ${userId} AND v.workspaceId = ${workspaceId} AND (v.currentStateId = ${VisitStates.in} OR v.currentStateId = ${VisitStates.resume})
    `);

    if (row?.progressCount > 0) return true;
    else return false;
  }

  async isVisitIsInProgress(visitId: number) {
    const [row] = await this.dataSource.query(`
    SELECT 
    COUNT(*) AS count 
    FROM
        visits v
    WHERE
        v.id = ${visitId} AND (v.currentStateId = ${VisitStates.in} OR v.currentStateId = ${VisitStates.resume})
    `);

    if (row?.count > 0) return true;
    else return false;
  }

  async isVisitCurrentStateIdMatched(visitId: number, stateIdToMatch: VisitStates) {
    const [row] = await this.dataSource.query(`
    SELECT v.currentStateId FROM visits v WHERE v.id=${visitId}
    `);

    if (row?.currentStateId == stateIdToMatch) return true;
    else return false;
  }

  async updateLastVisitStateDuration(visitId: number, queryRunner: QueryRunner) {
    const [row] = await queryRunner.manager.query(`
    SELECT vs.id, vs.createdAt, vs.duration FROM visit_states vs WHERE vs.visitId=${visitId} ORDER BY vs.id DESC LIMIT 1
    `);

    if (row) {
      await queryRunner.manager.query(`
      UPDATE visit_states SET duration = ${getDateTimeDiffInSeconds(
        new Date(),
        new Date(row?.createdAt?.toString()),
      )} WHERE id=${row?.id}
      `);
    }
  }

  async updateTaskTotalVisitDuration(taskId: number, queryRunner: QueryRunner) {
    await queryRunner.manager.query(`
    UPDATE
    tasks
    SET
        totalVisitDuration = (SELECT SUM(v.duration) - SUM(v.totalPauseTime) AS totalVisitDuration FROM visits v WHERE v.taskId=${taskId})
    WHERE
        id=${taskId}
    `);
  }
  // HELPERS
}
