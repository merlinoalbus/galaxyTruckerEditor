import React from 'react';
import { 
  SayBlock,
  AskBlock,
  AnnounceBlock,
  ShowCharacterBlock,
  HideCharacterBlock,
  ChangeCharacterBlock,
  SetVariableBlock,
  ResetVariableBlock,
  SetToVariableBlock,
  DialogBlock,
  MenuBlock,
  IfBlock,
  BlockProps
} from './blocks';

// Generic fallback block for unknown types
const UnknownBlock: React.FC<BlockProps> = ({ block, onDeleteBlock }) => (
  <div className="bg-gray-900/20 border border-gray-700 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="font-medium text-white">{block.command.type}:</span>
        <span className="text-gray-300">{block.command.content}</span>
      </div>
      {onDeleteBlock && (
        <button
          onClick={() => onDeleteBlock(block.id)}
          className="p-1 text-red-400 hover:text-red-300"
        >
          ×
        </button>
      )}
    </div>
  </div>
);

export const renderBlockContent = (props: BlockProps): JSX.Element => {
  const { block } = props;

  // Ensure onDeleteBlock is passed through properly
  const propsWithDelete = {
    ...props,
    onDeleteBlock: props.onDeleteBlock || ((blockId: string) => {
      console.log('Delete block:', blockId);
      // This should be implemented by the parent component
    })
  };

  // Map block types to their respective components
  const blockComponents: Record<string, React.FC<BlockProps>> = {
    'dialogue': SayBlock,
    'question': AskBlock,
    'announce': AnnounceBlock,
    'show_character': ShowCharacterBlock,
    'hide_character': HideCharacterBlock,
    'change_character': ChangeCharacterBlock,
    'variable_set': SetVariableBlock,
    'variable_reset': ResetVariableBlock,
    'variable_set_to': SetToVariableBlock,
    'dialog_container': DialogBlock,
    'menu_container': MenuBlock,
    'condition_container': IfBlock,
    'menu': MenuBlock,
    'if': IfBlock,
  };

  const BlockComponent = blockComponents[block.command.type] || UnknownBlock;
  
  return <BlockComponent {...propsWithDelete} />;
};