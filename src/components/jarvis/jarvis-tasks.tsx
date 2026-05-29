'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  CircleDot,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Filter,
  FolderOpen,
  Loader2,
  X,
  ChevronRight,
  Calendar,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useJarvisStore, type Task, type Project } from '@/lib/jarvis-store';
import { useJarvisVoice } from '@/hooks/use-jarvis-voice';

// ─── Helpers ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  high: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  medium: { label: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  low: { label: 'Baixa', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Square; color: string }> = {
  todo: { label: 'A fazer', icon: Square, color: 'text-muted-foreground/50' },
  in_progress: { label: 'Em progresso', icon: CircleDot, color: 'text-jarvis-cyan' },
  done: { label: 'Concluído', icon: CheckSquare, color: 'text-emerald-400' },
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d atraso`;
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays <= 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function isOverdue(dateStr: string | null, status: string): boolean {
  if (!dateStr || status === 'done') return false;
  return new Date(dateStr) < new Date();
}

// ─── Skeleton Card ────────────────────────────────────────────────────

function TaskSkeleton() {
  return (
    <div className="rounded-lg border border-jarvis-border/20 bg-jarvis-dark/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 bg-jarvis-cyan/10 rounded" />
        <Skeleton className="h-3.5 w-40 bg-jarvis-cyan/10" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-4 w-12 bg-jarvis-cyan/10 rounded-full" />
        <Skeleton className="h-4 w-16 bg-jarvis-cyan/10 rounded-full" />
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────

function TaskCard({
  task,
  onUpdate,
  onDelete,
  projects,
}: {
  task: Task;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
  projects: Project[];
}) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusConf = STATUS_CONFIG[task.status];
  const StatusIcon = statusConf.icon;
  const overdue = isOverdue(task.dueDate, task.status);
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;

  const cycleStatus = useCallback(() => {
    const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    onUpdate(task.id, { status: nextStatus as Task['status'] });
  }, [task.id, task.status, onUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-lg border p-3 transition-colors group ${
        task.status === 'done'
          ? 'border-emerald-400/10 bg-jarvis-dark/20 opacity-60'
          : overdue
            ? 'border-red-400/15 bg-red-400/5'
            : 'border-jarvis-border/15 bg-jarvis-dark/40'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <button
          onClick={cycleStatus}
          className="mt-0.5 shrink-0"
          aria-label={`Status: ${statusConf.label}`}
        >
          <StatusIcon className={`h-4 w-4 ${statusConf.color}`} />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium text-foreground/80 ${task.status === 'done' ? 'line-through' : ''}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-[10px] text-muted-foreground/30 line-clamp-1 mt-0.5">
              {task.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground/30 hover:text-red-400 shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1 mt-2 ml-6">
        {/* Priority badge */}
        <Badge
          variant="outline"
          className={`text-[8px] h-4 px-1.5 ${priority.bg} ${priority.color}`}
        >
          <Flag className="h-2.5 w-2.5 mr-0.5" />
          {priority.label}
        </Badge>

        {/* Project badge */}
        {project && (
          <Badge
            variant="outline"
            className="text-[8px] h-4 px-1.5 border-jarvis-border/20 text-muted-foreground/50"
          >
            <FolderOpen className="h-2.5 w-2.5 mr-0.5" />
            {project.name}
          </Badge>
        )}

        {/* Due date */}
        {task.dueDate && (
          <Badge
            variant="outline"
            className={`text-[8px] h-4 px-1.5 ${
              overdue
                ? 'border-red-400/20 text-red-400'
                : 'border-jarvis-border/20 text-muted-foreground/50'
            }`}
          >
            <Calendar className="h-2.5 w-2.5 mr-0.5" />
            {formatDueDate(task.dueDate)}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

// ─── Create Task Form ─────────────────────────────────────────────────

function CreateTaskForm({
  projects,
  onCreate,
  onCancel,
}: {
  projects: Project[];
  onCreate: (task: { title: string; description?: string; priority?: string; projectId?: string; dueDate?: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      projectId: projectId || undefined,
      dueDate: dueDate || undefined,
    });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setProjectId('');
    setDueDate('');
  }, [title, description, priority, projectId, dueDate, onCreate]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="jarvis-panel p-3 space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa..."
          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)..."
          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
        />
        <div className="flex gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-jarvis-dark/50 border border-jarvis-border/30 text-xs h-7 px-2 rounded-md text-foreground/80 focus:border-jarvis-cyan/40 focus:outline-none flex-1"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
          {projects.length > 0 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="bg-jarvis-dark/50 border border-jarvis-border/30 text-xs h-7 px-2 rounded-md text-foreground/80 focus:border-jarvis-cyan/40 focus:outline-none flex-1"
            >
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
        <Input
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder="Prazo (YYYY-MM-DD)..."
          type="date"
          className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs h-7 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            size="sm"
            className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-7 flex-1 text-xs"
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Criar Tarefa
          </Button>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground/50 hover:text-foreground/70"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Project Sidebar ──────────────────────────────────────────────────

function ProjectSidebar({
  projects,
  selectedProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}: {
  projects: Project[];
  selectedProject: string | null;
  onSelectProject: (id: string | null) => void;
  onCreateProject: (name: string, color?: string) => void;
  onDeleteProject: (id: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    await onCreateProject(newName.trim());
    setNewName('');
    setShowCreate(false);
  }, [newName, onCreateProject]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-jarvis-cyan/60">
          PROJETOS
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreate(!showCreate)}
          className="h-4 w-4 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
        >
          {showCreate ? <X className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
        </Button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome..."
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-[10px] h-6 text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button
                onClick={handleCreate}
                disabled={!newName.trim()}
                size="icon"
                className="h-6 w-6 bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 shrink-0"
              >
                <Plus className="h-2.5 w-2.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All tasks button */}
      <button
        onClick={() => onSelectProject(null)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors text-[11px] ${
          selectedProject === null
            ? 'bg-jarvis-cyan/10 text-jarvis-cyan'
            : 'text-muted-foreground/50 hover:bg-jarvis-dark/40 hover:text-foreground/60'
        }`}
      >
        <FolderOpen className="h-3 w-3 shrink-0" />
        Todas as Tarefas
      </button>

      {/* Project list */}
      <div className="space-y-0.5">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors group ${
              selectedProject === project.id
                ? 'bg-jarvis-cyan/10 text-jarvis-cyan'
                : 'text-muted-foreground/50 hover:bg-jarvis-dark/40 hover:text-foreground/60'
            }`}
          >
            <button
              onClick={() => onSelectProject(project.id)}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: project.color || '#00d4ff' }}
              />
              <span className="text-[11px] truncate">{project.name}</span>
              {project.taskCount !== undefined && (
                <span className="text-[9px] text-muted-foreground/30 ml-auto">{project.taskCount}</span>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground/30 hover:text-red-400 shrink-0"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Tasks Panel Component ───────────────────────────────────────

export function JarvisTasks() {
  const {
    tasks,
    projects,
    isLoadingTasks,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    loadProjects,
    createProject,
    deleteProject,
  } = useJarvisStore();

  const { speak, isSpeaking } = useJarvisVoice();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, [loadTasks, loadProjects]);

  // Reload tasks when filters change
  useEffect(() => {
    loadTasks({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      projectId: selectedProject || undefined,
    });
  }, [statusFilter, priorityFilter, selectedProject, loadTasks]);

  const handleVoiceBriefing = useCallback(() => {
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    speak(`Você tem ${todo} tarefas a fazer, ${inProgress} em progresso, e ${done} concluídas.`);
  }, [tasks, speak]);

  // Stats
  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <CheckSquare className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">
            Tarefas
          </h2>
          <p className="text-xs text-muted-foreground">
            Gerencie tarefas e projetos
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceBriefing}
            disabled={isSpeaking}
            className="h-7 w-7 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <CircleDot className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadTasks()}
            className="h-7 w-7 text-jarvis-cyan/50 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTasks ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 rounded-lg bg-jarvis-dark/50 border border-jarvis-border/10 p-2 text-center">
          <p className="text-lg font-bold text-foreground/80">{todoCount}</p>
          <p className="text-[9px] text-muted-foreground/40">A fazer</p>
        </div>
        <div className="flex-1 rounded-lg bg-jarvis-dark/50 border border-jarvis-cyan/10 p-2 text-center">
          <p className="text-lg font-bold text-jarvis-cyan">{inProgressCount}</p>
          <p className="text-[9px] text-jarvis-cyan/50">Em progresso</p>
        </div>
        <div className="flex-1 rounded-lg bg-jarvis-dark/50 border border-emerald-400/10 p-2 text-center">
          <p className="text-lg font-bold text-emerald-400">{doneCount}</p>
          <p className="text-[9px] text-emerald-400/50">Concluído</p>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Project sidebar - hidden on mobile */}
        <div className="hidden md:block w-40 shrink-0">
          <ProjectSidebar
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onCreateProject={createProject}
            onDeleteProject={deleteProject}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filters row */}
          <div className="flex gap-2 mb-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-jarvis-dark/50 border border-jarvis-border/30 text-[10px] h-6 px-2 rounded-md text-foreground/70 focus:border-jarvis-cyan/40 focus:outline-none"
            >
              <option value="">Todos status</option>
              <option value="todo">A fazer</option>
              <option value="in_progress">Em progresso</option>
              <option value="done">Concluído</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-jarvis-dark/50 border border-jarvis-border/30 text-[10px] h-6 px-2 rounded-md text-foreground/70 focus:border-jarvis-cyan/40 focus:outline-none"
            >
              <option value="">Todas prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
            <div className="flex-1" />
            <Button
              onClick={() => setShowCreate(!showCreate)}
              size="sm"
              className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-6 px-2 text-[10px] gap-1"
            >
              {showCreate ? <X className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
              <span className="hidden sm:inline">{showCreate ? 'Cancelar' : 'Nova'}</span>
            </Button>
          </div>

          {/* Create form */}
          <AnimatePresence>
            {showCreate && (
              <CreateTaskForm
                projects={projects}
                onCreate={async (task) => {
                  await createTask(task);
                  setShowCreate(false);
                }}
                onCancel={() => setShowCreate(false)}
              />
            )}
          </AnimatePresence>

          {/* Tasks list */}
          <ScrollArea className="flex-1 jarvis-scrollbar">
            {isLoadingTasks && tasks.length === 0 ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TaskSkeleton key={i} />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckSquare className="h-12 w-12 text-jarvis-cyan/10 mb-3" />
                <p className="text-sm text-muted-foreground/30 mb-1">
                  Nenhuma tarefa encontrada
                </p>
                <p className="text-[10px] text-muted-foreground/20">
                  Crie uma nova tarefa para começar
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    projects={projects}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
