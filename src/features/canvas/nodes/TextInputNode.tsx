import { memo, useCallback } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CANVAS_NODE_TYPES, type TextInputNodeData } from '@/features/canvas/domain/canvasNodes';
import { resolveNodeDisplayName } from '@/features/canvas/domain/nodeDisplay';
import { NodeHeader, NODE_HEADER_FLOATING_POSITION_CLASS } from '@/features/canvas/ui/NodeHeader';
import { NodeResizeHandle } from '@/features/canvas/ui/NodeResizeHandle';
import { TextOptimizer } from '@/features/canvas/ui/TextOptimizer';
import { useCanvasStore } from '@/stores/canvasStore';

type TextInputNodeProps = NodeProps & {
  id: string;
  data: TextInputNodeData;
  selected?: boolean;
};

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 120;
const MIN_WIDTH = 180;
const MIN_HEIGHT = 80;
const MAX_WIDTH = 900;
const MAX_HEIGHT = 400;

export const TextInputNode = memo(({
  id,
  data,
  selected,
  width,
  height,
}: TextInputNodeProps) => {
  const { t } = useTranslation();
  const setSelectedNode = useCanvasStore((state) => state.setSelectedNode);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const content = typeof data.content === 'string' ? data.content : '';
  const resolvedTitle = resolveNodeDisplayName(CANVAS_NODE_TYPES.textInput, data);
  const resolvedWidth = Math.max(MIN_WIDTH, Math.round(width ?? DEFAULT_WIDTH));
  const resolvedHeight = Math.max(MIN_HEIGHT, Math.round(height ?? DEFAULT_HEIGHT));

  const handleOptimizedText = useCallback((optimizedText: string) => {
    updateNodeData(id, { content: optimizedText });
  }, [id, updateNodeData]);

  return (
    <div
      className={`
        group relative h-full w-full overflow-visible rounded-[var(--node-radius)] border bg-surface-dark/85 p-1.5 transition-colors duration-150
        ${selected
          ? 'border-accent shadow-[0_0_0_1px_rgba(59,130,246,0.32)]'
          : 'border-[rgba(15,23,42,0.22)] hover:border-[rgba(15,23,42,0.34)] dark:border-[rgba(255,255,255,0.22)] dark:hover:border-[rgba(255,255,255,0.34)]'}
      `}
      style={{ width: resolvedWidth, height: resolvedHeight }}
      onClick={() => setSelectedNode(id)}
    >
      <NodeHeader
        className={NODE_HEADER_FLOATING_POSITION_CLASS}
        icon={<MessageSquare className="h-4 w-4" />}
        titleText={resolvedTitle}
        editable
        onTitleChange={(nextTitle) => updateNodeData(id, { displayName: nextTitle })}
      />

      <NodeResizeHandle
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        maxWidth={MAX_WIDTH}
        maxHeight={MAX_HEIGHT}
      />

      <Handle
        type="source"
        id="source"
        position={Position.Right}
        className="absolute top-1/2 -translate-y-1/2 -right-1.5 h-3 w-3 rounded-full border-2 border-accent bg-surface-dark transition-all duration-200 hover:scale-110"
      />

      {selected ? (
        <div className="flex flex-col h-full">
          <textarea
            autoFocus
            value={content}
            onChange={(event) => {
              const nextValue = event.target.value;
              updateNodeData(id, { content: nextValue });
            }}
            placeholder={t('node.textInput.placeholder')}
            className="nodrag nowheel flex-1 min-h-0 w-full resize-none border-none bg-transparent px-1 py-0.5 text-sm leading-6 text-text-dark outline-none placeholder:text-text-muted/70"
          />
          <div className="shrink-0 px-1 pb-1">
            <TextOptimizer
              inputText={content}
              onOptimizedText={handleOptimizedText}
            />
          </div>
        </div>
      ) : (
        <div className="nodrag nowheel h-full w-full overflow-auto px-1 py-0.5 text-sm leading-6 text-text-dark">
          {content.trim().length > 0 ? (
            <div className="break-words">
              {content}
            </div>
          ) : (
            <div className="pt-1 text-text-muted">{t('node.textInput.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
});

TextInputNode.displayName = 'TextInputNode';
