import { AuditEventModel } from '../modules/audit/audit.model.js';
import { BrandLockModel, BrandLogoModel, BrandModel } from '../modules/brands/brand.model.js';
import { DemoRequestModel } from '../modules/demo-requests/demo-request.model.js';
import { FindingModel } from '../modules/findings/finding.model.js';
import {
  InviteModel,
  MembershipModel,
  OrganizationModel,
} from '../modules/organizations/organization.model.js';
import { SessionModel } from '../modules/sessions/session.model.js';
import { UserModel } from '../modules/users/user.model.js';

export const ALL_MODELS = [
  UserModel,
  OrganizationModel,
  MembershipModel,
  InviteModel,
  SessionModel,
  AuditEventModel,
  DemoRequestModel,
  BrandModel,
  BrandLogoModel,
  BrandLockModel,
  FindingModel,
];

/**
 * Builds every collection's indexes before the API starts serving, so
 * guarantees such as "one account per email" hold from the first request.
 * Each `Model.init()` resolves once that model's indexes exist.
 */
export async function ensureIndexes(): Promise<void> {
  await Promise.all(ALL_MODELS.map((model) => model.init()));
}
