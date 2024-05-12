import {Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Attendance} from './attendance.entity';
import {BaseEntity} from './base.entity';
import {NotificationSettings} from './notification-settings.entity';
import {Notification} from './notification.entity';
import {OrgTaskCategory} from './org-task-category.entity';
import {OrgTaskType} from './org-task-type.entity';
import {OrgTeamUser} from './org-team-user.entity';
import {OrganizationUser} from './organization-user.entity';
import {Organization} from './organization.entity';
import {TaskAttachment} from './task-attachment.entity';
import {TaskComment} from './task-comment.entity';
import {TaskMember} from './task-member.entity';
import {Task} from './task.entity';
import {VisitAttachment} from './visit-attachment.entity';
import {Visit} from './visit.entity';
import {WorkspaceUser} from './workspace-user.entity';

@Entity({name: 'users'})
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({nullable: true})
  name: string;

  @Column({nullable: true})
  loginId: string;

  @Column({nullable: true, select: false})
  password: string;

  @Column({nullable: true})
  email: string;

  @Column({nullable: true})
  dialCode: string;

  @Column({nullable: true})
  phone: string;

  @Column({nullable: true})
  address: string;

  @Column({nullable: true})
  image: string;

  @Column({nullable: true})
  provider: string;

  @Column({nullable: true})
  refreshToken: string;

  @Column({default: false})
  isEmailVerified: boolean;

  @Column({default: false})
  isSocialLogin: boolean;

  @Column({default: true})
  isActive: boolean;

  @Column({nullable: true})
  lastLoginAt: Date;

  @Column({nullable: true})
  profileUpdatedAt: Date;

  // RELATIONS
  @OneToOne(() => Organization, organization => organization.createdBy)
  createdOrganization: Organization;

  @OneToMany(() => OrganizationUser, organizationUser => organizationUser.user)
  organizationUsers: OrganizationUser[];

  @OneToMany(() => WorkspaceUser, workspaceUser => workspaceUser.user)
  workspaceUsers: WorkspaceUser[];

  @OneToMany(() => OrgTaskType, orgTaskType => orgTaskType.createdBy)
  createdTaskTypes: OrgTaskType[];

  @OneToMany(() => OrgTaskType, orgTaskType => orgTaskType.updatedBy)
  updatedTaskTypes: OrgTaskType[];

  @OneToMany(() => OrgTaskCategory, orgTaskCategory => orgTaskCategory.createdBy)
  createdTaskCategories: OrgTaskCategory[];

  @OneToMany(() => OrgTaskCategory, orgTaskCategory => orgTaskCategory.updatedBy)
  updatedTaskCategories: OrgTaskCategory[];

  @OneToMany(() => Task, task => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => Task, task => task.updatedBy)
  updatedTasks: Task[];

  @OneToMany(() => TaskAttachment, taskAttachment => taskAttachment.createdBy)
  createdTaskAttachments: TaskAttachment[];

  @OneToMany(() => OrgTeamUser, orgTeamUser => orgTeamUser.user)
  orgTeamUsers: OrgTeamUser[];

  @OneToMany(() => TaskMember, taskMember => taskMember.user)
  taskMembers: TaskMember[];

  @OneToMany(() => TaskMember, taskMember => taskMember.addedBy)
  addedTaskMembers: TaskMember[];

  @OneToMany(() => TaskComment, taskComment => taskComment.createdBy)
  taskComments: TaskComment[];

  @OneToMany(() => VisitAttachment, visitAttachment => visitAttachment.createdBy)
  createdVisitAttachments: VisitAttachment[];

  @OneToMany(() => Visit, visit => visit.user)
  visits: Visit[];

  @OneToMany(() => Attendance, attendance => attendance.user)
  attendances: Attendance[];

  @OneToOne(() => NotificationSettings, notificationSettings => notificationSettings.user)
  notificationSettings: NotificationSettings;

  @OneToMany(() => Notification, notification => notification.sender)
  sendedNotifications: Notification[];

  @OneToMany(() => Notification, notification => notification.receiver)
  receivedNotifications: Notification[];
}
