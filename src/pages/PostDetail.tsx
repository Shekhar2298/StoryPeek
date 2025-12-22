import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Lock } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content_preview: string;
  content_full: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    profile_pic_url: string;
  };
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);

  const fetchPost = async (postId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        content_preview,
        content_full,
        image_url,
        created_at,
        profiles!posts_user_id_fkey (
          username,
          profile_pic_url
        )
      `)
      .eq("id", postId)
      .maybeSingle();

    if (!error && data) {
      setPost(data as unknown as Post);
    }
    setLoading(false);
  };

  const formattedDate = post
    ? new Date(post.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  if (loading || authLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <article className="container max-w-3xl py-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <Skeleton className="h-64 w-full rounded-lg mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </article>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-foreground mb-4">
              Story not found
            </h1>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to stories
              </Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <article className="container max-w-3xl py-8">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stories
          </Link>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Author info */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={post.profiles?.profile_pic_url}
                alt={post.profiles?.username}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {post.profiles?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {post.profiles?.username || "Anonymous"}
              </p>
              <time className="text-sm text-muted-foreground">{formattedDate}</time>
            </div>
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="mb-8 rounded-lg overflow-hidden bg-muted">
              <img
                src={post.image_url}
                alt=""
                className={`w-full h-auto max-h-96 object-cover ${!user ? "image-blur" : ""}`}
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          {user ? (
            <div className="story-content text-lg leading-relaxed whitespace-pre-wrap">
              {post.content_full}
            </div>
          ) : (
            <div className="relative">
              <div className="content-blur">
                <div className="story-content text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content_preview}
                </div>
              </div>

              {/* Login CTA overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-background pt-16 pb-4">
                <div className="bg-card border border-border rounded-lg p-6 text-center shadow-elevated">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                    Continue reading
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Sign in to unlock the full story and discover more content
                  </p>
                  <Button variant="cta" size="lg" asChild>
                    <Link to="/auth">Sign in to read more</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </article>

        <footer className="border-t border-border bg-background py-6 mt-12">
          <div className="container text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} StoryPeek. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
