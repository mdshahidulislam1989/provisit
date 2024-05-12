import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {User} from './user.entity';

@Entity({name: 'notification_settings'})
export class NotificationSettings extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({nullable: true})
  fcmToken: string;

  @Column({default: true})
  pushNotification: boolean;

  // @Column({default: false})
  // emailNotification: boolean;

  // RELATIONS
  @OneToOne(() => User, user => user.notificationSettings)
  @JoinColumn()
  user: User;
}
