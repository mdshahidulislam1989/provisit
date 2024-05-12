import {Injectable, NestMiddleware} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {NextFunction, Request, Response} from 'express';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {GlobalConfig} from 'src/config';
import {WorkspaceUser} from 'src/db';
import {FailedResponse} from 'src/utils/responses';
import {DataSource} from 'typeorm';

@Injectable()
export class CheckSelectedWorkspace implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async use(request: Request, response: Response, next: NextFunction) {
    const isValidate = await this.validateSelectedWorkspaceFromToken(request);
    if (isValidate) next();
    else
      response.send(
        FailedResponse('No selected project or role changed! Please select a project first.', {
          noDefaultWorkspaceError: true,
        }),
      );
  }

  private async validateSelectedWorkspaceFromToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') return false;

    try {
      const payload: IJwtAuthToken = await this.jwtService.verifyAsync(token, {
        secret: GlobalConfig.jwtAccessTokenSecret,
      });
      if (!payload || !payload.selectedWorkspace) return false;

      const workspaceUser = await this.dataSource
        .createQueryBuilder(WorkspaceUser, 'wu')
        .where('workspaceId = :workspaceId', {workspaceId: payload.selectedWorkspace.workspaceId})
        .andWhere('userId = :userId', {userId: payload.id})
        .getOne();
      if (!workspaceUser?.isSelected || workspaceUser?.roleId != payload?.selectedWorkspace?.roleId) return false;

      return true;
    } catch {
      return false;
    }
  }
}
