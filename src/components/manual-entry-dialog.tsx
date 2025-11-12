
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Info } from "lucide-react";
import { ManualActivityForm } from "./manual-activity-form";
import { Separator } from "./ui/separator";
import { ProblemForm } from "./problem-form";

export function ManualEntryDialog() {
  const [open, setOpen] = useState(false);

  const handleFormSubmit = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manual Entry</DialogTitle>
          <DialogDescription>
            Log a past activity or track problems you've solved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
                <h3 className="text-lg font-medium mb-4">Log Activity</h3>
                <ManualActivityForm onFormSubmit={handleFormSubmit} />
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center md:hidden">
                    <Separator />
                </div>
                 <div className="absolute inset-y-0 left-0 w-px bg-border hidden md:block" />

                <div className="md:ml-8">
                    <h3 className="text-lg font-medium mb-4 mt-8 md:mt-0">Track Problems</h3>
                    <ProblemForm onFormSubmit={handleFormSubmit} />
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
