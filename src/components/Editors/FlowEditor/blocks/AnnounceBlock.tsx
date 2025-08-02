import React from 'react';
import { Volume2 } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';
import { MultiLanguageTextEditor } from '../components/MultiLanguageTextEditor';

export const AnnounceBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock } = props;

  return (
    <BaseBlock
      className="bg-yellow-900/20 border border-yellow-700"
      icon={<Volume2 className="w-5 h-5 text-yellow-400" />}
      title="Announce"
      padding="px-3 py-1.5"
      titleWidth="w-48"
    >
      <div className="min-h-[28px] flex items-center w-full">
        <MultiLanguageTextEditor
          {...props}
          fieldName="text"
          defaultText="New announcement"
          placeholder="Enter announcement text..."
        />
      </div>
    </BaseBlock>
  );
};