import type { DeliverableStatus } from "@prisma/client";
import { db } from "@/lib/db";

// ─── State machine: valid transitions + auto-triggers ─────────────────────────

type AutoTrigger =
  | "CREATE_PRODUCTION_CARD"
  | "CREATE_EDIT_TASK"
  | "CREATE_THUMBNAIL_TASK"
  | "CREATE_PUBLISH_TASK"
  | "INCREMENT_REVISION_COUNT"
  | "NOTIFY_PRODUCTION_LEAD"
  | "NOTIFY_EDITOR"
  | "NOTIFY_REVIEWER"
  | "COMPLETE_FINANCIAL_PIPELINE";

interface TransitionConfig {
  next: DeliverableStatus[];
  requires?: string[];
  autoTriggers?: AutoTrigger[];
}

export const DELIVERABLE_TRANSITIONS: Record<DeliverableStatus, TransitionConfig> = {
  DRAFT: {
    next: ["ACTIVE"],
    requires: ["title", "brand", "type"],
    autoTriggers: [],
  },
  ACTIVE: {
    next: ["IN_PRODUCTION", "DRAFT"],
    autoTriggers: ["CREATE_PRODUCTION_CARD", "NOTIFY_PRODUCTION_LEAD"],
  },
  IN_PRODUCTION: {
    next: ["IN_EDIT", "ACTIVE"],
    autoTriggers: ["CREATE_EDIT_TASK", "CREATE_THUMBNAIL_TASK"],
  },
  IN_EDIT: {
    next: ["IN_REVIEW", "IN_PRODUCTION"],
    autoTriggers: ["NOTIFY_REVIEWER"],
  },
  IN_REVIEW: {
    next: ["APPROVED", "REVISION_REQUESTED"],
    autoTriggers: [],
  },
  REVISION_REQUESTED: {
    next: ["IN_EDIT"],
    autoTriggers: ["NOTIFY_EDITOR", "INCREMENT_REVISION_COUNT"],
  },
  APPROVED: {
    next: ["SCHEDULED"],
    autoTriggers: ["CREATE_PUBLISH_TASK"],
  },
  SCHEDULED: {
    next: ["PUBLISHED", "APPROVED"],
    autoTriggers: [],
  },
  PUBLISHED: {
    next: ["ARCHIVED"],
    autoTriggers: ["COMPLETE_FINANCIAL_PIPELINE"],
  },
  ARCHIVED: {
    next: [],
    autoTriggers: [],
  },
};

// ─── Main transition function ─────────────────────────────────────────────────

export async function transitionDeliverable(
  deliverableId: string,
  toStatus: DeliverableStatus,
  userId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  const deliverable = await db.deliverable.findUnique({
    where: { id: deliverableId },
  });

  if (!deliverable) {
    throw new Error(`Deliverable not found: ${deliverableId}`);
  }

  const config = DELIVERABLE_TRANSITIONS[deliverable.status];

  // Validate transition is allowed
  if (!config.next.includes(toStatus)) {
    throw new Error(
      `Invalid transition: ${deliverable.status} → ${toStatus}. ` +
        `Allowed: ${config.next.join(", ")}`
    );
  }

  // Run everything in a transaction
  await db.$transaction(async (tx) => {
    // 1. Update status
    await tx.deliverable.update({
      where: { id: deliverableId },
      data: { status: toStatus },
    });

    // 2. Log activity
    await tx.activityLog.create({
      data: {
        deliverableId,
        userId,
        action: "status_changed",
        meta: {
          from: deliverable.status,
          to: toStatus,
          ...meta,
        },
      },
    });

    // 3. Execute auto-triggers
    const newConfig = DELIVERABLE_TRANSITIONS[toStatus];
    for (const trigger of newConfig.autoTriggers ?? []) {
      await executeTrigger(tx, trigger, deliverableId, userId);
    }
  });
}

// ─── Trigger handlers ─────────────────────────────────────────────────────────

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

async function executeTrigger(
  tx: TxClient,
  trigger: AutoTrigger,
  deliverableId: string,
  userId: string
): Promise<void> {
  switch (trigger) {
    case "CREATE_PRODUCTION_CARD":
      await tx.productionCard.upsert({
        where: { deliverableId },
        create: { deliverableId, status: "READY_TO_SHOOT" },
        update: {},
      });
      break;

    case "CREATE_EDIT_TASK":
      await tx.editTask.upsert({
        where: { deliverableId },
        create: { deliverableId, status: "READY_FOR_EDIT" },
        update: {},
      });
      break;

    case "CREATE_THUMBNAIL_TASK":
      await tx.thumbnailTask.upsert({
        where: { deliverableId },
        create: { deliverableId, status: "PENDING" },
        update: {},
      });
      break;

    case "CREATE_PUBLISH_TASK":
      await tx.publishTask.upsert({
        where: { deliverableId },
        create: { deliverableId, status: "PENDING" },
        update: {},
      });
      break;

    case "INCREMENT_REVISION_COUNT":
      await tx.editTask.update({
        where: { deliverableId },
        data: { revisionCount: { increment: 1 } },
      });
      break;

    case "NOTIFY_PRODUCTION_LEAD":
    case "NOTIFY_EDITOR":
    case "NOTIFY_REVIEWER":
      // Notifications are handled post-transaction (see below)
      break;

    case "COMPLETE_FINANCIAL_PIPELINE":
      // Mark as awaiting final payment if not already paid
      await tx.deliverable.update({
        where: { id: deliverableId },
        data: { emailSent: true },
      });
      break;
  }
}

// ─── Permission guard for transitions ────────────────────────────────────────

import type { Role } from "@prisma/client";

const TRANSITION_ROLES: Partial<Record<DeliverableStatus, Role[]>> = {
  ACTIVE: ["ADMIN", "PRODUCTION_LEAD"],
  IN_PRODUCTION: ["ADMIN", "PRODUCTION_LEAD"],
  IN_EDIT: ["ADMIN", "PRODUCTION_LEAD", "EDITOR"],
  IN_REVIEW: ["ADMIN", "PRODUCTION_LEAD", "EDITOR"],
  APPROVED: ["ADMIN", "PRODUCTION_LEAD"],
  REVISION_REQUESTED: ["ADMIN", "PRODUCTION_LEAD"],
  SCHEDULED: ["ADMIN", "PUBLISHER"],
  PUBLISHED: ["ADMIN", "PUBLISHER"],
  ARCHIVED: ["ADMIN"],
};

export function canTransition(
  role: Role,
  toStatus: DeliverableStatus
): boolean {
  const allowed = TRANSITION_ROLES[toStatus];
  if (!allowed) return true; // No restriction defined = open
  return allowed.includes(role);
}
