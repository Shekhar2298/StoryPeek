import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, X, Loader2 } from "lucide-react";

const storySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  content: z.string().min(100, "Story must be at least 100 characters").max(10000, "Story must be less than 10,000 characters"),
});

export default function CreateStory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const generatePreview = (fullContent: string): string => {
    // Take approximately 25% of the content for preview
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
      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageFile && user) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error("Failed to upload image");
        }

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // Create post
      const { error: insertError } = await supabase.from("posts").insert({
        user_id: user?.id,
        title: title.trim(),
        content_preview: generatePreview(content.trim()),
        content_full: content.trim(),
        image_url: imageUrl,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      toast({
        title: "Story published!",
        description: "Your story is now visible to everyone",
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Failed to publish",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container max-w-2xl py-8">
          <header className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Write a Story
            </h1>
            <p className="text-muted-foreground">
              Share your story with readers across India
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Give your story a compelling title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? "border-destructive" : ""}
                maxLength={200}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Cover Image (Optional)</Label>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload an image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Your Story</Label>
              <Textarea
                id="content"
                placeholder="Start writing your story here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`min-h-[300px] resize-y story-content ${
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

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="cta" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Story"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
