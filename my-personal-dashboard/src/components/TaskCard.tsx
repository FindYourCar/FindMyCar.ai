"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types";
import { formatDate, PRIORITY_COLORS } from "@/lib/utils";
import { CalendarClock, Pencil } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
}

function isOverdue(task: Task): boolean {
  if (task.status === "done") return false;
  if (!task.dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate < today;
}

export default function TaskCard({ task, onEdit, onView }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = isOverdue(task);
  const priorityStyle = PRIORITY_COLORS[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onView(task)}
      className={`group relative bg-[#1c1c1c] border rounded-xl p-4 flex flex-col gap-2 cursor-grab active:cursor-grabbing touch-none ${
        overdue ? "border-red-500/50" : "border-border"
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(task);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-400 bg-[#1c1c1c]/80 opacity-0 group-hover:opacity-100 hover:bg-[#262626] hover:text-white transition-opacity"
        aria-label="Edit task"
      >
        <Pencil size={13} />
      </button>

      <div className="flex items-start justify-between gap-2 pr-6">
        <h3 className="text-sm font-medium leading-snug">{task.title}</h3>
        <span
          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}
        >
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
          {task.category}
        </span>
        {task.dueDate ? (
          <span
            className={`flex items-center gap-1 text-[11px] ${
              overdue ? "text-red-400 font-semibold" : "text-gray-500"
            }`}
          >
            <CalendarClock size={12} />
            {formatDate(task.dueDate)}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <CalendarClock size={12} />
            No deadline
          </span>
        )}
      </div>
    </div>
  );
}
