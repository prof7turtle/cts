'use client';

import { useState } from 'react';
import type { ActionCategory } from './nodes/nodeTypes';

interface CustomHook {
  hookName: string;
  category: ActionCategory;
  functionName: string;
  moduleName: string;
  condition?: string;
  code: string;
}

interface CustomHookModalProps {
  onClose: () => void;
  onCreate: (hook: CustomHook) => void;
}

const categories: ActionCategory[] = ['Flow', 'Decision', 'Pre Hook', 'Post Hook'];

export default function CustomHookModal({ onClose, onCreate }: CustomHookModalProps) {
  const [formData, setFormData] = useState<CustomHook>({
    hookName: '',
    category: 'Pre Hook',
    functionName: '',
    moduleName: '',
    condition: '',
    code: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomHook, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomHook, string>> = {};

    if (!formData.hookName.trim()) {
      newErrors.hookName = 'Hook name is required';
    }
    if (!formData.functionName.trim()) {
      newErrors.functionName = 'Function name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onCreate(formData);
    }
  };

  const handleChange = (
    field: keyof CustomHook,
    value: string | ActionCategory
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Custom Hook</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="hookName">Hook Name *</label>
            <input
              id="hookName"
              type="text"
              value={formData.hookName}
              onChange={(e) => handleChange('hookName', e.target.value)}
              className={errors.hookName ? 'error' : ''}
              placeholder="Enter hook name"
            />
            {errors.hookName && <span className="error-text">{errors.hookName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Action Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value as ActionCategory)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="functionName">Function Name *</label>
            <input
              id="functionName"
              type="text"
              value={formData.functionName}
              onChange={(e) => handleChange('functionName', e.target.value)}
              className={errors.functionName ? 'error' : ''}
              placeholder="Enter function name"
            />
            {errors.functionName && <span className="error-text">{errors.functionName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="moduleName">Module Name</label>
            <input
              id="moduleName"
              type="text"
              value={formData.moduleName}
              onChange={(e) => handleChange('moduleName', e.target.value)}
              placeholder="Enter module name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="condition">Condition (optional)</label>
            <input
              id="condition"
              type="text"
              value={formData.condition}
              onChange={(e) => handleChange('condition', e.target.value)}
              placeholder="Enter condition"
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">Code</label>
            <textarea
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Enter hook code"
              rows={15}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Hook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}