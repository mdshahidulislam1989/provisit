import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {InjectRepository} from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import {GlobalConfig} from 'src/config';
import {NotificationSettings, Organization, OrganizationUser, User, WorkspaceUser} from 'src/db';
import {MailService} from 'src/mail/mail.service';
import {GenerateOtp} from 'src/utils/generate-otp';
import {FailedResponse, SuccessResponse} from 'src/utils/responses';
import {DataSource, Repository} from 'typeorm';
import {ChangePasswordDto} from './dto/change-password.dto';
import {ForgotPasswordUpdateDto} from './dto/forgot-password-update.dto';
import {LoginDto} from './dto/login.dto';
import {RefreshTokenDto} from './dto/refresh-token.dto';
import {RegisterDto} from './dto/register.dto';
import {UpdateNotificationPreferencesDto} from './dto/update-notification-preferences.dto';
import {UpdateProfileDto} from './dto/update-profile.dto';
import {IJwtAuthToken} from './i-jwt-auth-token.interface';

@Injectable()
export class AuthService {
  otp: string;
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(OrganizationUser)
    private organizationUserRepository: Repository<OrganizationUser>,

    @InjectRepository(WorkspaceUser)
    private workspaceUserRepository: Repository<WorkspaceUser>,
    private jwtService: JwtService,
    private mailService: MailService,
    private dataSource: DataSource,
  ) {}

  async verifySignupEmail(email: string) {
    const user = await this.userRepository.findOne({where: {loginId: email}});
    if (user) return FailedResponse('Email already exists!');

    this.otp = GenerateOtp();
    await this.mailService.sendOtp(email, this.otp);
    return {...SuccessResponse('Otp sent to your email! Please check your spam as well.'), otp: this.otp};
  }

  async verifyOtp(otp: string) {
    if (!otp || this.otp !== otp) return FailedResponse('OTP does not matched!');

    this.otp = null;
    return SuccessResponse('OTP verified!');
  }

  async register(registerDto: RegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const isExists = await queryRunner.manager.getRepository(User).findOne({
        where: [{email: registerDto.email}, {loginId: registerDto.email}],
      });
      if (isExists) return FailedResponse('Email or login id already exists!');

      const hash = await bcrypt.hash(registerDto.password, GlobalConfig.hashSaltOrRounds);

      const user = await queryRunner.manager.getRepository(User).save({
        isEmailVerified: true,
        email: registerDto.email,
        loginId: registerDto.email,
        name: registerDto.name,
        password: hash,
        profileUpdatedAt: new Date(),
      });

      await queryRunner.manager.getRepository(NotificationSettings).save({user: user});

      const org = await queryRunner.manager.getRepository(Organization).save({
        name: user.name + '-org-' + new Date().getTime(),
        userLimit: 50, //need to change
        createdBy: user,
      });

      await queryRunner.manager.getRepository(OrganizationUser).save({user: user, organization: org, isPending: false});

      await queryRunner.manager.query(`
      INSERT INTO org_task_types(name, createdById, updatedById, organizationId) VALUES
      ("Visit Customer", ${user.id}, ${user.id}, ${org.id}),
      ("Office Cleaning", ${user.id}, ${user.id}, ${org.id}),
      ("Appliance Installation", ${user.id}, ${user.id}, ${org.id}),
      ("Lawn Mowing", ${user.id}, ${user.id}, ${org.id}),
      ("Fix leaking", ${user.id}, ${user.id}, ${org.id}),
      ("Delivery", ${user.id}, ${user.id}, ${org.id})
      `);

      await queryRunner.manager.query(`
      INSERT INTO org_task_categories(name, createdById, updatedById, organizationId) VALUES
      ("Cleaning", ${user.id}, ${user.id}, ${org.id}),
      ("Maintenance", ${user.id}, ${user.id}, ${org.id}),
      ("Repair", ${user.id}, ${user.id}, ${org.id}),
      ("Installation", ${user.id}, ${user.id}, ${org.id}),
      ("Inspection", ${user.id}, ${user.id}, ${org.id}),
      ("Landscaping", ${user.id}, ${user.id}, ${org.id}),
      ("Transportation", ${user.id}, ${user.id}, ${org.id})
      `);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      await this.mailService.registrationWelcome(registerDto.email, registerDto.name);

      // AFTER AUTHORIZATION
      const accessToken_refreshToken = await this.generateAccessTokenAndRefreshToken(user);
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
        refreshToken: accessToken_refreshToken.refreshToken,
      });

      return SuccessResponse('Account created.', accessToken_refreshToken);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return FailedResponse('Could not create account! Please try again.');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: {loginId: loginDto.loginId},
      select: ['id', 'loginId', 'password', 'isActive'],
    });

    if (!user) return FailedResponse('Incorrect login id or password!');
    if (!user.isActive) return FailedResponse('This account is currently inactive!');

    const isPassMatched = await bcrypt.compare(loginDto.password, user.password);
    if (!isPassMatched) return FailedResponse('Incorrect login id or password!');

    // AFTER AUTHORIZATION
    const accessToken_refreshToken = await this.generateAccessTokenAndRefreshToken(user);
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
      refreshToken: accessToken_refreshToken.refreshToken,
    });
    return accessToken_refreshToken;
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({where: {email: email}});
    if (!user) return FailedResponse("Email doesn't exist!");

    this.otp = GenerateOtp();
    await this.mailService.sendOtp(email, this.otp);
    return {...SuccessResponse('Otp sent to your email! Please check your spam as well.'), otp: this.otp};
  }

  async forgotPasswordUpdate(forgotPasswordUpdateDto: ForgotPasswordUpdateDto) {
    const hash = await bcrypt.hash(forgotPasswordUpdateDto.newPassword, GlobalConfig.hashSaltOrRounds);
    await this.userRepository.update({email: forgotPasswordUpdateDto.email}, {password: hash, refreshToken: null});
    return SuccessResponse('Password changed successfully.');
  }

  async changePassword(authUser: IJwtAuthToken, changePasswordDto: ChangePasswordDto) {
    // validate
    const user = await this.userRepository.findOne({
      where: {id: authUser.id},
      select: ['id', 'password'],
    });

    const isPassMatched = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    if (!isPassMatched) return FailedResponse('Incorrect old password!');

    // update
    const hash = await bcrypt.hash(changePasswordDto.newPassword, GlobalConfig.hashSaltOrRounds);
    await this.userRepository.update({id: authUser.id}, {password: hash, refreshToken: null});
    return SuccessResponse('Password changed successfully.');
  }

  async profile(userId: number) {
    const user = await this.userRepository.findOneBy({id: userId});
    const notificationSettings: {fcmToken: null | string} = (await this.dataSource
      .createQueryBuilder(NotificationSettings, 'ns')
      .where('ns.userId=:userId', {userId: user.id})
      .select(['ns.fcmToken'])
      .getOne()) || {fcmToken: null};

    const selectedWorkspace = await this.workspaceUserRepository
      .createQueryBuilder('workspaceUser')
      .where('userId = :userId', {userId: user.id})
      .andWhere('isSelected = :isSelected', {isSelected: true})
      .leftJoin('workspaceUser.workspace', 'workspace')
      .leftJoin('workspace.organization', 'organization')
      .select([
        'workspaceUser.roleId AS wRoleId',
        'workspace.id AS wId',
        'workspace.name AS wName',
        'organization.id AS oId',
        'organization.name AS oName',
      ])
      .getRawOne();

    return {...user, ...notificationSettings, selectedWorkspace};
  }

  async profileSimpleInfo(authUser: IJwtAuthToken) {
    const totalWorkspaces = await this.dataSource
      .createQueryBuilder(WorkspaceUser, 'wu')
      .where('wu.userId=:userId', {userId: authUser.id})
      .leftJoinAndSelect('wu.workspace', 'w')
      .leftJoinAndSelect('w.organization', 'o')
      .andWhere('o.id=:oId', {oId: authUser.selectedWorkspace.organizationId})
      .getCount();

    const myTotalPendingInvitations = await this.dataSource
      .createQueryBuilder(OrganizationUser, 'ou')
      .where('ou.userId=:userId', {userId: authUser.id})
      .andWhere('ou.isPending = 1')
      .getCount();

    const myTotalOrganizationUsers = await this.dataSource
      .createQueryBuilder(OrganizationUser, 'ou')
      .where('ou.organizationId = :organizationId', {organizationId: authUser.organizationId})
      .getCount();

    const purchasedPackage: null = null;

    return {totalWorkspaces, myTotalPendingInvitations, myTotalOrganizationUsers, purchasedPackage};
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    await this.userRepository.update(
      {id: userId},
      {
        name: updateProfileDto.name,
        email: updateProfileDto.email,
        dialCode: updateProfileDto.dialCode,
        phone: updateProfileDto.phone,
        address: updateProfileDto.address,
      },
    );
    return SuccessResponse('Profile updated!');
  }

  async updateProfilePic(userId: number, image: string) {
    await this.userRepository.update({id: userId}, {image: image == '' || image == null ? null : image});
    return SuccessResponse('Photo updated!');
  }

  async updateFcmToken(userId: number, fcmToken: string) {
    // const users = await this.dataSource.query('select * from users');
    // await Promise.all(
    //   users.map(async ({id}: {id: number}) => {
    //     await this.dataSource.query(`
    //   INSERT INTO notification_settings (userId) VALUES(${id})
    //   `);
    //   }),
    // );
    console.log(userId, fcmToken);
    await this.dataSource.query(`
    UPDATE
        notification_settings
    SET
        fcmToken = ${fcmToken == '' || fcmToken == null ? null : `"${fcmToken}"`}
    WHERE
        userId = ${userId}
    `);
    return SuccessResponse('FCM token updated!');
  }

  async deleteMyAccount(userId: number) {
    await this.userRepository.update({id: userId}, {isActive: false});
    return SuccessResponse('Account deleted!');
  }

  async myNotificationPreferences(authUser: IJwtAuthToken) {
    return await this.dataSource
      .createQueryBuilder(NotificationSettings, 'ns')
      .select(['ns.pushNotification'])
      .where('ns.userId=:userId', {userId: authUser.id})
      .getOne();
  }

  async updateMyNotificationPreferences(
    authUser: IJwtAuthToken,
    updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
  ) {
    await this.dataSource.query(`
    UPDATE
    notification_settings ns
    SET
        pushNotification = ${updateNotificationPreferencesDto.pushNotification}
    WHERE
        userId=${authUser.id}
    `);
    return SuccessResponse('Preferences updated!');
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      // refresh token verify
      const refreshTokenPayload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: GlobalConfig.jwtRefreshTokenSecret,
      });
      if (!refreshTokenPayload?.id) new UnauthorizedException();

      const user = await this.profile(refreshTokenPayload.id);
      if (refreshTokenDto.refreshToken !== user.refreshToken) throw new UnauthorizedException();
      if (!user || !user.isActive || !user.refreshToken) throw new UnauthorizedException();

      const {accessToken} = await this.generateAccessTokenAndRefreshToken(user);
      const refreshToken = user.refreshToken;

      return {accessToken, refreshToken};
    } catch (e) {
      throw new UnauthorizedException();
    }

    // const accessToken_refreshToken = await this.generateAccessTokenAndRefreshToken(user);
    // return accessToken_refreshToken.refreshToken;
  }

  /* HELPER FUNCTIONS */
  async generateAccessTokenAndRefreshToken(user: User) {
    const refreshToken = await this.jwtService.signAsync(
      {id: user.id},
      {expiresIn: GlobalConfig.jwtRefreshTokenExpiresIn, secret: GlobalConfig.jwtRefreshTokenSecret},
    );

    const [myOrg] = await this.dataSource.query(`
      select id from organizations o where o.createdById = ${user.id} 
      `);

    const workspaceUser = await this.workspaceUserRepository
      .createQueryBuilder('wu')
      .where('userId = :userId', {userId: user.id})
      .andWhere('isSelected = :isSelected', {isSelected: true})
      .leftJoin('wu.workspace', 'workspace')
      .leftJoin('workspace.organization', 'organization')
      .select(['organization.id AS organizationId', 'workspace.id AS workspaceId', 'wu.roleId AS roleId'])
      .getRawOne();

    const payload: IJwtAuthToken = {
      id: user.id,
      loginId: user.loginId,
      organizationId: myOrg.id,
      selectedWorkspace: workspaceUser && {
        organizationId: workspaceUser?.organizationId,
        workspaceId: workspaceUser?.workspaceId,
        roleId: workspaceUser?.roleId,
      },
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken,
    };
  }
}
