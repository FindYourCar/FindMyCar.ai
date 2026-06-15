"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/types";
import TaskCard from "@/components/TaskCard";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  accentClass: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
}

export default function KanbanColumn({ id, title, accentClass, tasks, onEdit, onView }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col bg-surface border border-border rounded-2xl p-4 min-h-[200px]">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${accentClass}`} />
        <h2 className="font-semibold text-sm">{title}</h2>
        <span className="text-xs text-gray-500 bg-[#1c1c1c] rounded-full px-2 py-0.5 ml-auto">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-3 flex-1 min-h-[120px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onView={onView} />
          ))}
          {tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-600 border border-dashed border-border rounded-xl py-8">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
