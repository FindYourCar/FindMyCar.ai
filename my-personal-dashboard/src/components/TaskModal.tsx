"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  Task,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TaskCategory,
  TaskPriority,
} from "@/types";
import { uid } from "@/lib/utils";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task?: Task | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function TaskModal({ open, onClose, onSave, task }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [category, setCategory] = useState<TaskCategory>("Personal");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [dueDate, setDueDate] = useState(today());

  const isEditing = Boolean(task);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setCategory(task.category);
      setHasDeadline(Boolean(task.dueDate));
      setDueDate(task.dueDate || today());
    } else {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setCategory("Personal");
      setHasDeadline(false);
      setDueDate(today());
    }
  }, [open, task]);

  function handleClose() {
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: task?.id ?? uid(),
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      dueDate: hasDeadline ? dueDate : "",
      status: task?.status ?? "todo",
      createdAt: task?.createdAt ?? today(),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? "Edit Task" : "New Task"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finish assignment"
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
            rows={3}
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasDeadline}
              onChange={(e) => setHasDeadline(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-[#1c1c1c] text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
            />
            Add deadline
          </label>
          {hasDeadline && (
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-2 w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          )}
        </div>

        <button
          type="submit"
          className="mt-2 w-full bg-purple-500 hover:bg-purple-600 transition-colors text-white font-medium rounded-lg py-2.5 text-sm"
        >
          {isEditing ? "Save" : "Create Task"}
        </button>
      </form>
    </Modal>
  );
}
