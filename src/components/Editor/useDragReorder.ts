import { useRef } from 'react';

/**
 * Native HTML5 drag-reorder for a list of items keyed by string id.
 * Wire onDragStart/onDragEnd/onDragOver onto each item element.
 */
export function useDragReorder(onReorder: (fromId: string, toId: string) => void) {
  const dragId = useRef<string | null>(null);
  const overId = useRef<string | null>(null);

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    (e.currentTarget as HTMLElement).classList.add('dragging');
  };
  const onDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    if (dragId.current && overId.current && dragId.current !== overId.current) {
      onReorder(dragId.current, overId.current);
    }
    dragId.current = null;
    overId.current = null;
  };
  const onDragOver = (id: string) => (e: React.DragEvent) => {
    if (dragId.current && dragId.current !== id) {
      e.preventDefault();
      overId.current = id;
      document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      (e.currentTarget as HTMLElement).classList.add('drag-over');
    }
  };

  return { onDragStart, onDragEnd, onDragOver };
}

export function reorderById<T extends { id: string }>(arr: T[], fromId: string, toId: string): T[] {
  const fromIdx = arr.findIndex((x) => x.id === fromId);
  const toIdx = arr.findIndex((x) => x.id === toId);
  if (fromIdx === -1 || toIdx === -1) return arr;
  const copy = arr.slice();
  const [moved] = copy.splice(fromIdx, 1);
  copy.splice(toIdx, 0, moved);
  return copy;
}

export type DragHandlers = ReturnType<typeof useDragReorder>;
