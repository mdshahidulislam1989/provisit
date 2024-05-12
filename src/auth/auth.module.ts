import {Module} from '@nestjs/common';
import {APP_GUARD} from '@nestjs/core';
import {JwtModule} from '@nestjs/jwt';
import {TypeOrmModule} from '@nestjs/typeorm';
import {GlobalConfig} from 'src/config';
import {Organization, OrganizationUser, User, WorkspaceUser} from 'src/db';
import {MailModule} from 'src/mail/mail.module';
import {AuthController} from './auth.controller';
import {AuthGuard} from './auth.guard';
import {AuthService} from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, OrganizationUser, WorkspaceUser]),
    JwtModule.register({
      global: true,
      secret: GlobalConfig.jwtAccessTokenSecret,
      signOptions: {expiresIn: GlobalConfig.jwtAccessTokenExpiresIn},
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
