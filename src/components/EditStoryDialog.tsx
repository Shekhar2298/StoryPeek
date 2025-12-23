import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const storySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  content: z.string().min(100, "Story must be at least 100 characters").max(10000, "Story must be less than 10,000 characters"),
});

interface EditStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: {
    id: string;
    title: string;
    content_full: string;
  };
  onSuccess: () => void;
}

export function EditStoryDialog({ open, onOpenChange, story, onSuccess }: EditStoryDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(story.title);
  const [content, setContent] = useState(story.content_full);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatePreview = (fullContent: string): string => {
    const words = fullContent.split(/\s+/);
    const previewWordCount = Math.max(30, Math.floor(words.length * 0.25));
    return words.slice(0, previewWordCount).join(" ") + "...";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = storySchema.safeParse({ title, content });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          title: title.trim(),
          content_preview: generatePreview(content.trim()),
          content_full: content.trim(),
        })
        .eq("id", story.id);

      if (error) throw new Error(error.message);

      toast({
        title: "Story updated!",
        description: "Your changes have been saved",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to update",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Edit Story</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "border-destructive" : ""}
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">Your Story</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`min-h-[250px] resize-y story-content ${
                errors.content ? "border-destructive" : ""
              }`}
              maxLength={10000}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              {errors.content ? (
                <p className="text-destructive">{errors.content}</p>
              ) : (
                <p>Minimum 100 characters</p>
              )}
              <p>{content.length} / 10,000</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
