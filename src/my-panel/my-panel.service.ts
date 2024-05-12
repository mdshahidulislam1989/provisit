import {Injectable} from '@nestjs/common';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {Task, TaskMember, Visit} from 'src/db';
import {TaskStatuses} from 'src/static/task-status';
import {VisitStates} from 'src/static/visit-states';
import {DataSource} from 'typeorm';

@Injectable()
export class MyPanelService {
  constructor(private readonly dataSource: DataSource) {}

  async getVisitsBy(authUser: IJwtAuthToken, all: boolean, startedOrResumed: boolean, paused: boolean, ended: boolean) {
    let stateCondition = '1=1';
    if (startedOrResumed)
      stateCondition = `(v.currentStateId=${VisitStates.in} OR v.currentStateId=${VisitStates.resume})`;

    if (paused) stateCondition = `v.currentStateId=${VisitStates.pause}`;
    if (ended) stateCondition = `v.currentStateId=${VisitStates.out}`;

    if (authUser.selectedWorkspace.roleId == 3) {
      return await this.dataSource
        .createQueryBuilder(Visit, 'v')
        .where('v.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
        .andWhere('v.userId=:userId', {userId: authUser.id})
        .andWhere(stateCondition)
        .leftJoin('v.task', 't')
        .leftJoin('v.user', 'u')
        .select([
          'v.id AS vId',
          'v.currentStateId AS currentStateId',
          'v.duration AS duration',
          'v.totalPauseTime AS totalPauseTime',
          'v.createdAt AS createdAt',
          'v.endedAt AS endedAt',
          't.id AS tId',
          't.name AS tName',
          'u.id AS uId',
          'u.name AS uName',
          'u.image AS uImage',
          `CASE WHEN (v.userId=${authUser.id} AND (v.currentStateId=${VisitStates.in} OR v.currentStateId=${
            VisitStates.resume
          })) THEN ${true} ELSE ${false} END AS isMyOnGoing`,
        ])
        .orderBy('isMyOnGoing', 'DESC')
        .getRawMany();
    }

    return await this.dataSource
      .createQueryBuilder(Visit, 'v')
      .where('v.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
      .andWhere(stateCondition)
      .leftJoin('v.task', 't')
      .leftJoin('v.user', 'u')
      .select([
        'v.id AS vId',
        'v.currentStateId AS currentStateId',
        'v.duration AS duration',
        'v.totalPauseTime AS totalPauseTime',
        'v.createdAt AS createdAt',
        'v.endedAt AS endedAt',
        't.id AS tId',
        't.name AS tName',
        'u.id AS uId',
        'u.name AS uName',
        'u.image AS uImage',
        `CASE WHEN (v.userId=${authUser.id} AND (v.currentStateId=${VisitStates.in} OR v.currentStateId=${
          VisitStates.resume
        })) THEN ${true} ELSE ${false} END AS isMyOnGoing`,
      ])
      .orderBy('isMyOnGoing', 'DESC')
      .getRawMany();
  }

  async allTasksStatusCount(authUser: IJwtAuthToken) {
    if (authUser.selectedWorkspace.roleId == 3) {
      return await this.dataSource
        .createQueryBuilder(TaskMember, 'tm')
        .leftJoin('tm.task', 't')
        .where('tm.userId=:userId', {userId: authUser.id})
        .andWhere('t.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
        .select([
          `COUNT(CASE WHEN status=${TaskStatuses.pending} THEN 1 ELSE NULL END) as pending`,
          `COUNT(CASE WHEN status=${TaskStatuses.onGoing} THEN 1 ELSE NULL END) as onGoing`,
          `COUNT(CASE WHEN status=${TaskStatuses.completed} THEN 1 ELSE NULL END) as completed`,
        ])
        .getRawOne();
    }
    return await this.dataSource
      .createQueryBuilder(Task, 't')
      .where('t.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
      .select([
        `COUNT(CASE WHEN status=${TaskStatuses.pending} THEN 1 ELSE NULL END) as pending`,
        `COUNT(CASE WHEN status=${TaskStatuses.onGoing} THEN 1 ELSE NULL END) as onGoing`,
        `COUNT(CASE WHEN status=${TaskStatuses.completed} THEN 1 ELSE NULL END) as completed`,
      ])
      .getRawOne();
  }

  async allVisitsStatusCount(authUser: IJwtAuthToken) {
    if (authUser.selectedWorkspace.roleId == 3) {
      const [data] = await this.dataSource.query(`
      SELECT
        COUNT(CASE WHEN v.currentStateId=${VisitStates.in} THEN 1 ELSE NULL END) as started,
        COUNT(CASE WHEN v.currentStateId=${VisitStates.out} THEN 1 ELSE NULL END) as ended,
        COUNT(CASE WHEN v.currentStateId=${VisitStates.pause} THEN 1 ELSE NULL END) as paused,
        COUNT(CASE WHEN v.currentStateId=${VisitStates.resume} THEN 1 ELSE NULL END) as resumed
      FROM
          visits v
      WHERE
      v.userId = ${authUser.id} AND v.workspaceId = ${authUser.selectedWorkspace.workspaceId}
      `);
      return data;
    }

    const [data] = await this.dataSource.query(`
      SELECT
        COUNT(CASE WHEN v.currentStateId=${VisitStates.in} THEN 1 ELSE NULL END) as started,
        COUNT(CASE WHEN v.currentStateId=${VisitStates.out} THEN 1 ELSE NULL END) as ended,
        COUNT(CASE WHEN v.currentStateId=${VisitStates.pause} THEN 1 ELSE NULL END) as paused,
        COUNT(CASE WHEN v.currentStateId=${VisitStates.resume} THEN 1 ELSE NULL END) as resumed
      FROM
          visits v
      WHERE
      v.workspaceId = ${authUser.selectedWorkspace.workspaceId}
      `);
    return data;
  }

  async lastTeamTasksByLimit(authUser: IJwtAuthToken, limit: number | null) {
    return await this.dataSource
      .createQueryBuilder(TaskMember, 'tm')
      .where('tm.teamId IS NOT NULL')
      .andWhere('tm.userId=:userId', {userId: authUser.id})
      .leftJoin('tm.task', 't')
      .leftJoin('tm.team', 'team')
      .andWhere('t.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
      .select([
        't.id AS id',
        't.name AS name',
        't.endDate AS endDate',
        'tm.teamId AS teamId',
        'team.name AS teamName',
        `CASE WHEN 
          ROUND((t.totalVisit * 100) / t.expectedVisitNo) > 100 
          THEN 100 
          ELSE ROUND((t.totalVisit * 100) / t.expectedVisitNo) 
        END AS visitDonePercentage`,
      ])
      .addSelect(qb => {
        return qb
          .select('count(*)')
          .from(TaskMember, 'tmm')
          .where('tmm.teamId=tm.teamId')
          .andWhere('tmm.taskId=tm.taskId');
      }, 'totalMembers')
      .orderBy('tm.id', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async recentTasks(authUser: IJwtAuthToken, status: TaskStatuses | 0, isToday: boolean) {
    return await this.dataSource
      .createQueryBuilder(Task, 't')
      .orderBy('t.id', 'DESC')
      .leftJoinAndSelect('t.taskMembers', 'tm')
      .leftJoinAndSelect('t.taskMembers', 'validateUser')
      .leftJoinAndSelect('tm.user', 'u')
      .select(['t.id', 't.name', 't.status', 't.startDate', 't.startTime'])
      .addSelect(['tm.id', 'tm.user'])
      .addSelect(['u.id', 'u.name', 'u.image'])
      .where('t.workspaceId=:workspaceId', {workspaceId: authUser.selectedWorkspace.workspaceId})
      .andWhere(`${isToday ? 't.startDate=CURRENT_DATE()' : '1=1'}`)
      .andWhere(`${status != 0 ? 't.status=:status' : '1=1'}`, {status})
      .andWhere('validateUser.userId=:validateUserId', {validateUserId: authUser.id})
      .getMany();
  }
}
