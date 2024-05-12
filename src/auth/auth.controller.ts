import {Body, Controller, Get, Post, Put, Query, Request} from '@nestjs/common';
import {Public} from './auth.guard';
import {AuthService} from './auth.service';
import {ChangePasswordDto} from './dto/change-password.dto';
import {ForgotPasswordUpdateDto} from './dto/forgot-password-update.dto';
import {LoginDto} from './dto/login.dto';
import {RefreshTokenDto} from './dto/refresh-token.dto';
import {RegisterDto} from './dto/register.dto';
import {UpdateNotificationPreferencesDto} from './dto/update-notification-preferences.dto';
import {UpdateProfileDto} from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('verify-signup-email')
  async verifySignupEmail(@Query('email') email: string) {
    return await this.authService.verifySignupEmail(email);
  }

  @Public()
  @Get('verify-otp')
  async verifyOtp(@Query('otp') otp: string) {
    return await this.authService.verifyOtp(otp);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Public()
  @Get('forgot-password')
  async forgotPassword(@Query('email') email: string) {
    return await this.authService.forgotPassword(email);
  }

  @Public()
  @Put('forgot-password-update')
  async forgotPasswordUpdate(@Body() forgotPasswordUpdateDto: ForgotPasswordUpdateDto) {
    return await this.authService.forgotPasswordUpdate(forgotPasswordUpdateDto);
  }

  @Put('change-password')
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return await this.authService.changePassword(req?.user, changePasswordDto);
  }

  @Get('profile')
  async profile(@Request() req: any) {
    const profile = await this.authService.profile(req.user.id);
    delete profile.refreshToken;
    return profile;
  }

  @Get('profile-simple-info')
  async profileSimpleInfo(@Request() req: any) {
    return await this.authService.profileSimpleInfo(req?.user);
  }

  @Put('update-profile')
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return await this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Put('update-profile-pic')
  async updateProfilePic(@Request() req: any, @Query('image') image: string) {
    return await this.authService.updateProfilePic(req.user.id, image);
  }

  @Put('update-fcm-token')
  async updateFcmToken(@Request() req: any, @Query('fcm-token') fcmToken: string) {
    return await this.authService.updateFcmToken(req.user.id, fcmToken);
  }

  @Put('delete-my-account')
  async deleteMyAccount(@Request() req: any) {
    return await this.authService.deleteMyAccount(req?.user?.id);
  }

  @Get('my-notification-preferences')
  async myNotificationPreferences(@Request() req: any) {
    return await this.authService.myNotificationPreferences(req?.user);
  }

  @Put('update-my-notification-preferences')
  async updateMyNotificationPreferences(
    @Request() req: any,
    @Body() updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
  ) {
    return await this.authService.updateMyNotificationPreferences(req?.user, updateNotificationPreferencesDto);
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }
}
