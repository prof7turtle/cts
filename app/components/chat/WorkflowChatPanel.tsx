'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { extractAgentPayload } from '@/lib/workflow-ai/parser';
import { normalizeHookConfigConditions } from '@/lib/workflow-ai/normalize';
import { getMessageText } from './messageUtils';
import type { WorkflowChatProps } from './types';

export default function WorkflowChatPanel({
  currentSchema,
  onApplySchema,
}: WorkflowChatProps) {
  const [prompt, setPrompt] = useState('');
  const appliedSignature = useRef<string>('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status: chatStatus } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const latestAssistantText = useMemo(() => {
    const reversed = [...messages].reverse();
    const latestAssistant = reversed.find((message) => message.role === 'assistant');
    return latestAssistant ? getMessageText(latestAssistant) : '';
  }, [messages]);
  const latestPayload = useMemo(
    () => (latestAssistantText ? extractAgentPayload(latestAssistantText) : null),
    [latestAssistantText]
  );
  const isResponding = chatStatus === 'submitted' || chatStatus === 'streaming';
  const status = latestPayload?.hookConfig ? 'Applied HookConfig from chat response.' : null;

  useEffect(() => {
    if (!latestPayload?.hookConfig) return;

    const signature = JSON.stringify(latestPayload);
    if (signature === appliedSignature.current) return;

    onApplySchema(normalizeHookConfigConditions(latestPayload.hookConfig));
    appliedSignature.current = signature;
  }, [latestPayload, onApplySchema]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || isResponding) {
      return;
    }
    await sendMessage(
      { text },
      {
        body: {
          workflowContext: currentSchema,
        },
      }
    );
    setPrompt('');
  };

  return (
    <section className="chat-panel">
      <div className="chat-panel-header">
        <h3>Workflow AI</h3>
        <span className="chat-state">
          {chatStatus === 'streaming' ? 'Thinking...' : 'Ready'}
        </span>
      </div>

      <div ref={listRef} className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            Describe the workflow you want. The assistant will generate HookSchema JSON and update the canvas.
          </div>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={`chat-msg ${message.role === 'user' ? 'chat-msg-user' : 'chat-msg-assistant'}`}
          >
            <header>{message.role === 'user' ? 'You' : 'Assistant'}</header>
            <pre>{getMessageText(message)}</pre>
          </article>
        ))}

        {isResponding && (
          <article className="chat-msg chat-msg-assistant chat-msg-loading">
            <header>Assistant</header>
            <div className="chat-loading-line">
              Generating response
              <span className="chat-dots" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          </article>
        )}
      </div>

      {status && <div className="chat-status">{status}</div>}

      <div className="chat-input-row">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="e.g. Add a Pre hook for /Quote/Summary that runs ExecuteUnderwritingRules after GenerateQuoteNumber"
          rows={3}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isResponding}
        >
          {isResponding ? 'Sending...' : 'Send'}
        </button>
      </div>
    </section>
  );
}
