import {
  isExportImageNode,
  isImageEditNode,
  isUploadNode,
  isTextInputNode,
  type CanvasEdge,
  type CanvasNode,
} from '../domain/canvasNodes';
import type { GraphImageResolver } from './ports';

export class DefaultGraphImageResolver implements GraphImageResolver {
  collectInputImages(nodeId: string, nodes: CanvasNode[], edges: CanvasEdge[]): string[] {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const sourceNodeIds = edges
      .filter((edge) => edge.target === nodeId)
      .map((edge) => edge.source);

    const images = sourceNodeIds
      .map((sourceId) => nodeById.get(sourceId))
      .flatMap((node) => this.extractImages(node));

    return [...new Set(images)];
  }

  collectInputTexts(nodeId: string, nodes: CanvasNode[], edges: CanvasEdge[]): string[] {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const sourceNodeIds = edges
      .filter((edge) => edge.target === nodeId)
      .map((edge) => edge.source);

    const texts = sourceNodeIds
      .map((sourceId) => nodeById.get(sourceId))
      .flatMap((node) => this.extractTexts(node));

    return texts;
  }

  private extractImages(node: CanvasNode | undefined): string[] {
    if (!node) {
      return [];
    }

    if (isUploadNode(node) || isImageEditNode(node) || isExportImageNode(node)) {
      return node.data.imageUrl ? [node.data.imageUrl] : [];
    }

    return [];
  }

  private extractTexts(node: CanvasNode | undefined): string[] {
    if (!node) {
      return [];
    }

    if (isTextInputNode(node)) {
      return node.data.content ? [node.data.content] : [];
    }

    return [];
  }
}
