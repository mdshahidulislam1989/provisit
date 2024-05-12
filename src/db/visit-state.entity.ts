import {VisitStates} from 'src/static/visit-states';
import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {VisitAttachment} from './visit-attachment.entity';
import {Visit} from './visit.entity';

@Entity({name: 'visit_states'})
export class VisitState extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({type: 'enum', enum: VisitStates, default: VisitStates.in})
  stateId: VisitStates;

  @Column({nullable: true})
  lat: string;

  @Column({default: 0})
  duration: number;

  @Column({nullable: true})
  lng: string;

  @Column({nullable: true})
  address: string;

  @Column({nullable: true})
  comment: string;

  // RELATIONS
  @ManyToOne(() => Visit, visit => visit.states, {onDelete: 'CASCADE'})
  @JoinColumn()
  visit: Visit;

  @OneToMany(() => VisitAttachment, visitAttachment => visitAttachment.visitState)
  attachments: VisitAttachment[];
}
