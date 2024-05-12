import {MailerService} from '@nestjs-modules/mailer';
import {HttpService} from '@nestjs/axios';
import {Injectable} from '@nestjs/common';
import {GlobalConfig} from 'src/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private httpService: HttpService,
  ) {}

  async sendFromAzure(action: string, data: object) {
    try {
      const response = await this.httpService.post(GlobalConfig.azureMailUrl + action, data).toPromise();
      return response.data;
    } catch (error) {
      throw new Error(`Error: ${error.message}`);
    }
  }

  async sendOtp(to: string | Array<string>, otp: string) {
    if (!to) return;

    return await this.sendFromAzure('/send-otp', {
      appId: GlobalConfig.azureAppId,
      email: to,
      otp: otp,
    });

    /* await this.mailerService.sendMail({
      // from: '"Support Team" <support@example.com>', // override default from
      to,
      subject: 'OTP',
      template: './otp-send', // `.hbs` extension is appended automatically
      context: {otp},
    }); */
  }

  async registrationWelcome(to: string | Array<string>, name: string) {
    if (!to) return;

    await this.sendFromAzure('/send-welcome', {
      appId: GlobalConfig.azureAppId,
      email: to,
      name: name,
    });

    /* await this.mailerService.sendMail({
      to,
      subject: 'Welcome',
      template: './registration-welcome',
      context: {name},
    }); */
  }
}
