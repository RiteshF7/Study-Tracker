import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 font-headline">Settings</h1>
      <div className="space-y-8 max-w-2xl">
        <SettingsForm />
      </div>
    </div>
  );
}
