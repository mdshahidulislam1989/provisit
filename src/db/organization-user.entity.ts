import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {Organization, User} from './index';

@Entity({name: 'organization_users'})
export class OrganizationUser extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({default: true})
  isPending: boolean;

  // RELATIONS
  @ManyToOne(() => User, user => user.organizationUsers)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Organization, organization => organization.organizationUsers)
  @JoinColumn()
  organization: Organization;
}
