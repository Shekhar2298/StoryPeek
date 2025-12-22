import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PostCardProps {
  id: string;
  title: string;
  contentPreview: string;
  imageUrl?: string | null;
  author: {
    username: string;
    profilePicUrl: string;
  };
  createdAt: string;
  isAuthenticated: boolean;
}

export function PostCard({
  id,
  title,
  contentPreview,
  imageUrl,
  author,
  createdAt,
  isAuthenticated,
}: PostCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="group relative border-b border-border py-6 last:border-b-0">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Author info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={author.profilePicUrl} alt={author.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {author.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {author.username}
            </span>
            <span className="text-muted-foreground">·</span>
            <time className="text-sm text-muted-foreground">{formattedDate}</time>
          </div>

          {/* Title */}
          <Link to={`/post/${id}`} className="block">
            <h2 className="font-serif text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h2>
          </Link>

          {/* Preview content */}
          <p className="story-content text-muted-foreground text-base leading-relaxed line-clamp-3 mb-3">
            {contentPreview}
          </p>

          {/* CTA */}
          <Button variant="link" asChild className="p-0 h-auto font-medium">
            <Link to={isAuthenticated ? `/post/${id}` : "/auth"} className="flex items-center gap-1">
              {isAuthenticated ? "Read full story" : "Read more → Login"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Image thumbnail */}
        {imageUrl && (
          <div className="hidden sm:block flex-shrink-0">
            <Link to={`/post/${id}`}>
              <div className="w-28 h-28 rounded-md overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt=""
                  className={`w-full h-full object-cover ${!isAuthenticated ? "image-blur" : ""}`}
                  loading="lazy"
                />
              </div>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
