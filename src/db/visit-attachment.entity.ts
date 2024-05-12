import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {User} from './user.entity';
import {VisitState} from './visit-state.entity';

@Entity({name: 'visit_attachments'})
export class VisitAttachment extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({nullable: true})
  name: string;

  // RELATIONS
  @ManyToOne(() => VisitState, visitState => visitState.attachments, {onDelete: 'CASCADE'})
  @JoinColumn()
  visitState: VisitState;

  @ManyToOne(() => User, user => user.createdVisitAttachments)
  @JoinColumn()
  createdBy: User;
}
