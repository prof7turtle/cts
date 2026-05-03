'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowUp, X } from 'lucide-react';
import { extractAgentPayload } from '@/lib/workflow-ai/parser';
import { normalizeHookConfigConditions } from '@/lib/workflow-ai/normalize';
import { getMessageText } from './messageUtils';
import type { WorkflowChatProps } from './types';

interface Props extends WorkflowChatProps {
  onClose?: () => void;
}

export default function WorkflowChatPanel({ currentSchema, onApplySchema, onClose }: Props) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const appliedSignature = useRef<string>('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, sendMessage, status: chatStatus } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const latestAssistantText = useMemo(() => {
    const reversed = [...messages].reverse();
    const latestAssistant = reversed.find((m) => m.role === 'assistant');
    return latestAssistant ? getMessageText(latestAssistant) : '';
  }, [messages]);

  const isResponding = chatStatus === 'submitted' || chatStatus === 'streaming';

  useEffect(() => {
    if (!latestAssistantText) return;
    const payload = extractAgentPayload(latestAssistantText);
    const signature = JSON.stringify(payload);
    if (signature === appliedSignature.current) return;
    if (payload.hookConfig) {
      onApplySchema(normalizeHookConfigConditions(payload.hookConfig));
      setStatus('Applied HookConfig from AI response.');
      appliedSignature.current = signature;
    }
  }, [latestAssistantText, onApplySchema]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || isResponding) return;
    setStatus(null);
    await sendMessage({ text }, { body: { workflowContext: currentSchema } });
    setPrompt('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <div className="chat-panel-header-left">
          <span className="chat-panel-ai-dot" />
          <h3>Workflow AI</h3>
        </div>
        <div className="chat-panel-header-right">
          <span className="chat-state">
            {chatStatus === 'streaming' ? 'Thinking…' : 'Ready'}
          </span>
          {onClose && (
            <button
              type="button"
              className="chat-panel-close"
              onClick={onClose}
              title="Close AI panel"
              aria-label="Close AI panel"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            Describe the workflow you want. The assistant will generate a HookSchema and update the canvas.
          </div>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={`chat-msg ${message.role === 'user' ? 'chat-msg-user' : 'chat-msg-assistant'}`}
          >
            <header>{message.role === 'user' ? 'You' : 'AI'}</header>
            <pre>{getMessageText(message)}</pre>
          </article>
        ))}

        {isResponding && (
          <article className="chat-msg chat-msg-assistant chat-msg-loading">
            <header>AI</header>
            <div className="chat-loading-line">
              Generating
              <span className="chat-dots" aria-hidden="true">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          </article>
        )}
      </div>

      {status && <div className="chat-status">{status}</div>}

      {/* Input area — send button INSIDE the box */}
      <div className="chat-input-wrap">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Add a Pre hook for /Quote/Summary…"
          rows={2}
          disabled={isResponding}
          aria-label="Message input"
        />
        <button
          type="button"
          className={`chat-send-btn ${!prompt.trim() || isResponding ? 'disabled' : ''}`}
          onClick={handleSend}
          disabled={!prompt.trim() || isResponding}
          title="Send (Enter)"
          aria-label="Send message"
        >
          <ArrowUp size={14} strokeWidth={2.5} />
        </button>
      </div>
      <p className="chat-input-hint">Enter to send · Shift+Enter for new line</p>
    </section>
  );
}
