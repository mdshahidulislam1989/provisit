import {Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {OrgTeam, User} from './index';

@Entity({name: 'org_team_users'})
export class OrgTeamUser extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  // RELATIONS
  @ManyToOne(() => OrgTeam, orgTeam => orgTeam.orgTeamUsers)
  @JoinColumn()
  team: OrgTeam;

  @ManyToOne(() => User, user => user.orgTeamUsers)
  @JoinColumn()
  user: User;
}
