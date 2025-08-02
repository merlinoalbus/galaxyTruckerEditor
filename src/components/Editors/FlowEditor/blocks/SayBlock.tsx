import React from 'react';
import { MessageCircle } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { MultiLanguageTextEditor } from '../components/MultiLanguageTextEditor';

export const SayBlock: React.FC<BlockProps> = (props) => {
  const { block, languages, onDeleteBlock, onMoveUp, onMoveDown } = props;

  const currentCharacter = block.metadata?.currentCharacter;
  const characterInfo = currentCharacter ? currentCharacter.name : '';

  return (
    <BaseBlock
      className="bg-green-900/20 border border-green-700"
      icon={<MessageCircle className="w-5 h-5 text-blue-400" />}
      title="Say"
      subtitle={characterInfo}
      padding="px-3 py-1.5"
      titleWidth="w-48"
    >
      <div className="min-h-[28px] flex items-center w-full">
        <MultiLanguageTextEditor
          {...props}
          fieldName="text"
          defaultText="..."
          placeholder="Dialogue..."
        />
      </div>
    </BaseBlock>
  );
};