import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Valid values ─────────────────────────────────────────────────────────
const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// ─── Helper: format task record ───────────────────────────────────────────
function formatTask(task: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; name: string; color: string } | null;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() || null,
    projectId: task.projectId,
    project: task.project ? { id: task.project.id, name: task.project.name, color: task.project.color } : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

// ─── Helper: format project record ────────────────────────────────────────
function formatProject(project: {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
}) {
  return {
    id: project.id,
    name: project.name,
    color: project.color,
    taskCount: project.tasks?.length ?? 0,
    tasks: project.tasks?.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
    })),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

// ─── GET Handler ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      // ── List all tasks ──
      case 'list': {
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const project = searchParams.get('project');

        const where: Record<string, unknown> = {};
        if (status && VALID_STATUSES.includes(status)) {
          where.status = status;
        }
        if (priority && VALID_PRIORITIES.includes(priority)) {
          where.priority = priority;
        }
        if (project) {
          where.projectId = project;
        }

        const tasks = await db.task.findMany({
          where,
          include: { project: true },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
        });

        // Stats
        const totalTasks = await db.task.count();
        const todoCount = await db.task.count({ where: { status: 'todo' } });
        const inProgressCount = await db.task.count({ where: { status: 'in_progress' } });
        const doneCount = await db.task.count({ where: { status: 'done' } });

        return NextResponse.json({
          tasks: tasks.map(formatTask),
          stats: {
            total: totalTasks,
            todo: todoCount,
            inProgress: inProgressCount,
            done: doneCount,
          },
        });
      }

      // ── List all projects ──
      case 'projects': {
        const projects = await db.project.findMany({
          include: { tasks: { select: { id: true, title: true, status: true, priority: true } } },
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          projects: projects.map(formatProject),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Ação GET inválida. Disponíveis: list, projects' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[JARVIS TASKS GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
      { status: 500 }
    );
  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ── Create task ──
      case 'create': {
        const { title, description, priority, projectId, dueDate } = body as {
          title?: string;
          description?: string;
          priority?: string;
          projectId?: string;
          dueDate?: string;
        };

        if (!title) {
          return NextResponse.json(
            { error: 'Título é obrigatório' },
            { status: 400 }
          );
        }

        // Validate priority
        if (priority && !VALID_PRIORITIES.includes(priority)) {
          return NextResponse.json(
            { error: `Prioridade inválida. Use: ${VALID_PRIORITIES.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate project exists
        if (projectId) {
          const project = await db.project.findUnique({ where: { id: projectId } });
          if (!project) {
            return NextResponse.json(
              { error: 'Projeto não encontrado' },
              { status: 404 }
            );
          }
        }

        const task = await db.task.create({
          data: {
            title,
            description: description || null,
            status: 'todo',
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : null,
            projectId: projectId || null,
          },
          include: { project: true },
        });

        return NextResponse.json(
          { task: formatTask(task) },
          { status: 201 }
        );
      }

      // ── Update task ──
      case 'update': {
        const { id, title, description, status, priority, projectId, dueDate } = body as {
          id?: string;
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          projectId?: string;
          dueDate?: string;
        };

        if (!id) {
          return NextResponse.json(
            { error: 'ID da tarefa é obrigatório' },
            { status: 400 }
          );
        }

        const existing = await db.task.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: 'Tarefa não encontrada' },
            { status: 404 }
          );
        }

        // Validate status
        if (status && !VALID_STATUSES.includes(status)) {
          return NextResponse.json(
            { error: `Status inválido. Use: ${VALID_STATUSES.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate priority
        if (priority && !VALID_PRIORITIES.includes(priority)) {
          return NextResponse.json(
            { error: `Prioridade inválida. Use: ${VALID_PRIORITIES.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate project exists
        if (projectId) {
          const project = await db.project.findUnique({ where: { id: projectId } });
          if (!project) {
            return NextResponse.json(
              { error: 'Projeto não encontrado' },
              { status: 404 }
            );
          }
        }

        const data: Record<string, unknown> = {};
        if (title) data.title = title;
        if (description !== undefined) data.description = description || null;
        if (status) data.status = status;
        if (priority) data.priority = priority;
        if (projectId !== undefined) data.projectId = projectId || null;
        if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

        const task = await db.task.update({
          where: { id },
          data,
          include: { project: true },
        });

        return NextResponse.json({ task: formatTask(task) });
      }

      // ── Delete task ──
      case 'delete': {
        const { id } = body as { id?: string };
        if (!id) {
          return NextResponse.json(
            { error: 'ID da tarefa é obrigatório' },
            { status: 400 }
          );
        }

        const existing = await db.task.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: 'Tarefa não encontrada' },
            { status: 404 }
          );
        }

        await db.task.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      // ── Create project ──
      case 'create_project': {
        const { name, color } = body as { name?: string; color?: string };
        if (!name) {
          return NextResponse.json(
            { error: 'Nome do projeto é obrigatório' },
            { status: 400 }
          );
        }

        const project = await db.project.create({
          data: {
            name,
            color: color || '#00d4ff',
          },
          include: { tasks: { select: { id: true, title: true, status: true, priority: true } } },
        });

        return NextResponse.json(
          { project: formatProject(project) },
          { status: 201 }
        );
      }

      // ── Delete project ──
      case 'delete_project': {
        const { id } = body as { id?: string };
        if (!id) {
          return NextResponse.json(
            { error: 'ID do projeto é obrigatório' },
            { status: 400 }
          );
        }

        const existing = await db.project.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: 'Projeto não encontrado' },
            { status: 404 }
          );
        }

        // Delete all tasks in this project first (SetNull will set projectId to null)
        await db.project.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Ação POST inválida. Disponíveis: create, update, delete, create_project, delete_project' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[JARVIS TASKS POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao processar tarefa' },
      { status: 500 }
    );
  }
}
