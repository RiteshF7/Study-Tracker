
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, X } from "lucide-react";
import { ManualActivityForm } from "./manual-activity-form";
import { ProblemForm } from "./problem-form";
import { Separator } from "./ui/separator";

export function ManualEntryDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ManualActivityForm onFormSubmit={() => setOpen(false)} />
          <div className="flex">
            <Separator orientation="vertical" className="mx-4"/>
            <div className="flex-1">
              <ProblemForm onFormSubmit={() => setOpen(false)} triggerButton={null} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
