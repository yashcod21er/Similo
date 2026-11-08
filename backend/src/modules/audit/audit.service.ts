import type { Logger } from '../../lib/logger.js';
import type {
  AuditCursor,
  AuditEventRecord,
  AuditRepository,
  NewAuditEvent,
} from './audit.repository.js';

export interface AuditEventDto {
  id: string;
  action: string;
  actor: { name: string; email: string } | null;
  target: { type: string; label: string } | null;
  metadata: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

export interface AuditPage {
  events: AuditEventDto[];
  /** Pass back as `before` to load the next (older) page; null when there is none. */
  nextCursor: string | null;
}

export interface AuditService {
  /** Never throws: a failed audit write is logged, it does not undo the user's action. */
  record(event: NewAuditEvent): Promise<void>;
  list(organizationId: string, options: { before?: string; limit: number }): Promise<AuditPage>;
}

/** Cursor format: `<ISO date>_<event id>`; opaque to the client. */
function encodeCursor(event: AuditEventRecord): string {
  return `${event.createdAt.toISOString()}_${event.id}`;
}

export function decodeCursor(cursor: string | undefined): AuditCursor | undefined {
  if (!cursor) return undefined;
  const [iso, id] = cursor.split('_');
  const createdAt = new Date(iso ?? '');
  if (!id || !/^[a-f\d]{24}$/i.test(id) || Number.isNaN(createdAt.getTime())) return undefined;
  return { createdAt, id };
}

function toDto(event: AuditEventRecord): AuditEventDto {
  return {
    id: event.id,
    action: event.action,
    actor: event.actor ? { name: event.actor.name, email: event.actor.email } : null,
    target: event.target ? { type: event.target.type, label: event.target.label } : null,
    metadata: event.metadata,
    ip: event.ip,
    createdAt: event.createdAt.toISOString(),
  };
}

export function createAuditService({
  repository,
  logger,
}: {
  repository: AuditRepository;
  logger: Logger;
}): AuditService {
  return {
    async record(event) {
      try {
        await repository.record(event);
      } catch (err) {
        logger.error({ err, action: event.action }, 'Failed to write audit event');
      }
    },

    async list(organizationId, { before, limit }) {
      // Ask for one extra row to know whether another page exists.
      const rows = await repository.list(organizationId, {
        before: decodeCursor(before),
        limit: limit + 1,
      });
      const page = rows.slice(0, limit);
      const last = page.at(-1);
      return {
        events: page.map(toDto),
        nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
      };
    },
  };
}
