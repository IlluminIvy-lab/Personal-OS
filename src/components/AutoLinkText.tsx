import React from 'react';

interface AutoLinkTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

export const AutoLinkText: React.FC<AutoLinkTextProps> = ({
  text,
  className = '',
  linkClassName = 'text-cyan-400 hover:text-cyan-300 underline break-all font-mono',
}) => {
  if (!text) return null;

  // Regex to detect http:// or https:// or www. URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  const parts = text.split(urlRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
