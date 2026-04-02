export function getMessageText(message: unknown): string {
  if (!message || typeof message !== 'object') return '';
  const typed = message as {
    content?: unknown;
    parts?: Array<{ type?: string; text?: string }>;
  };

  if (typeof typed.content === 'string') {
    return typed.content;
  }

  if (Array.isArray(typed.parts)) {
    return typed.parts
      .filter((part) => part?.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('\n');
  }

  return '';
}
