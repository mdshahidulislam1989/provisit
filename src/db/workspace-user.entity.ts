import {UserRoles} from 'src/static/user-roles';
import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {BaseEntity} from './base.entity';
import {User} from './index';
import {Workspace} from './workspace.entity';

@Entity({name: 'workspace_users'})
export class WorkspaceUser extends BaseEntity {
  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({type: 'enum', enum: UserRoles, default: UserRoles.owner})
  roleId: UserRoles;

  @Column({default: false})
  isSelected: boolean;

  // RELATIONS
  @ManyToOne(() => Workspace, workspace => workspace.workspaceUsers, {onDelete: 'CASCADE'})
  @JoinColumn({foreignKeyConstraintName: 'FK_workspace_id'})
  workspace: Workspace;

  @ManyToOne(() => User, user => user.workspaceUsers)
  @JoinColumn({foreignKeyConstraintName: 'FK_user_id'})
  user: User;
}
