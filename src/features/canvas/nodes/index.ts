import type { NodeTypes } from '@xyflow/react';

import { GroupNode } from './GroupNode';
import { ImageEditNode } from './ImageEditNode';
import { ImageNode } from './ImageNode';
import { StoryboardGenNode } from './StoryboardGenNode';
import { StoryboardNode } from './StoryboardNode';
import { TextAnnotationNode } from './TextAnnotationNode';
import { TextInputNode } from './TextInputNode';
import { UploadNode } from './UploadNode';

export const nodeTypes: NodeTypes = {
  exportImageNode: ImageNode,
  groupNode: GroupNode,
  imageNode: ImageEditNode,
  storyboardGenNode: StoryboardGenNode,
  storyboardNode: StoryboardNode,
  textAnnotationNode: TextAnnotationNode,
  textInputNode: TextInputNode,
  uploadNode: UploadNode,
};

export { GroupNode, ImageEditNode, ImageNode, StoryboardGenNode, StoryboardNode, TextAnnotationNode, TextInputNode, UploadNode };
