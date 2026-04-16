import { useState } from "react";
import { Upload, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  avatarUrl: string;
  onChange: (url: string) => void;
}

export default function AvatarStep({ avatarUrl, onChange }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי (מקס 2MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("התמונה הועלתה!");
    } catch (err) {
      toast.error("שגיאה בהעלאה");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-heading font-bold text-gradient mb-2">תמונת פרופיל</h2>
      <p className="text-muted-foreground text-sm mb-8">העלה תמונה (אופציונלי) — כך הקהילה תכיר אותך</p>

      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-32 w-32 border-2 border-primary/30">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-muted">
            <User className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <label>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          <Button asChild variant="outline" className="gap-2 cursor-pointer" disabled={uploading}>
            <span>
              <Upload className="h-4 w-4" />
              {uploading ? "מעלה..." : avatarUrl ? "החלף תמונה" : "העלה תמונה"}
            </span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground">PNG, JPG עד 2MB</p>
      </div>
    </div>
  );
}
