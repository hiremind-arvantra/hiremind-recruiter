"use client";

import { useState } from "react";
import type { ConfirmState } from "./types";

const CLOSED: ConfirmState = { open: false, label: "", onConfirm: async () => {} };

/**
 * Drop-in replacement for the confirmDelete boilerplate repeated across step
 * components (Step2Professional, Step3Skills, CertificationsSection).
 *
 * Usage:
 *   const { confirm, triggerDelete, resetConfirm } = useConfirmDelete();
 *
 *   // Open the confirm dialog:
 *   triggerDelete(`Delete "${item.name}"?`, () => handleDelete(item.id));
 *
 *   // Cancel callback:
 *   <ConfirmDialog onCancel={resetConfirm} ... />
 *
 *   // At the start of your async delete handler:
 *   resetConfirm();
 */
export function useConfirmDelete() {
  const [confirm, setConfirm] = useState<ConfirmState>(CLOSED);

  const triggerDelete = (label: string, action: () => Promise<void>) =>
    setConfirm({ open: true, label, onConfirm: action });

  const resetConfirm = () => setConfirm(CLOSED);

  return { confirm, triggerDelete, resetConfirm };
}
