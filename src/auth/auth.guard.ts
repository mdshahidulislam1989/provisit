import {CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {JwtService} from '@nestjs/jwt';
import {Request} from 'express';
import {GlobalConfig} from 'src/config';
import {AuthService} from './auth.service';
import {IJwtAuthToken} from './i-jwt-auth-token.interface';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // FOR PUBLIC API
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 See this condition
      return true;
    }
    // FOR PUBLIC API

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // access token verify
      const payload: IJwtAuthToken = await this.jwtService.verifyAsync(token, {
        secret: GlobalConfig.jwtAccessTokenSecret,
      });

      const user = await this.authService.profile(payload.id);
      if (!user || !user.isActive || !user.refreshToken) throw new UnauthorizedException();

      // refresh token verify
      await this.jwtService.verifyAsync(user?.refreshToken, {
        secret: GlobalConfig.jwtRefreshTokenSecret,
      });

      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch (e) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
