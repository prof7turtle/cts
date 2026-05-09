import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const SCHEMAS_DIR = path.join(process.cwd(), 'data', 'workflow-schemas');

async function ensureDir() {
  try {
    await fs.mkdir(SCHEMAS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create schemas directory:', error);
  }
}

interface WorkflowListItem {
  id: string;
  name: string;
  status: string;
  description?: string;
  version: number;
  updatedAt: string;
  createdAt: string;
}

// GET - List all workflows
export async function GET(req: NextRequest) {
  try {
    await ensureDir();

    const files = await fs.readdir(SCHEMAS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const workflows: WorkflowListItem[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(SCHEMAS_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const schema = JSON.parse(data);

        workflows.push({
          id: schema.id,
          name: schema.name || 'Untitled',
          status: 'DRAFT',
          description: schema.description || '',
          version: 1,
          updatedAt: schema.updatedAt || new Date().toISOString(),
          createdAt: schema.createdAt || new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Failed to parse workflow file ${file}:`, error);
      }
    }

    // Sort by updatedAt descending (newest first)
    workflows.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      workflows,
      total: workflows.length,
    });
  } catch (error) {
    console.error('GET workflows error:', error);
    return NextResponse.json(
      { error: 'Failed to list workflows', success: false },
      { status: 500 }
    );
  }
}

// POST - Create a new workflow
export async function POST(req: NextRequest) {
  try {
    await ensureDir();

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Workflow name is required', success: false },
        { status: 400 }
      );
    }

    // Generate workflow ID
    const id = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const workflow = {
      id,
      name,
      description: description || '',
      clientCode: 'COGITATE',
      nodes: [],
      edges: [],
      createdAt: now,
      updatedAt: now,
    };

    const filePath = path.join(SCHEMAS_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));

    return NextResponse.json({
      success: true,
      workflow: {
        id,
        name,
        status: 'DRAFT',
        description: description || '',
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('POST workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', success: false },
      { status: 500 }
    );
  }
}

// DELETE - Delete a workflow
export async function DELETE(req: NextRequest) {
  try {
    await ensureDir();

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing workflow ID', success: false },
        { status: 400 }
      );
    }

    const filePath = path.join(SCHEMAS_DIR, `${id}.json`);

    try {
      await fs.unlink(filePath);
      return NextResponse.json({
        success: true,
        message: 'Workflow deleted successfully',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Workflow not found', success: false },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('DELETE workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow', success: false },
      { status: 500 }
    );
  }
}
