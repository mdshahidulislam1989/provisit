import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {Organization} from './organization.entity';
import {User} from './user.entity';

@Entity({name: 'attendances'})
export class Attendance extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({nullable: true})
  startLat: string;

  @Column({nullable: true})
  startLng: string;

  @Column({nullable: true})
  startAddress: string;

  @Column({nullable: true})
  endLat: string;

  @Column({nullable: true})
  endLng: string;

  @Column({nullable: true})
  endAddress: string;

  @Column({nullable: true})
  endedAt: Date;

  // extra
  @Column({default: 0})
  duration: number;

  // RELATIONS
  @ManyToOne(() => User, user => user.attendances)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Organization, organization => organization.attendances)
  @JoinColumn()
  organization: Organization;
}
