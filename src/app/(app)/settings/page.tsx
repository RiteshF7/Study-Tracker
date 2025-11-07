import { SettingsForm } from "@/components/settings-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <ThemeToggle />
      </div>
      <div className="space-y-8 max-w-2xl">
        <SettingsForm />
      </div>
    </div>
  );
}
