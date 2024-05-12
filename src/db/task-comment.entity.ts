import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {Task} from './task.entity';
import {User} from './user.entity';

@Entity({name: 'task_comments'})
export class TaskComment extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({nullable: true, type: 'longtext'})
  comment: string;

  // RELATIONS
  @ManyToOne(() => Task, task => task.comments, {onDelete: 'CASCADE'})
  @JoinColumn()
  task: Task;

  @ManyToOne(() => User, user => user.taskComments)
  @JoinColumn()
  createdBy: User;
}
