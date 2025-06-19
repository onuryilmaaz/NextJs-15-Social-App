import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { generateMetadata } from "@/lib/metadata";

export const metadata = generateMetadata({
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist on EchoVerse",
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* Large 404 */}
        <div className="text-6xl font-bold text-primary/20">404</div>

        {/* Echo effect animation */}
        <div className="relative">
          <div className="text-4xl font-bold text-foreground">
            Echo Not Found
          </div>
          <div className="absolute -top-1 left-1 text-4xl font-bold text-muted-foreground/30">
            Echo Not Found
          </div>
          <div className="absolute -top-2 left-2 text-4xl font-bold text-muted-foreground/20">
            Echo Not Found
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            This page seems to have vanished into the digital void
          </p>
          <p className="text-sm text-muted-foreground">
            The content you're looking for might have been moved, deleted, or
            never existed.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="flex items-center gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>

          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link href="/search">
              <Search className="h-4 w-4" />
              Search EchoVerse
            </Link>
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Helpful suggestions */}
        <div className="rounded-lg border bg-card p-4 text-left">
          <h3 className="mb-2 font-medium">You might want to:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Check the URL for typos</li>
            <li>• Browse the discover page for new content</li>
            <li>• Search for users or posts</li>
            <li>• Visit your timeline for updates</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          Lost in EchoVerse? Every voice finds its way home.
        </p>
      </div>
    </div>
  );
}
