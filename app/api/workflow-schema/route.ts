import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

// Store schemas in a data directory
const SCHEMAS_DIR = path.join(process.cwd(), 'data', 'workflow-schemas');

// Ensure directory exists
async function ensureDir() {
  try {
    await fs.mkdir(SCHEMAS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create schemas directory:', error);
  }
}

interface WorkflowSchema {
  id: string;
  name: string;
  clientCode: string;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

// GET - Retrieve a workflow schema
export async function GET(req: NextRequest) {
  try {
    await ensureDir();
    
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing workflow ID' }, { status: 400 });
    }

    const filePath = path.join(SCHEMAS_DIR, `${id}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const schema: WorkflowSchema = JSON.parse(data);
      return NextResponse.json({ success: true, schema });
    } catch (error) {
      return NextResponse.json(
        { error: 'Schema not found', success: false },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('GET workflow schema error:', error);
    return NextResponse.json({ error: 'Failed to load schema' }, { status: 500 });
  }
}

// POST - Save a workflow schema
export async function POST(req: NextRequest) {
  try {
    await ensureDir();

    const body = await req.json();
    const { id, name, clientCode, nodes, edges } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const schema: WorkflowSchema = {
      id,
      name,
      clientCode: clientCode || 'COGITATE',
      nodes: nodes || [],
      edges: edges || [],
      createdAt: new Date().toISOString(),
      updatedAt: now,
    };

    // Check if file exists to preserve createdAt
    const filePath = path.join(SCHEMAS_DIR, `${id}.json`);
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      const existingSchema = JSON.parse(existing);
      schema.createdAt = existingSchema.createdAt;
    } catch {
      // File doesn't exist, use new createdAt
    }

    schema.updatedAt = now;

    await fs.writeFile(filePath, JSON.stringify(schema, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Schema saved successfully',
      schema,
    });
  } catch (error) {
    console.error('POST workflow schema error:', error);
    return NextResponse.json({ error: 'Failed to save schema' }, { status: 500 });
  }
}

// DELETE - Delete a workflow schema
export async function DELETE(req: NextRequest) {
  try {
    await ensureDir();

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing workflow ID' }, { status: 400 });
    }

    const filePath = path.join(SCHEMAS_DIR, `${id}.json`);

    try {
      await fs.unlink(filePath);
      return NextResponse.json({
        success: true,
        message: 'Schema deleted successfully',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Schema not found', success: false },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('DELETE workflow schema error:', error);
    return NextResponse.json({ error: 'Failed to delete schema' }, { status: 500 });
  }
}
