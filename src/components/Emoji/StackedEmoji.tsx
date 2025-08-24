import React from 'react';

interface StackedEmojiProps {
  /**
   * Array of emoji characters to stack
   * First emoji will be the base, subsequent ones will be stacked on top with transparency
   */
  emojis: string[];
  /**
   * Size of the emoji container
   */
  size?: number;
  /**
   * Opacity for stacked emojis (0-1)
   */
  stackedOpacity?: number;
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Component to render multiple emojis stacked on top of each other with transparency
 * Used for commands that combine multiple concepts like "🛤️🚫" for path hiding
 */
export const StackedEmoji: React.FC<StackedEmojiProps> = ({
  emojis,
  size = 16,
  stackedOpacity = 0.8,
  className = ''
}) => {
  if (!emojis || emojis.length === 0) return null;
  
  if (emojis.length === 1) {
    return <span className={className} style={{ fontSize: size }}>{emojis[0]}</span>;
  }

  return (
    <span 
      className={`relative inline-block ${className}`}
      style={{ 
        width: `${size * 1.4}px`,  // Contenitore ancora più largo
        height: `${size * 1.4}px`, // Contenitore ancora più alto
        fontSize: `${size * 1.4}px`, // Font base ancora più grande
        lineHeight: '1',
        display: 'inline-block',
        position: 'relative',
        margin: '0',
        padding: '0'
      }}
    >
      {emojis.map((emoji, index) => (
        <span
          key={index}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: index === 0 ? 1 : stackedOpacity,
            zIndex: emojis.length - index, // First emoji has highest z-index
            fontSize: index === 0 ? `${size * 0.8}px` : `${size * 1.4}px`, // Proporzioni aggiornate
            margin: '0',
            padding: '0'
          }}
        >
          {emoji}
        </span>
      ))}
    </span>
  );
};

/**
 * Utility function to parse emoji strings like "🛤️🚫" into individual emojis
 */
export const parseEmojiString = (emojiString: string): string[] => {
  // Split emoji string by Unicode emoji boundaries
  const emojiRegex = /[\u{1F300}-\u{1F6FF}][\u{FE00}-\u{FE0F}]?|[\u{2600}-\u{27BF}][\u{FE00}-\u{FE0F}]?/gu;
  const matches = emojiString.match(emojiRegex);
  return matches || [emojiString];
};
