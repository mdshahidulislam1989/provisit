import {Injectable} from '@nestjs/common';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {Attendance} from 'src/db';
import {FailedResponse, SuccessResponse} from 'src/utils/responses';
import {DataSource} from 'typeorm';
import {SaveDto} from './dto/save.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly dataSource: DataSource) {}

  async myAttendanceStatus(authUser: IJwtAuthToken) {
    const isAlreadyDayStarted = await this.isAlreadyDayStarted(authUser);
    return {isDayStarted: isAlreadyDayStarted ? true : false, attendanceInfo: isAlreadyDayStarted};
  }

  async dayStart(authUser: IJwtAuthToken, saveDto: SaveDto) {
    const isAlreadyDayStarted = await this.isAlreadyDayStarted(authUser);
    if (isAlreadyDayStarted) return FailedResponse('Your have already started a day! Please end it first.');

    await this.dataSource.query(`
    INSERT INTO attendances(
        startLat,
        startLng,
        startAddress,
        userId,
        organizationId
    )
    VALUES(
      "${saveDto.lat}",
      "${saveDto.lng}",
      "${saveDto.address}",
      ${authUser.id},
      ${authUser.selectedWorkspace.organizationId}
    )
    `);

    return SuccessResponse('Day started!');
  }

  async dayEnd(authUser: IJwtAuthToken, saveDto: SaveDto) {
    const isAlreadyDayStarted = await this.isAlreadyDayStarted(authUser);
    if (!isAlreadyDayStarted) return FailedResponse('Your have not started a day yet!');

    await this.dataSource.query(`
    UPDATE
        attendances
    SET
        endLat = "${saveDto.lat}",
        endLng = "${saveDto.lng}",
        endAddress = "${saveDto.address}",
        endedAt = CURRENT_TIMESTAMP(),
        duration = TIMESTAMPDIFF(SECOND, createdAt, CURRENT_TIMESTAMP())
    WHERE
        id=${isAlreadyDayStarted.id}
    `);

    return SuccessResponse('Day ended!');
  }

  // HELPERS
  async isAlreadyDayStarted(authUser: IJwtAuthToken) {
    return await this.dataSource
      .createQueryBuilder(Attendance, 'a')
      .where('a.userId=:userId', {userId: authUser.id})
      .andWhere('a.organizationId=:organizationId', {organizationId: authUser.selectedWorkspace.organizationId})
      .andWhere('a.endedAt IS NULL')
      .orderBy('a.id', 'DESC')
      // .select(['a.id'])
      .getOne();
  }
  // HELPERS
}
