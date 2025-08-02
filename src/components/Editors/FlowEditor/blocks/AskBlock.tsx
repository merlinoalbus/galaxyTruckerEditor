import React from 'react';
import { HelpCircle } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { MultiLanguageTextEditor } from '../components/MultiLanguageTextEditor';

export const AskBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock } = props;

  const currentCharacter = block.metadata?.currentCharacter;
  const characterInfo = currentCharacter ? `(${currentCharacter.name})` : '';

  return (
    <BaseBlock
      className="bg-blue-900/20 border border-blue-700"
      icon={<HelpCircle className="w-5 h-5 text-blue-400" />}
      title="Ask"
      subtitle={characterInfo}
      padding="px-3 py-1.5"
      titleWidth="w-48"
    >
      <div className="min-h-[28px] flex items-center w-full">
        <MultiLanguageTextEditor
          {...props}
          fieldName="text"
          defaultText="New question"
          placeholder="Enter question text..."
        />
      </div>
    </BaseBlock>
  );
};