
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SortingBoard, type Columns } from '@/components/sorting-board';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { arrayMove } from '@dnd-kit/sortable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const findContainer = (id: string, cols: Columns): keyof Columns | undefined => {
    if (id in cols) {
        return id as keyof Columns;
    }

    return (Object.keys(cols) as (keyof Columns)[]).find((key) =>
        cols[key].items.some((item) => item.id === id)
    );
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = String(active.id);
    const overId = String(over.id);
  
    setColumns((prevColumns) => {
      const activeContainerKey = findContainer(activeId, prevColumns);
      const overContainerKey = findContainer(overId, prevColumns);
  
      if (!activeContainerKey || !overContainerKey) {
        return prevColumns;
      }
      
      const activeContainer = prevColumns[activeContainerKey];
      const overContainer = prevColumns[overContainerKey];
      
      const newColumns = { ...prevColumns };
  
      if (activeContainerKey === overContainerKey) {
        // Reordering within the same column
        const oldIndex = activeContainer.items.findIndex((item) => item.id === activeId);
        const newIndex = overContainer.items.findIndex((item) => item.id === overId);
  
        if (oldIndex !== -1 && newIndex !== -1) {
            newColumns[activeContainerKey] = {
                ...activeContainer,
                items: arrayMove(activeContainer.items, oldIndex, newIndex),
            };
        }
      } else {
        // Moving to a different column
        const activeIndex = activeContainer.items.findIndex((item) => item.id === activeId);
        if (activeIndex === -1) return prevColumns;
  
        const [movedItem] = activeContainer.items.splice(activeIndex, 1);
        
        // Find the index to insert at in the new column
        let overIndex = overContainer.items.findIndex((item) => item.id === overId);

        // If dropping on a container but not on a specific item, append to the end.
        if (over.data.current?.sortable.containerId === overId && overIndex === -1) {
          overIndex = overContainer.items.length;
        }

        if (overIndex !== -1) {
          overContainer.items.splice(overIndex, 0, movedItem);
        } else {
            // Default to appending if index is still not found (e.g., empty container)
            newColumns[overContainerKey].items.push(movedItem);
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
        <div className="grid gap-2">
          <Label htmlFor="course-select">Course Focus</Label>
          <Select onValueChange={setCourse} value={course}>
              <SelectTrigger id="course-select" className="w-[180px]">
                  <SelectValue placeholder="Select course..." />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="JEE">JEE</SelectItem>
                  <SelectItem value="NEET">NEET</SelectItem>
              </SelectContent>
          </Select>
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
