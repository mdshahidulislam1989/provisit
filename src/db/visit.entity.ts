import {VisitStates} from 'src/static/visit-states';
import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {OrgTeam} from './org-team.entity';
import {Organization} from './organization.entity';
import {Task} from './task.entity';
import {User} from './user.entity';
import {VisitState} from './visit-state.entity';
import {Workspace} from './workspace.entity';

@Entity({name: 'visits'})
export class Visit extends BaseEntity {
  @Column({nullable: true})
  endedAt: Date;

  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({default: 0})
  duration: number;

  @Column({default: 0})
  totalPauseTime: number;

  @Column({type: 'enum', enum: VisitStates, default: VisitStates.in})
  currentStateId: VisitStates;

  // RELATIONS
  @OneToMany(() => VisitState, visitState => visitState.visit)
  states: VisitState[];

  @ManyToOne(() => User, user => user.visits)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Task, task => task.visits, {onDelete: 'CASCADE'})
  @JoinColumn()
  task: Task;

  @ManyToOne(() => Workspace, workspace => workspace.visits, {onDelete: 'CASCADE'})
  @JoinColumn()
  workspace: Workspace;

  @ManyToOne(() => Organization, organization => organization.visits)
  @JoinColumn()
  organization: Organization;

  @ManyToOne(() => OrgTeam, orgTeam => orgTeam.visits)
  @JoinColumn()
  team: OrgTeam;
}
