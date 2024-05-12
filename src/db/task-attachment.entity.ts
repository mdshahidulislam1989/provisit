import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {Task} from './task.entity';
import {User} from './user.entity';

@Entity({name: 'task_attachments'})
export class TaskAttachment extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column()
  name: string;

  // RELATIONS
  @ManyToOne(() => Task, task => task.attachments, {onDelete: 'CASCADE'})
  @JoinColumn()
  task: Task;

  @ManyToOne(() => User, user => user.createdTaskAttachments)
  @JoinColumn()
  createdBy: User;
}
