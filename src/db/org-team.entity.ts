import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {OrgTeamUser} from './org-team-user.entity';
import {Organization} from './organization.entity';
import {TaskMember} from './task-member.entity';
import {Visit} from './visit.entity';

@Entity({name: 'org_teams'})
export class OrgTeam extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column()
  name: string;

  // RELATIONS
  @ManyToOne(() => Organization, organization => organization.teams)
  @JoinColumn()
  organization: Organization;

  @OneToMany(() => OrgTeamUser, orgTeamUser => orgTeamUser.team)
  orgTeamUsers: OrgTeamUser[];

  @OneToMany(() => TaskMember, taskMember => taskMember.team)
  assignedTasks: TaskMember[];

  @OneToMany(() => Visit, visit => visit.team)
  visits: Visit[];
}
