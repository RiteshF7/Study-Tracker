
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortingBoard, type Columns } from '@/components/sorting-board';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { arrayMove } from '@dnd-kit/sortable';

const subjectDifficulties = {
  '1': { // Physics
    RED: ['Motion of System of Particles and Rigid Body (Rotational Motion)', 'Thermodynamics', 'Magnetic Effects of Current and Magnetism', 'Electromagnetic Induction and Alternating Currents', 'Optics'],
    YELLOW: ['Laws of Motion', 'Work, Energy and Power', 'Gravitation', 'Properties of Solids and Liquids', 'Oscillations and Waves', 'Electrostatics', 'Current Electricity', 'Dual Nature of Matter and Radiation', 'Atoms and Nuclei'],
    GREEN: ['Physical world and Measurement', 'Kinematics', 'Behaviour of Perfect Gas and Kinetic Theory', 'Electromagnetic Waves', 'Electronic Devices', 'Experimental Skills']
  },
  '2': { // Chemistry
    RED: ['Chemical Thermodynamics', 'Equilibrium', 'The p-Block Element (Group 13–18 overview)', 'Organic Compounds containing Oxygen', 'Coordination Compounds'],
    YELLOW: ['Structure of Atom', 'Chemical Bonding and Molecular Structure', 'Redox Reactions and Electrochemistry', 'The d-Block Element', 'The f-Block Element', 'Some Basic Principles of Organic Chemistry', 'Hydrocarbons', 'Organic Compounds containing Halogens', 'Organic Compounds containing Nitrogen'],
    GREEN: ['Some Basic Concepts of Chemistry', 'Classification of Elements and Periodicity in Properties', 'Purification and Characterisation of Organic Compounds', 'Biomolecules', 'Principles related to Practical Chemistry']
  },
  '3-JEE': { // Maths JEE
    RED: ['Integral Calculus', 'Three Dimensional Geometry', 'Permutations and Combinations', 'Probability'],
    YELLOW: ['Complex Numbers', 'Matrices and Determinants', 'Binomial Theorem', 'Sequence and Series', 'Limits, Continuity and Differentiability', 'Differential Equations', 'Vector Algebra', 'Trigonometry'],
    GREEN: ['Sets, Relations and Functions', 'Quadratic Equations', 'Coordinate Geometry', 'Statistics', 'Mathematical Reasoning']
  },
  '3-NEET': { // Biology NEET
    RED: ['Genetics and Evolution', 'Human Physiology', 'Plant Physiology'],
    YELLOW: ['Structural Organisation in Animals and Plants', 'Cell Structure and Function', 'Reproduction', 'Biotechnology and Its Applications'],
    GREEN: ['Diversity of Living World', 'Biology and Human Welfare', 'Ecology and Environment']
  }
};


export default function SortingPage() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useLocalStorage('selected-course', 'JEE');
  const [activeSet, setActiveSet] = useState('1');
  
  const allSubjectsConfig = useMemo(() => {
    if (activeSet === '1') {
      return subjectDifficulties['1'];
    } else if (activeSet === '2') {
      return subjectDifficulties['2'];
    } else if (activeSet === '3') {
      return course === 'JEE' ? subjectDifficulties['3-JEE'] : subjectDifficulties['3-NEET'];
    }
    return { RED: [], YELLOW: [], GREEN: [] };
  }, [activeSet, course]);


  const [columns, setColumns] = useLocalStorage<Columns>(`sorting-columns-set-${activeSet}-${course}`, {
    RED: { id: 'RED', title: 'RED', items: [] },
    YELLOW: { id: 'YELLOW', title: 'YELLOW', items: [] },
    GREEN: { id: 'GREEN', title: 'GREEN', items: [] },
  });

  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);

    if (allSubjectsConfig) {
      setColumns({
          RED: { id: 'RED', title: 'RED', items: allSubjectsConfig.RED.map(s => ({id: s, content: s})) },
          YELLOW: { id: 'YELLOW', title: 'YELLOW', items: allSubjectsConfig.YELLOW.map(s => ({id: s, content: s})) },
          GREEN: { id: 'GREEN', title: 'GREEN', items: allSubjectsConfig.GREEN.map(s => ({id: s, content: s})) },
      });
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSet, course]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id;
    const overId = over.id;
  
    setColumns((prevColumns) => {
      const activeContainer = active.data.current?.sortable.containerId as keyof Columns;
      const overContainer = over.data.current?.sortable.containerId as keyof Columns || overId as keyof Columns;
  
      if (!activeContainer || !overContainer || !prevColumns[activeContainer] || !prevColumns[overContainer]) {
        return prevColumns;
      }
  
      if (activeContainer === overContainer) {
        // Handle reordering within the same column
        const activeColumn = prevColumns[activeContainer];
        const oldIndex = activeColumn.items.findIndex(item => item.id === activeId);
        const newIndex = activeColumn.items.findIndex(item => item.id === overId);
  
        if (oldIndex !== newIndex) {
          const newItems = arrayMove(activeColumn.items, oldIndex, newIndex);
          return {
            ...prevColumns,
            [activeContainer]: {
              ...activeColumn,
              items: newItems,
            },
          };
        }
      } else {
        // Handle moving between different columns
        const activeColumn = prevColumns[activeContainer];
        const overColumn = prevColumns[overContainer];
  
        const activeIndex = activeColumn.items.findIndex(item => item.id === activeId);
        let overIndex = overColumn.items.findIndex(item => item.id === overId);
        if (overIndex < 0) {
          // If dragging onto the container itself, append to the end
          overIndex = overColumn.items.length;
        }

        const newActiveItems = [...activeColumn.items];
        const [movedItem] = newActiveItems.splice(activeIndex, 1);
  
        const newOverItems = [...overColumn.items];
        newOverItems.splice(overIndex, 0, movedItem);

        return {
          ...prevColumns,
          [activeContainer]: {
            ...activeColumn,
            items: newActiveItems,
          },
          [overContainer]: {
            ...overColumn,
            items: newOverItems,
          },
        };
      }
      return prevColumns;
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2 font-headline">Sorting</h1>
      <p className="text-muted-foreground mb-6">
        Drag and drop your subjects to categorize them by confidence level.
      </p>
      <div className="flex items-end justify-between mb-6">
        <div className="grid gap-2">
            <Label htmlFor="subject-set" className="mb-2 block">Subject Set</Label>
            <div className="flex items-center gap-2">
              <Button variant={activeSet === '1' ? 'default' : 'outline'} onClick={() => setActiveSet('1')}>Physics</Button>
              <Button variant={activeSet === '2' ? 'default' : 'outline'} onClick={() => setActiveSet('2')}>Chemistry</Button>
              <Button variant={activeSet === '3' ? 'default' : 'outline'} onClick={() => setActiveSet('3')}>
                {course === 'JEE' ? 'Maths' : 'Biology'}
              </Button>
            </div>
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




