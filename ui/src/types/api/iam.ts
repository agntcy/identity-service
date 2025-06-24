export interface GetTenantsResponse {
  tenants: {
    id: string;
    name: string;
    createdAt: string;
    idp: string;
    extras: Record<string, unknown>;
    region: string;
    entitlements: string[];
    organization: string;
    organizationId: string;
  }[];
}
