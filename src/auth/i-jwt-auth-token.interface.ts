export interface IJwtAuthToken {
  id: number;
  loginId: string;
  organizationId: number;
  selectedWorkspace?: {
    organizationId?: number;
    workspaceId?: number;
    roleId?: number;
  };
}
