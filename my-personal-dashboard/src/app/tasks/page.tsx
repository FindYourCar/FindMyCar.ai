"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { loadTasks, saveTasks } from "@/lib/storage";
import {
  Task,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from "@/types";
import TaskModal from "@/components/TaskModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import KanbanColumn from "@/components/KanbanColumn";

const COLUMNS: { id: TaskStatus; title: string; accentClass: string }[] = [
  { id: "todo", title: "To Do", accentClass: "bg-gray-400" },
  { id: "in-progress", title: "In Progress", accentClass: "bg-purple-400" },
  { id: "done", title: "Done", accentClass: "bg-emerald-400" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [filterCategory, setFilterCategory] = useState<TaskCategory | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleSaveTask(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      const updated = exists
        ? prev.map((t) => (t.id === task.id ? task : t))
        : [...prev, task];
      saveTasks(updated);
      return updated;
    });
    setEditingTask(null);
  }

  function openNewTask() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEditTask(task: Task) {
    setDetailTask(null);
    setEditingTask(task);
    setModalOpen(true);
  }

  function openTaskDetail(task: Task) {
    setDetailTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setTasks((prev) => {
      const activeTask = prev.find((t) => t.id === activeId);
      if (!activeTask) return prev;

      let newStatus: TaskStatus = activeTask.status;
      if ((TASK_STATUSES as readonly string[]).includes(overId)) {
        newStatus = overId as TaskStatus;
      } else {
        const overTask = prev.find((t) => t.id === overId);
        if (overTask) newStatus = overTask.status;
      }

      let updated = prev.map((t) =>
        t.id === activeId ? { ...t, status: newStatus } : t
      );

      const overTask = updated.find((t) => t.id === overId);
      if (overTask && overTask.id !== activeId) {
        const oldIndex = updated.findIndex((t) => t.id === activeId);
        const newIndex = updated.findIndex((t) => t.id === overId);
        updated = arrayMove(updated, oldIndex, newIndex);
      }

      saveTasks(updated);
      return updated;
    });
  }

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => filterCategory === "all" || t.category === filterCategory)
      .filter((t) => filterPriority === "all" || t.priority === filterPriority);
  }, [tasks, filterCategory, filterPriority]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], "in-progress": [], done: [] };
    for (const t of filteredTasks) map[t.status].push(t);
    return map;
  }, [filteredTasks]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Task Manager</h1>
          <p className="text-gray-400 mt-1 text-sm">Organize your work with a kanban board</p>
        </div>
        <button
          onClick={openNewTask}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 transition-colors text-white font-medium rounded-lg px-4 py-2.5 text-sm"
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as TaskCategory | "all")}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All categories</option>
          {TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "all")}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All priorities</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              accentClass={col.accentClass}
              tasks={tasksByStatus[col.id]}
              onEdit={openEditTask}
              onView={openTaskDetail}
            />
          ))}
        </div>
      </DndContext>

      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />

      <TaskDetailModal
        open={Boolean(detailTask)}
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={openEditTask}
      />
    </div>
  );
}
