import {TaskStatuses} from 'src/static/task-status';
import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {OrgTaskCategory} from './org-task-category.entity';
import {OrgTaskType} from './org-task-type.entity';
import {Organization} from './organization.entity';
import {TaskAttachment} from './task-attachment.entity';
import {TaskComment} from './task-comment.entity';
import {TaskMember} from './task-member.entity';
import {User} from './user.entity';
import {Visit} from './visit.entity';
import {Workspace} from './workspace.entity';

@Entity({name: 'tasks'})
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({nullable: true})
  name: string;

  @Column({nullable: true, type: 'longtext'})
  description: string;

  @Column({nullable: true})
  lat: string;

  @Column({nullable: true})
  lng: string;

  @Column({nullable: true})
  address: string;

  @Column({default: false})
  isMultipleVisit: boolean;

  @Column({nullable: true})
  expectedVisitNo: number;

  @Column({type: 'date', nullable: true})
  startDate: Date;

  @Column({type: 'date', nullable: true})
  endDate: Date;

  @Column({type: 'time', nullable: true})
  startTime: Date;

  @Column({type: 'time', nullable: true})
  endTime: Date;

  @Column({nullable: true})
  contactName: string;

  @Column({nullable: true})
  contactCountryCode: string;

  @Column({nullable: true})
  contactNo: string;

  @Column({nullable: true})
  contactAddress: string;

  @Column({type: 'enum', enum: TaskStatuses, default: TaskStatuses.pending})
  status: TaskStatuses;

  //   extraaaaaaaaaaaa
  @Column({default: 0})
  totalVisit: number;

  @Column({default: 0})
  totalVisitDuration: number;

  @Column({default: 0})
  isInstantVisit: boolean;

  // RELATIONS
  @ManyToOne(() => OrgTaskCategory, orgTaskCategory => orgTaskCategory.tasks)
  @JoinColumn()
  category: OrgTaskCategory;

  @ManyToOne(() => OrgTaskType, orgTaskType => orgTaskType.tasks)
  @JoinColumn()
  type: OrgTaskType;

  @ManyToOne(() => User, user => user.createdTasks)
  @JoinColumn()
  createdBy: User;

  @ManyToOne(() => User, user => user.updatedTasks)
  @JoinColumn()
  updatedBy: User;

  @ManyToOne(() => Workspace, workspace => workspace.tasks, {onDelete: 'CASCADE'})
  @JoinColumn()
  workspace: Workspace;

  @ManyToOne(() => Organization, organization => organization.tasks)
  @JoinColumn()
  organization: Organization;

  @OneToMany(() => TaskAttachment, taskAttachment => taskAttachment.task)
  attachments: TaskAttachment[];

  @OneToMany(() => TaskMember, taskMember => taskMember.task)
  taskMembers: TaskMember[];

  @OneToMany(() => TaskComment, taskComment => taskComment.task)
  comments: TaskComment[];

  @OneToMany(() => Visit, visit => visit.task)
  visits: Visit[];
}
