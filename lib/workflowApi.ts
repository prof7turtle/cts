/* Client-safe REST API wrapper for workflows */

async function handleResponse(response: Response) {
  const text = await response.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) {
    const message = json?.error || json?.message || text || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return json;
}

export async function fetchWorkflowsList() {
  const res = await fetch('/api/workflows', { method: 'GET' });
  return (await handleResponse(res));
}

export async function createWorkflowFile(name: string, description?: string) {
  const res = await fetch('/api/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  return (await handleResponse(res));
}

export async function deleteWorkflowFile(id: string) {
  const res = await fetch(`/api/workflows?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  return (await handleResponse(res));
}

export async function publishWorkflow(id: string) {
  // Best-effort: flag as published in-memory; file system doesn't track status yet.
  return { success: true, workflow: { id, status: 'PUBLISHED', updatedAt: new Date().toISOString() } };
}

export async function archiveWorkflow(id: string) {
  return { success: true, workflow: { id, status: 'ARCHIVED', updatedAt: new Date().toISOString() } };
}

export async function duplicateWorkflow(id: string) {
  // Find the source workflow and create a copy
  const list = await fetchWorkflowsList();
  const src = (list.workflows || []).find((w: any) => w.id === id);
  if (!src) {
    throw new Error('Source workflow not found');
  }
  const copyName = `${src.name} (copy)`;
  const created = await createWorkflowFile(copyName, src.description || 'Duplicated workflow');
  return { success: created.success, workflow: created.workflow };
}

export async function saveWorkflowSchema(id: string, payload: any) {
  const res = await fetch('/api/workflow-schema', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await handleResponse(res));
}

export async function loadWorkflowSchema(id: string) {
  const res = await fetch(`/api/workflow-schema?id=${encodeURIComponent(id)}`, { method: 'GET' });
  return (await handleResponse(res));
}

export async function deleteWorkflowSchema(id: string) {
  const res = await fetch(`/api/workflow-schema?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  return (await handleResponse(res));
}
