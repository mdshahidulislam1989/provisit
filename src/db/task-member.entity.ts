import {Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {OrgTeam, Task, User} from './index';

@Entity({name: 'task_members'})
export class TaskMember extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  // RELATIONS
  @ManyToOne(() => User, user => user.taskMembers)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Task, task => task.taskMembers, {onDelete: 'CASCADE'})
  @JoinColumn()
  task: Task;

  @ManyToOne(() => User, user => user.addedTaskMembers)
  @JoinColumn()
  addedBy: User;

  @ManyToOne(() => OrgTeam, orgTeam => orgTeam.assignedTasks)
  @JoinColumn()
  team: OrgTeam;
}
