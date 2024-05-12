import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {Organization} from './organization.entity';
import {Task} from './task.entity';
import {User} from './user.entity';

@Entity({name: 'org_task_categories'})
export class OrgTaskCategory extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column()
  name: string;

  // RELATIONS
  @ManyToOne(() => User, user => user.createdTaskCategories)
  @JoinColumn()
  createdBy: User;

  @ManyToOne(() => User, user => user.updatedTaskCategories)
  @JoinColumn()
  updatedBy: User;

  @ManyToOne(() => Organization, organization => organization.taskCategories)
  @JoinColumn()
  organization: Organization;

  @OneToMany(() => Task, task => task.category)
  tasks: Task[];
}
