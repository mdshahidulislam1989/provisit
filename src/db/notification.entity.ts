import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {Organization} from './organization.entity';
import {User} from './user.entity';
import {Workspace} from './workspace.entity';

@Entity({name: 'notifications'})
export class Notification extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({nullable: true})
  title: string;

  @Column({nullable: true})
  body: string;

  // RELATIONS
  @ManyToOne(() => User, user => user.sendedNotifications)
  @JoinColumn()
  sender: User;

  @ManyToOne(() => User, user => user.receivedNotifications)
  @JoinColumn()
  receiver: User;

  @ManyToOne(() => Workspace, workspace => workspace.notifications)
  @JoinColumn()
  workspace: Workspace;

  @ManyToOne(() => Organization, organization => organization.notifications)
  @JoinColumn()
  organization: Organization;
}
