
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortingBoard, type Columns } from '@/components/sorting-board';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { arrayMove } from '@dnd-kit/sortable';

// TODO: Move to a separate file, maybe a JSON in /lib
const subjectTopics = {
  '1': [
    'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power', 'System of Particles', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves', 
    'Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductor Electronics'
  ],
  '2': [
    'Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 's-Block Elements', 'p-Block Elements (Group 13 & 14)', 'Organic Chemistry - Some Basic Principles', 'Hydrocarbons', 'Environmental Chemistry',
    'The Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'General Principles and Processes of Isolation of Elements', 'p-Block Elements (Group 15-18)', 'd and f Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life'
  ],
  '3-JEE': [
    'Sets, Relations and Functions', 'Complex Numbers', 'Quadratic Equations', 'Matrices and Determinants', 'Permutations and Combinations', 'Binomial Theorem', 'Sequence and Series', 'Limits, Continuity and Differentiability', 'Integral Calculus', 'Differential Equations', 'Coordinate Geometry', 'Three Dimensional Geometry', 'Vector Algebra', 'Statistics and Probability', 'Trigonometry', 'Mathematical Reasoning'
  ],
  '3-NEET': [
    'Diversity in Living World', 'Structural Organisation in Animals and Plants', 'Cell Structure and Function', 'Plant Physiology', 'Human Physiology',
    'Reproduction', 'Genetics and Evolution', 'Biology and Human Welfare', 'Biotechnology and Its Applications', 'Ecology and Environment'
  ]
};


export default function SortingPage() {
  const [isClient, setIsClient] = useState(false);
  const [course] = useLocalStorage('selected-course', 'JEE');
  const [activeSet, setActiveSet] = useState('1');
  
  const allSubjects = useMemo(() => {
    let topics: string[] = [];
    if (activeSet === '1') {
      topics = subjectTopics['1'];
    } else if (activeSet === '2') {
      topics = subjectTopics['2'];
    } else if (activeSet === '3') {
      topics = course === 'JEE' ? subjectTopics['3-JEE'] : subjectTopics['3-NEET'];
    }
    return topics.map(topic => ({ id: topic, content: topic }));
  }, [activeSet, course]);


  const [columns, setColumns] = useLocalStorage<Columns>(`sorting-columns-set-${activeSet}-${course}`, {
    RED: { id: 'RED', title: 'RED', items: [] },
    YELLOW: { id: 'YELLOW', title: 'YELLOW', items: [] },
    GREEN: { id: 'GREEN', title: 'GREEN', items: [] },
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (allSubjects.length > 0 && isClient) {
      setColumns((prevColumns) => {
        // Create a fresh default state
        const defaultState = {
            RED: { id: 'RED', title: 'RED', items: [] },
            YELLOW: { id: 'YELLOW', title: 'YELLOW', items: [] },
            GREEN: { id: 'GREEN', title: 'GREEN', items: allSubjects },
        };
        
        // Check if there's existing data for this set. If not, use the default.
        const allItemsInPrevColumns = [
            ...(prevColumns.RED?.items || []),
            ...(prevColumns.YELLOW?.items || []),
            ...(prevColumns.GREEN?.items || []),
        ];

        if (allItemsInPrevColumns.length === 0) {
            return defaultState;
        }

        // If there IS existing data, reconcile it with the current subject list.
        const newColumns = { ...prevColumns };
        const allCurrentItems = new Set(allSubjects.map(s => s.id));
        const allItemsInStorage = new Set(allItemsInPrevColumns.map(i => i.id));
        
        // Add new subjects (that are not in storage yet) to GREEN column
        const newSubjectsToAdd = allSubjects.filter(s => !allItemsInStorage.has(s.id));
        newColumns.GREEN.items = [...newColumns.GREEN.items, ...newSubjectsToAdd];

        // Remove subjects from columns if they no longer exist in the master list
        Object.keys(newColumns).forEach(columnId => {
            (newColumns[columnId as keyof Columns]).items = (newColumns[columnId as keyof Columns]).items.filter(item => allCurrentItems.has(item.id));
        });

        return newColumns;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubjects, isClient, activeSet, course]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      return;
    }

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || over.id;

    if (!activeContainer || !overContainer) {
      return;
    }

    setColumns((prev) => {
      const newColumns = { ...prev };
      const activeColumn = newColumns[activeContainer as keyof Columns];
      const overColumn = newColumns[overContainer as keyof Columns];
      
      if (!activeColumn || !overColumn) {
        return prev;
      }

      const activeIndex = activeColumn.items.findIndex(item => item.id === activeId);
      let overIndex = overColumn.items.findIndex(item => item.id === overId);

      if (activeContainer === overContainer) {
        // Reordering within the same column
        if (activeIndex !== -1 && overIndex !== -1) {
            activeColumn.items = arrayMove(activeColumn.items, activeIndex, overIndex);
        }
      } else {
        // Moving to a different column
        const [movedItem] = activeColumn.items.splice(activeIndex, 1);

        if (over.id in newColumns) {
            // Dropping on the column itself
            overColumn.items.push(movedItem);
        } else {
            // Dropping on an item within the column
            if (overIndex === -1) {
                // If overIndex is not found (e.g., dropping on padding), add to end
                overIndex = overColumn.items.length;
            }
            overColumn.items.splice(overIndex, 0, movedItem);
        }
      }
      return newColumns;
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2 font-headline">Sorting</h1>
      <p className="text-muted-foreground mb-6">
        Drag and drop your subjects to categorize them by confidence level.
      </p>
      <div className="mb-6">
          <Label htmlFor="subject-set" className="mb-2 block">Subject Set</Label>
          <div className="flex items-center gap-2">
            <Button variant={activeSet === '1' ? 'default' : 'outline'} onClick={() => setActiveSet('1')}>Physics</Button>
            <Button variant={activeSet === '2' ? 'default' : 'outline'} onClick={() => setActiveSet('2')}>Chemistry</Button>
            <Button variant={activeSet === '3' ? 'default' : 'outline'} onClick={() => setActiveSet('3')}>
              {course === 'JEE' ? 'Maths' : 'Biology'}
            </Button>
          </div>
      </div>
      {isClient ? (
        <SortingBoard columns={columns} onDragEnd={onDragEnd} isLoading={false} />
      ) : (
         <div className="text-center py-10 text-muted-foreground">Loading sorting board...</div>
      )}
    </div>
  );
}
