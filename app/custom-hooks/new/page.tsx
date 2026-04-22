'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import type { ActionCategory } from '@/app/components/nodes/nodeTypes';
import {
  createCustomHook,
  getCustomHookById,
  updateCustomHook,
  type NewCustomHook,
} from '@/app/components/customHooksStore';

const categories: ActionCategory[] = ['Flow', 'Decision', 'Pre Hook', 'Post Hook'];

export default function NewCustomHookPage() {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState('/?view=builder');
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextReturnTo = params.get('returnTo');
    const editId = params.get('editId');

    if (nextReturnTo) {
      setReturnTo(nextReturnTo);
    }

    if (editId) {
      const existingHook = getCustomHookById(editId);
      if (!existingHook) {
        setNotFoundMessage('Custom hook not found. You can create a new hook instead.');
        return;
      }

      setEditingHookId(editId);
      setFormData({
        hookName: existingHook.hookName,
        category: existingHook.category,
        functionName: existingHook.functionName,
        moduleName: existingHook.moduleName,
        condition: existingHook.condition ?? '',
        code: existingHook.code,
      });
    }
  }, []);

  const [formData, setFormData] = useState<NewCustomHook>({
    hookName: '',
    category: 'Pre Hook',
    functionName: '',
    moduleName: '',
    condition: '',
    code: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof NewCustomHook, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof NewCustomHook, value: string | ActionCategory) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof NewCustomHook, string>> = {};

    if (!formData.hookName.trim()) {
      nextErrors.hookName = 'Hook name is required';
    }

    if (!formData.functionName.trim()) {
      nextErrors.functionName = 'Function name is required';
    }

    if (!formData.code.trim()) {
      nextErrors.code = 'Code is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSaving(true);

    if (editingHookId) {
      updateCustomHook(editingHookId, formData);
    } else {
      createCustomHook(formData);
    }

    router.push(returnTo);
  };

  const isEditMode = Boolean(editingHookId);

  return (
    <main className="custom-hook-page">
      <header className="custom-hook-page-header">
        <h1>{isEditMode ? 'Edit Custom Hook' : 'Create Custom Hook'}</h1>
        <p>
          {isEditMode
            ? 'Update hook metadata and code in Monaco editor.'
            : 'Define hook metadata and implement logic in Monaco editor.'}
        </p>
      </header>

      {notFoundMessage && <p className="custom-hook-warning">{notFoundMessage}</p>}

      <form className="custom-hook-form" onSubmit={handleSave}>
        <div className="custom-hook-grid">
          <div className="custom-hook-field">
            <label htmlFor="hookName">Hook Name *</label>
            <input
              id="hookName"
              value={formData.hookName}
              onChange={(event) => handleChange('hookName', event.target.value)}
              placeholder="Enter hook name"
              className={errors.hookName ? 'field-error' : ''}
            />
            {errors.hookName && <span className="error-text-light">{errors.hookName}</span>}
          </div>

          <div className="custom-hook-field">
            <label htmlFor="category">Action Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(event) => handleChange('category', event.target.value as ActionCategory)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="custom-hook-field">
            <label htmlFor="functionName">Function Name *</label>
            <input
              id="functionName"
              value={formData.functionName}
              onChange={(event) => handleChange('functionName', event.target.value)}
              placeholder="Enter function name"
              className={errors.functionName ? 'field-error' : ''}
            />
            {errors.functionName && <span className="error-text-light">{errors.functionName}</span>}
          </div>

          <div className="custom-hook-field">
            <label htmlFor="moduleName">Module Name</label>
            <input
              id="moduleName"
              value={formData.moduleName}
              onChange={(event) => handleChange('moduleName', event.target.value)}
              placeholder="@cogitate/core-pos-components"
            />
          </div>
        </div>

        <div className="custom-hook-field">
          <label htmlFor="condition">Condition (optional)</label>
          <input
            id="condition"
            value={formData.condition}
            onChange={(event) => handleChange('condition', event.target.value)}
            placeholder="Transaction.Type === 'Quote'"
          />
        </div>

        <div className="custom-hook-field">
          <label>Code *</label>
          <div className={`custom-hook-editor ${errors.code ? 'editor-error' : ''}`}>
            <Editor
              height="360px"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={formData.code}
              onChange={(value) => handleChange('code', value ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbersMinChars: 3,
                automaticLayout: true,
              }}
            />
          </div>
          {errors.code && <span className="error-text-light">{errors.code}</span>}
        </div>

        <div className="custom-hook-actions">
          <button type="button" className="btn-secondary-light" onClick={() => router.push(returnTo)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary-light" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEditMode ? 'Update Custom Hook' : 'Save Custom Hook'}
          </button>
        </div>
      </form>
    </main>
  );
}
