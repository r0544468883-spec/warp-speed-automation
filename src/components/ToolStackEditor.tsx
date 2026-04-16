import { useEffect, useMemo, useState } from "react";
import { X, Plus, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { POPULAR_TOOLS } from "@/lib/popular-tools";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export default function ToolStackEditor({ value, onChange }: Props) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    const existing = new Set(value.map((v) => v.toLowerCase()));
    return POPULAR_TOOLS
      .filter((t) => !existing.has(t.toLowerCase()))
      .filter((t) => (q ? t.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [input, value]);

  const add = (tool: string) => {
    const trimmed = tool.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  const remove = (tool: string) => onChange(value.filter((v) => v !== tool));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {value.length === 0 ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" /> אין כלים — הוסף את הכלים שאתה משתמש בהם
          </span>
        ) : (
          value.map((tool) => (
            <Badge key={tool} variant="outline" className="bg-primary/5 text-primary border-primary/30 gap-1 pr-2 pl-1 py-1">
              {tool}
              <button onClick={() => remove(tool)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKey}
            placeholder="הקלד שם כלי או בחר מהרשימה..."
            className="bg-muted/50 border-border"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => add(input)} disabled={!input.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); add(s); }}
                className="w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
