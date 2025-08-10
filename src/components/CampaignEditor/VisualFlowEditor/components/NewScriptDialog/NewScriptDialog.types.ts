// Tipi per il componente NewScriptDialog

export interface NewScriptDialog {
  isOpen: boolean;
  fileName: string;
  error?: string;
}

export interface NewScriptDialogProps {
  newScriptDialog: NewScriptDialog;
  setNewScriptDialog: React.Dispatch<React.SetStateAction<NewScriptDialog>>;
  confirmNewScript: () => void;
}