// Canvas block types
export type BlockType = 'branch' | 'leaf';

// Direction for expansion
type Direction = 'up' | 'down' | 'left' | 'right';

// Base block interface
export interface CanvasBlock {
  id: string;
  type: BlockType;
  label: string;
  content?: string; // For answers or mission statement
  parentId?: string;
  children: string[];
  directionFromParent?: Direction;
}

// Canvas model
export interface CanvasModel {
  blocks: Record<string, CanvasBlock>;
  rootIds: string[]; // Top-level branches
}

// Example usage:
// const model: CanvasModel = { ... };
// model.blocks['blockId']

// Utility to export questions and answers
export function exportQuestionsAndAnswers(model: CanvasModel): string {
  const lines: string[] = [];
  function traverse(id: string, depth = 0) {
    const block = model.blocks[id];
    if (!block) return;
    const indent = '  '.repeat(depth);
    if (block.type === 'branch') {
      lines.push(`${indent}Branch: ${block.label}`);
      if (block.content) lines.push(`${indent}  Mission: ${block.content}`);
    } else {
      lines.push(`${indent}Leaf: ${block.label}`);
      if (block.content) lines.push(`${indent}  Answer: ${block.content}`);
    }
    block.children.forEach(childId => traverse(childId, depth + 1));
  }
  model.rootIds.forEach(rootId => traverse(rootId));
  return lines.join('\n');
}
