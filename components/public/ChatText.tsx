import React from 'react';

/**
 * Renderiza texto de chat de forma segura: **negrita**, *negrita* estilo WhatsApp y enlaces clicables.
 * No usa dangerouslySetInnerHTML.
 */
export default function ChatText({ text }: { text?: string | null }) {
  const safeText = typeof text === 'string' ? text : String(text || '');
  const tokens = safeText.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|https?:\/\/[^\s)]+)/g);
  return (
    <>
      {tokens.map((tok, i) => {
        if (!tok) return null;
        if (/^\*\*[^*]+\*\*$/.test(tok)) return <strong key={i}>{tok.slice(2, -2)}</strong>;
        if (/^\*[^*\n]+\*$/.test(tok)) return <strong key={i}>{tok.slice(1, -1)}</strong>;
        if (/^https?:\/\//.test(tok)) {
          const isCalendar = tok.includes('calendar.google.com');
          return (
            <a
              key={i}
              href={tok}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-cyan-300 hover:text-cyan-200 break-all"
            >
              {isCalendar ? '📅 Añadir a Google Calendar' : tok}
            </a>
          );
        }
        return <React.Fragment key={i}>{tok}</React.Fragment>;
      })}
    </>
  );
}
