import {Injectable} from '@nestjs/common';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {TaskComment} from 'src/db';
import {SuccessResponse} from 'src/utils/responses';
import {DataSource} from 'typeorm';
import {SaveDto} from './dto/save.dto';

@Injectable()
export class TaskCommentService {
  constructor(private readonly dataSource: DataSource) {}

  async add(authUser: IJwtAuthToken, taskId: number, saveDto: SaveDto) {
    await this.dataSource.query(`
    INSERT INTO task_comments(
        comment,
        taskId,
        createdById
    )
    VALUES("${saveDto.comment}",${taskId},${authUser.id})
    `);
    return SuccessResponse('Comment posted!');
  }
  async getAllByTaskId(taskId: number) {
    return await this.dataSource
      .createQueryBuilder(TaskComment, 'tc')
      .orderBy('tc.id', 'DESC')
      .leftJoin('tc.createdBy', 'cb')
      .select(['tc.id', 'tc.comment', 'tc.createdAt', 'tc.updatedAt'])
      .addSelect(['cb.id', 'cb.name', 'cb.image'])
      .where('tc.taskId=:taskId', {taskId})
      .getMany();
  }
}
