
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { ManualActivityForm } from "./manual-activity-form";

export function ManualEntryDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
         <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <ManualActivityForm onFormSubmit={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
