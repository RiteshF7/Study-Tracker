
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
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-medium mb-4">Log Activity</h3>
                <ManualActivityForm onFormSubmit={handleFormSubmit} />
            </div>
            <div className="flex flex-col">
                 <div className="hidden md:block">
                    <Separator orientation="vertical" className="h-full" />
                 </div>
                 <div className="md:hidden">
                    <Separator orientation="horizontal" className="w-full" />
                 </div>
            </div>
            <div>
                <h3 className="text-lg font-medium mb-4">Track Problems</h3>
                <ProblemForm onFormSubmit={handleFormSubmit} />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
