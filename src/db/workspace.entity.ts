import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {Notification} from './notification.entity';
import {Organization} from './organization.entity';
import {Task} from './task.entity';
import {User} from './user.entity';
import {Visit} from './visit.entity';
import {WorkspaceUser} from './workspace-user.entity';

@Entity({name: 'workspaces'})
export class Workspace extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @ManyToOne(() => User)
  @JoinColumn()
  updatedBy: User;

  @ManyToOne(() => Organization, organization => organization.workspaces)
  @JoinColumn({foreignKeyConstraintName: 'FK_organization_id'})
  organization: Organization;

  @OneToMany(() => WorkspaceUser, workspaceUser => workspaceUser.workspace)
  workspaceUsers: WorkspaceUser[];

  @OneToMany(() => Task, task => task.workspace)
  tasks: Task[];

  @OneToMany(() => Visit, visit => visit.workspace)
  visits: Visit[];

  @OneToMany(() => Notification, notification => notification.workspace)
  notifications: Notification[];
}
