
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
    RED: ['Rotational Motion', 'Thermodynamics', 'Electromagnetic Induction', 'Optics', 'Modern Physics'],
    YELLOW: ['Kinematics', 'Laws of Motion', 'Work, Energy and Power', 'Gravitation', 'Properties of Bulk Matter', 'Oscillations and Waves', 'Electrostatics', 'Current Electricity', 'Magnetic Effects of Current and Magnetism', 'Alternating Current', 'Semiconductors'],
    GREEN: ['Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Kinetic Theory', 'Electromagnetic Waves', 'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei']
  },
  '2': { // Chemistry
    RED: ['Equilibrium', 'Thermodynamics', 'p-Block Elements', 'd and f Block Elements', 'Coordination Compounds', 'Aldehydes, Ketones and Carboxylic Acids', 'Alcohols, Phenols and Ethers'],
    YELLOW: ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Chemical Bonding and Molecular Structure', 'States of Matter', 'Redox Reactions', 'Hydrogen', 's-Block Elements', 'Organic Chemistry: Some Basic Principles and Techniques', 'Hydrocarbons', 'The Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'General Principles and Processes of Isolation of Elements', 'Haloalkanes and Haloarenes', 'Organic Compounds containing Nitrogen', 'Biomolecules', 'Polymers'],
    GREEN: ['Classification of Elements and Periodicity in Properties', 'Environmental Chemistry', 'Chemistry in Everyday Life']
  },
  '3-JEE': { // Maths JEE
    RED: ['Integral Calculus', 'Three Dimensional Geometry', 'Permutations and Combinations', 'Probability', 'Conic Sections'],
    YELLOW: ['Complex Numbers and Quadratic Equations', 'Matrices and Determinants', 'Binomial Theorem and Its Simple Applications', 'Sequence and Series', 'Limits, Continuity and Differentiability', 'Differential Equations', 'Vector Algebra', 'Trigonometry', 'Straight Lines'],
    GREEN: ['Sets, Relations and Functions', 'Mathematical Induction', 'Statistics', 'Mathematical Reasoning', 'Circles']
  },
  '3-NEET': { // Biology NEET
    RED: ['Genetics and Evolution', 'Human Physiology', 'Plant Physiology'],
    YELLOW: ['Structural Organisation in Animals and Plants', 'Cell Structure and Function', 'Reproduction', 'Biotechnology and Its Applications', 'Ecology and Environment'],
    GREEN: ['Diversity in Living World', 'Biology and Human Welfare']
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
      
      const newColumns = { ...prevColumns };
  
      if (activeContainerKey === overContainerKey) {
        // Reordering within the same column
        const activeContainer = newColumns[activeContainerKey];
        const oldIndex = activeContainer.items.findIndex((item) => item.id === activeId);
        const newIndex = activeContainer.items.findIndex((item) => item.id === overId);
  
        if (oldIndex !== -1 && newIndex !== -1) {
            newColumns[activeContainerKey] = {
                ...activeContainer,
                items: arrayMove(activeContainer.items, oldIndex, newIndex),
            };
        }
      } else {
        // Moving to a different column
        const activeContainer = newColumns[activeContainerKey];
        const overContainer = newColumns[overContainerKey];
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
