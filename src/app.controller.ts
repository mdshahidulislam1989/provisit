import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/auth.guard';
import { GlobalConfig } from './config';
@Controller()
export class AppController {
  @Public()
  @Get()
  getHello(): string {
    return `<h1 style="
    display: flex;
    justify-content: center;
    align-items: center;
    height: -webkit-fill-available;"
  >
    ProVisit Server Running on Port &nbsp
    <span style="color: red">${GlobalConfig.port}</span>
  </h1>`;
  }
}
