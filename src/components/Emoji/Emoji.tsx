import React from 'react';
import joypixels from 'emoji-toolkit';

// Configurazione JoyPixels (emoji-toolkit)
joypixels.imageType = 'svg';
joypixels.sprites = false;
joypixels.path = 'https://cdn.jsdelivr.net/npm/emoji-toolkit@9.0.1/build/svg/';

type Props = { text: string; className?: string; title?: string };

export default function Emoji({ text, className, title }: Props) {
  // Converte stringhe contenenti emoji Unicode in <img src="..."> JoyPixels
  const html = joypixels.toImage(text);
  return (
    <span
      className={className}
      title={title}
      // L'HTML è generato dalla libreria emoji-toolkit (sorgente trusted)
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
