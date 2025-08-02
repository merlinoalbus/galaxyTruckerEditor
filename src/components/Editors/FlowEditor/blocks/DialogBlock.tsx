import React from 'react';
import { MessageSquare } from 'lucide-react';
import { BaseBlock } from './BaseBlock';
import { BlockProps } from './index';

export const DialogBlock: React.FC<BlockProps> = (props) => {
  const { block, onDeleteBlock, onMoveUp, onMoveDown } = props;

  return (
    <BaseBlock
      className="bg-slate-900/20 border border-slate-700"
      icon={<MessageSquare className="w-5 h-5 text-slate-400" />}
      title="Dialog Container"
      onDeleteBlock={onDeleteBlock}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      blockId={block.id}
    >
      <div className="text-sm text-slate-300">
        <p>Dialog container for grouping related dialogue blocks.</p>
        <p className="text-xs text-slate-400 mt-1">
          Child blocks will be rendered within this dialog context.
        </p>
      </div>
    </BaseBlock>
  );
};