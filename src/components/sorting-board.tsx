
'use client';

import { DragDropContext, Droppable, Draggable, type OnDragEndResponder } from 'react-beautiful-dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

type Item = {
    id: string;
    content: string;
};

type Column = {
    id: string;
    title: string;
    items: Item[];
}

export type Columns = {
  subjects: Column;
  RED: Column;
  YELLOW: Column;
  GREEN: Column;
};

const columnColors = {
  RED: 'bg-red-500/10 border-red-500/50',
  YELLOW: 'bg-yellow-500/10 border-yellow-500/50',
  GREEN: 'bg-green-500/10 border-green-500/50',
  subjects: 'bg-muted/50 border-border',
};

const columnTitleColors = {
    RED: 'text-red-500',
    YELLOW: 'text-yellow-500',
    GREEN: 'text-green-500',
    subjects: 'text-muted-foreground',
}

interface SortingBoardProps {
    columns: Columns;
    onDragEnd: OnDragEndResponder;
    isLoading: boolean;
}

export function SortingBoard({ columns, onDragEnd, isLoading }: SortingBoardProps) {
  return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId}>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <Card
                    className={cn(
                      'transition-colors',
                      columnColors[columnId as keyof typeof columnColors],
                      snapshot.isDraggingOver && 'bg-primary/10'
                    )}
                  >
                    <CardHeader>
                      <CardTitle className={cn("text-lg font-semibold flex items-center justify-between", columnTitleColors[columnId as keyof typeof columnTitleColors])}>
                        {column.title}
                        <span className="text-sm font-normal bg-card text-muted-foreground rounded-full px-2 py-0.5">{column.items.length}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[200px] space-y-2 p-4 pt-0"
                    >
                      {isLoading && columnId === 'subjects' ? (
                         <p className="text-sm text-center text-muted-foreground py-8">Loading subjects...</p>
                      ) : column.items.length === 0 ? (
                         <div className="flex items-center justify-center h-full min-h-[150px]">
                             <p className="text-sm text-muted-foreground/70">Drop subjects here</p>
                         </div>
                      ) : (
                        column.items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  'p-3 rounded-lg bg-card shadow-sm border select-none flex items-center gap-2',
                                  snapshot.isDragging && 'shadow-lg ring-2 ring-primary'
                                )}
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                                <span className="font-medium text-sm">{item.content}</span>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
  );
}
