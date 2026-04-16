import { Wrench } from "lucide-react";
import ToolStackEditor from "@/components/ToolStackEditor";

interface Props {
  value: string[];
  onChange: (tools: string[]) => void;
}

export default function ToolsStep({ value, onChange }: Props) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/30 mb-4">
        <Wrench className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-heading font-bold text-gradient mb-2">באילו כלים אתה משתמש?</h2>
      <p className="text-muted-foreground text-sm mb-8">הכלים שלך מזינים את פיד ההמלצות החכם — בחר את כולם</p>

      <div className="max-w-xl mx-auto text-right">
        <ToolStackEditor value={value} onChange={onChange} />
      </div>
    </div>
  );
}
