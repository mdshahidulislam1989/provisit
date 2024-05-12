import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {Organization} from './organization.entity';
import {Task} from './task.entity';
import {User} from './user.entity';

@Entity({name: 'org_task_types'})
export class OrgTaskType extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column()
  name: string;

  // RELATIONS
  @ManyToOne(() => User, user => user.createdTaskTypes)
  @JoinColumn()
  createdBy: User;

  @ManyToOne(() => User, user => user.updatedTaskTypes)
  @JoinColumn()
  updatedBy: User;

  @ManyToOne(() => Organization, organization => organization.taskTypes)
  @JoinColumn()
  organization: Organization;

  @OneToMany(() => Task, task => task.type)
  tasks: Task[];
}
