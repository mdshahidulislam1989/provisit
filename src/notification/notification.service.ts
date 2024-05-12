import {HttpService} from '@nestjs/axios';
import {Injectable} from '@nestjs/common';
import {IJwtAuthToken} from 'src/auth/i-jwt-auth-token.interface';
import {GlobalConfig} from 'src/config';
import {DataSource} from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    private httpService: HttpService,
    private dataSource: DataSource,
  ) {}

  async getMy(authUser: IJwtAuthToken) {
    const data = await this.dataSource.query(`
    SELECT
        n.id,
        n.title,
        n.body,
        n.createdAt,
        n.organizationId,
        n.senderId,
        su.name AS senderName,
        su.image AS senderImage
    FROM
        notifications n
    LEFT JOIN users su ON
        su.id = n.senderId
    WHERE
        n.receiverId = ${authUser.id} AND(
            n.organizationId = ${authUser.selectedWorkspace.organizationId} OR n.organizationId IS NULL
        )
    ORDER BY
        n.id
    DESC
    LIMIT 20
    `);
    return {count: data.length, data};
  }

  // send
  async sendNotification(
    userId: number | number[] | string | string[],
    data: {
      senderId?: number;
      organizationId?: number;
      workspaceId?: number;
      title: string;
      body: string;
    },
  ) {
    try {
      let users = userId;
      let to: string | string[] = [];
      if (Array.isArray(userId)) {
        users = userId.length > 0 ? userId.map(u => `${u}`).join(', ') : null;
        await Promise.all(
          userId.map(async id => {
            await this.dataSource.query(`
            INSERT INTO notifications(
              title,
              body,
              senderId,
              receiverId,
              workspaceId,
              organizationId    
            )
            VALUES(
              "${data.title}",
              "${data.body}",
              ${data.senderId},
              ${id},
              ${data.workspaceId},
              ${data.organizationId}
            )
              `);
          }),
        );
      } else {
        await this.dataSource.query(`
        INSERT INTO notifications(
          title,
          body,
          senderId,
          receiverId,
          workspaceId,
          organizationId    
        )
        VALUES(
          "${data.title}",
          "${data.body}",
          ${data.senderId || null},
          ${userId},
          ${data.workspaceId || null},
          ${data.organizationId || null}
        )
        `);
      }

      const tokens = await this.dataSource.query(`
      SELECT ns.fcmToken FROM notification_settings ns WHERE ns.userId IN (${users}) AND ns.pushNotification=true AND ns.fcmToken IS NOT null
      `);

      to = tokens.map(({fcmToken}: {fcmToken: string}) => fcmToken);
      if (to.length > 0) {
        const response = await this.httpService
          .post(GlobalConfig.expoNotificationUrl, {
            to: to,
            title: data.title,
            body: data.body,
          })
          .toPromise();
        return response.data;
      }
    } catch (error) {
      // throw new Error(`Error: ${error.message}`);
    }
  }
}
