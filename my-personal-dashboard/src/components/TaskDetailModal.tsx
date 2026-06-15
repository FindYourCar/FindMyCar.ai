"use client";

import { useEffect } from "react";
import { Pencil, X } from "lucide-react";
import { Task, TaskStatus } from "@/types";
import { formatDate, PRIORITY_COLORS } from "@/lib/utils";

interface TaskDetailModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  todo: { bg: "bg-gray-500/15", text: "text-gray-300" },
  "in-progress": { bg: "bg-purple-500/15", text: "text-purple-400" },
  done: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
};

export default function TaskDetailModal({ open, task, onClose, onEdit }: TaskDetailModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !task) return null;

  const priorityStyle = PRIORITY_COLORS[task.priority];
  const statusStyle = STATUS_STYLES[task.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#121212] border border-[#d4af37]/30 rounded-2xl p-6 shadow-2xl shadow-black/60 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-[#262626] hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-white pr-8">{task.title}</h2>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}
          >
            {task.priority}
          </span>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#d4af37]/15 text-[#d4af37]">
            {task.category}
          </span>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Due Date</p>
            {task.dueDate ? (
              <p className="text-gray-200">{formatDate(task.dueDate)}</p>
            ) : (
              <p className="text-gray-500">No deadline</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-gray-200">{task.createdAt ? formatDate(task.createdAt) : "Unknown"}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-1.5">Description</p>
          {task.description ? (
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {task.description}
            </p>
          ) : (
            <p className="text-sm text-gray-500">No description</p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => onEdit(task)}
            className="flex items-center justify-center gap-2 flex-1 bg-[#d4af37] hover:bg-[#c4a030] transition-colors text-black font-medium rounded-lg py-2.5 text-sm"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#1c1c1c] hover:bg-[#262626] border border-border transition-colors text-gray-200 font-medium rounded-lg py-2.5 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
