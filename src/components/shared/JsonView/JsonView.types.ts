export interface JsonViewProps {
  /** Se true, il componente è visibile */
  showJsonView: boolean;
  /** L'oggetto JSON da visualizzare */
  scriptJson: any;
  /** Titolo personalizzabile del pannello */
  title?: string;
  /** Larghezza del pannello in pixel */
  width?: number;
  /** Se true, mostra il pulsante per nascondere la vista */
  showToggle?: boolean;
  /** Callback chiamato quando si toglie la vista */
  onToggleView?: (isVisible: boolean) => void;
  /** Placeholder da mostrare quando non c'è JSON */
  emptyPlaceholder?: string;
  /** Se true, permette la formattazione del JSON */
  allowFormatting?: boolean;
  /** Numero di spazi per l'indentazione (default: 2) */
  indentSize?: number;
}

export interface JsonDisplayOptions {
  /** Se true, il JSON viene mostrato in formato compatto */
  minified?: boolean;
  /** Numero di spazi per l'indentazione */
  indentSize?: number;
  /** Se true, mostra informazioni aggiuntive sul JSON */
  showMetadata?: boolean;
}