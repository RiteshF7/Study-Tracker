
'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, Active } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import React, { useState } from 'react';

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
  RED: Column;
  YELLOW: Column;
  GREEN: Column;
};

const columnColors = {
  RED: 'bg-red-500/10 border-red-500/50',
  YELLOW: 'bg-yellow-500/10 border-yellow-500/50',
  GREEN: 'bg-green-500/10 border-green-500/50',
};

const columnTitleColors = {
    RED: 'text-red-500',
    YELLOW: 'text-yellow-500',
    GREEN: 'text-green-500',
}

interface SortableItemProps {
    item: Item;
}

function SortableItem({ item }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                'p-3 rounded-lg bg-card shadow-sm border select-none flex items-center gap-2',
            )}
        >
            <GripVertical className="h-5 w-5 text-muted-foreground/50" />
            <span className="font-medium text-sm">{item.content}</span>
        </div>
    );
}

interface SortingBoardProps {
    columns: Columns;
    onDragEnd: (event: DragEndEvent) => void;
    isLoading: boolean;
}

export function SortingBoard({ columns, onDragEnd, isLoading }: SortingBoardProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );
    const [activeItem, setActiveItem] = useState<Item | null>(null);

    function findItem(id: string) {
        for (const column of Object.values(columns)) {
            const item = column.items.find(i => i.id === id);
            if (item) {
                return item;
            }
        }
        return null;
    }

    function handleDragStart(event: any) {
        const { active } = event;
        const item = findItem(active.id);
        setActiveItem(item);
    }

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="grid grid-cols-3 gap-6 items-start">
                {Object.entries(columns).map(([columnId, column]) => (
                    <SortableContext key={columnId} items={column.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                         <Card
                            className={cn(
                                'transition-colors h-full',
                                columnColors[columnId as keyof typeof columnColors],
                            )}
                        >
                            <CardHeader>
                                <CardTitle className={cn("text-lg font-semibold flex items-center justify-between", columnTitleColors[columnId as keyof typeof columnTitleColors])}>
                                    {column.title}
                                    <span className="text-sm font-normal bg-card text-muted-foreground rounded-full px-2 py-0.5">{column.items.length}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="min-h-[200px] space-y-2 p-4 pt-0">
                                {isLoading ? (
                                    <p className="text-sm text-center text-muted-foreground py-8">Loading subjects...</p>
                                ) : column.items.length === 0 ? (
                                    <div className="flex items-center justify-center h-full min-h-[150px] border-2 border-dashed border-muted-foreground/20 rounded-lg">
                                        <p className="text-sm text-muted-foreground/70">Drop subjects here</p>
                                    </div>
                                ) : (
                                    column.items.map((item) => (
                                        <SortableItem key={item.id} item={item} />
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </SortableContext>
                ))}
            </div>
             <DragOverlay>
                {activeItem ? (
                    <div className="p-3 rounded-lg bg-card shadow-lg border select-none flex items-center gap-2 ring-2 ring-primary">
                        <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                        <span className="font-medium text-sm">{activeItem.content}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
