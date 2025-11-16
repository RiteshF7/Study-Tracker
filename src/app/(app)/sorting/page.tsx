
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortingBoard, type Columns } from '@/components/sorting-board';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { arrayMove } from '@dnd-kit/sortable';

const subjectTopics = {
  '1': [
    'Physical world and Measurement', 'Kinematics', 'Laws of Motion', 'Work, Energy and Power', 'Motion of System of Particles and Rigid Body (Rotational Motion)', 'Gravitation', 'Properties of Solids and Liquids', 'Thermodynamics', 'Behaviour of Perfect Gas and Kinetic Theory', 'Oscillations and Waves', 
    'Electrostatics', 'Current Electricity', 'Magnetic Effects of Current and Magnetism', 'Electromagnetic Induction and Alternating Currents', 'Electromagnetic Waves', 'Optics', 'Dual Nature of Matter and Radiation', 'Atoms and Nuclei', 'Electronic Devices', 'Experimental Skills'
  ],
  '2': [
    'Some Basic Concepts of Chemistry', 'Structure of Atom', 'Chemical Bonding and Molecular Structure', 'Chemical Thermodynamics', 'Equilibrium', 'Redox Reactions and Electrochemistry', 'The Redox Concept (Electrochemistry basics)', 'Classification of Elements and Periodicity in Properties', 'The p-Block Element (Group 13–18 overview)', 'The d-Block Element', 
    'The f-Block Element', 'Coordination Compounds', 'Purification and Characterisation of Organic Compounds', 'Some Basic Principles of Organic Chemistry', 'Hydrocarbons', 'Organic Compounds containing Halogens', 'Organic Compounds containing Oxygen', 'Organic Compounds containing Nitrogen', 'Biomolecules', 'Principles related to Practical Chemistry'
  ],
  '3-JEE': [
    'Sets, Relations and Functions', 'Complex Numbers', 'Quadratic Equations', 'Matrices and Determinants', 'Permutations and Combinations', 'Binomial Theorem', 'Sequence and Series', 'Limits, Continuity and Differentiability', 'Integral Calculus', 'Differential Equations', 'Coordinate Geometry', 'Three Dimensional Geometry', 'Vector Algebra', 'Statistics and Probability', 'Trigonometry', 'Mathematical Reasoning'
  ],
  '3-NEET': [
    'Diversity of Living World', 'Structural Organisation in Animals and Plants', 'Cell Structure and Function', 'Plant Physiology', 'Human Physiology', 
    'Reproduction', 'Genetics and Evolution', 'Biology and Human Welfare', 'Biotechnology and Its Applications', 'Ecology and Environment'
  ]
};


export default function SortingPage() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);

    if (allSubjects.length > 0) {
      setColumns((prevColumns) => {
        
        const allItemsInPrevColumns = [
            ...(prevColumns.RED?.items || []),
            ...(prevColumns.YELLOW?.items || []),
            ...(prevColumns.GREEN?.items || []),
        ];

        if (allItemsInPrevColumns.length === 0) {
            // Randomly distribute subjects into R, Y, G
            const redItems: typeof allSubjects = [];
            const yellowItems: typeof allSubjects = [];
            const greenItems: typeof allSubjects = [];
            const shuffledSubjects = [...allSubjects].sort(() => Math.random() - 0.5);

            shuffledSubjects.forEach((subject, index) => {
                const mod = index % 3;
                if (mod === 0) {
                    redItems.push(subject);
                } else if (mod === 1) {
                    yellowItems.push(subject);
                } else {
                    greenItems.push(subject);
                }
            });

            return {
                RED: { id: 'RED', title: 'RED', items: redItems },
                YELLOW: { id: 'YELLOW', title: 'YELLOW', items: yellowItems },
                GREEN: { id: 'GREEN', title: 'GREEN', items: greenItems },
            };
        }

        const newColumns = { ...prevColumns };
        const allCurrentItems = new Set(allSubjects.map(s => s.id));
        const allItemsInStorage = new Set(allItemsInPrevColumns.map(i => i.id));
        
        const newSubjectsToAdd = allSubjects.filter(s => !allItemsInStorage.has(s.id));
        if (!newColumns.GREEN) {
          newColumns.GREEN = { id: 'GREEN', title: 'GREEN', items: [] };
        }
        newColumns.GREEN.items = [...newColumns.GREEN.items, ...newSubjectsToAdd];

        Object.keys(newColumns).forEach(columnId => {
            (newColumns[columnId as keyof Columns]).items = (newColumns[columnId as keyof Columns]).items.filter(item => allCurrentItems.has(item.id));
        });

        return newColumns;
      });
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubjects, activeSet, course]);

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
        if (activeIndex !== -1 && overIndex !== -1) {
            activeColumn.items = arrayMove(activeColumn.items, activeIndex, overIndex);
        }
      } else {
        const [movedItem] = activeColumn.items.splice(activeIndex, 1);

        if (over.id in newColumns) {
            overColumn.items.push(movedItem);
        } else {
            if (overIndex === -1) {
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
        <SortingBoard columns={columns} onDragEnd={onDragEnd} isLoading={isLoading} />
      ) : (
         <div className="text-center py-10 text-muted-foreground">Loading sorting board...</div>
      )}
    </div>
  );
}
