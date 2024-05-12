import {Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Attendance} from './attendance.entity';
import {BaseEntity} from './base.entity';
import {Notification} from './notification.entity';
import {OrgTaskCategory} from './org-task-category.entity';
import {OrgTaskType} from './org-task-type.entity';
import {OrgTeam} from './org-team.entity';
import {OrganizationUser} from './organization-user.entity';
import {Task} from './task.entity';
import {User} from './user.entity';
import {Visit} from './visit.entity';
import {Workspace} from './workspace.entity';

@Entity({name: 'organizations'})
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({nullable: true})
  name: string;

  @Column({nullable: true})
  image: string;

  @Column({nullable: true})
  timeZone: string;

  @Column({nullable: true})
  location: string;

  @Column({nullable: true})
  teamSize: number;

  @Column({nullable: true})
  packageName: string;

  @Column({nullable: true})
  userLimit: number;

  @Column({nullable: true})
  purchaseToken: string;

  // RELATIONS
  @OneToOne(() => User, user => user.createdOrganization)
  @JoinColumn()
  createdBy: User;

  @OneToMany(() => OrganizationUser, organizationUser => organizationUser.organization)
  organizationUsers: OrganizationUser[];

  @OneToMany(() => Workspace, workspace => workspace.organization)
  workspaces: Workspace[];

  @OneToMany(() => OrgTaskType, orgTaskType => orgTaskType.organization)
  taskTypes: OrgTaskType[];

  @OneToMany(() => OrgTaskCategory, orgTaskCategory => orgTaskCategory.organization)
  taskCategories: OrgTaskCategory[];

  @OneToMany(() => Task, task => task.organization)
  tasks: Task[];

  @OneToMany(() => OrgTeam, orgTeam => orgTeam.organization)
  teams: OrgTeam[];

  @OneToMany(() => Visit, visit => visit.organization)
  visits: Visit[];

  @OneToMany(() => Attendance, attendance => attendance.organization)
  attendances: Attendance[];

  @OneToMany(() => Notification, notification => notification.organization)
  notifications: Notification[];
}
