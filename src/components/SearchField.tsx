"use client";

import { SearchIcon, Clock, Hash, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import useDebounce from "@/hooks/useDebounce";
import kyInstance from "@/lib/ky";
import { UserData } from "@/lib/types";
import UserAvatar from "./UserAvatar";

interface SearchSuggestion {
  type: "user" | "hashtag" | "recent";
  id: string;
  text: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
}

export default function SearchField() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      // Show recent searches when no query
      const recentSuggestions: SearchSuggestion[] = recentSearches.map(
        (search) => ({
          type: "recent",
          id: search,
          text: search,
        }),
      );
      setSuggestions(recentSuggestions);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const suggestions: SearchSuggestion[] = [];

        // Fetch users
        const usersResponse = await kyInstance
          .get("/api/search/users", {
            searchParams: { q: debouncedQuery, limit: "3" },
          })
          .json<{ users: UserData[] }>();

        usersResponse.users.forEach((user) => {
          suggestions.push({
            type: "user",
            id: user.id,
            text: `@${user.username}`,
            displayName: user.displayName,
            username: user.username,
            avatarUrl: user.avatarUrl,
          });
        });

        // Add hashtag suggestion if query doesn't start with #
        if (!debouncedQuery.startsWith("#")) {
          suggestions.push({
            type: "hashtag",
            id: `hashtag-${debouncedQuery}`,
            text: `#${debouncedQuery}`,
          });
        }

        setSuggestions(suggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, recentSearches]);

  const saveRecentSearch = useCallback(
    (searchTerm: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) return;

      const updated = [
        trimmed,
        ...recentSearches.filter((s) => s !== trimmed),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recent-searches", JSON.stringify(updated));
    },
    [recentSearches],
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) return;

      saveRecentSearch(trimmed);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    },
    [router, saveRecentSearch],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSearch(suggestions[selectedIndex].text);
    } else {
      handleSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text);
  };

  const removeRecentSearch = (searchTerm: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== searchTerm);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} method="GET" action="/search">
        <div className="relative">
          <Input
            ref={inputRef}
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts, users, or hashtags..."
            className="pe-10"
            autoComplete="off"
          />
          <SearchIcon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-xl border bg-card shadow-lg">
          {suggestions.length > 0 ? (
            <div className="p-2">
              {!query.trim() && recentSearches.length > 0 && (
                <div className="mb-2 px-3 py-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Recent searches
                  </span>
                </div>
              )}

              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50 ${
                    index === selectedIndex ? "bg-muted" : ""
                  }`}
                >
                  {suggestion.type === "user" && (
                    <>
                      <UserAvatar avatarUrl={suggestion.avatarUrl} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {suggestion.displayName}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          @{suggestion.username}
                        </div>
                      </div>
                      <User className="size-4 shrink-0 text-muted-foreground" />
                    </>
                  )}

                  {suggestion.type === "hashtag" && (
                    <>
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                        <Hash className="size-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.text}</div>
                        <div className="text-sm text-muted-foreground">
                          Search hashtag
                        </div>
                      </div>
                    </>
                  )}

                  {suggestion.type === "recent" && (
                    <>
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                        <Clock className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.text}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-6 p-0 hover:bg-destructive/10"
                        onClick={(e) => removeRecentSearch(suggestion.text, e)}
                      >
                        <X className="size-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              No suggestions found
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Start typing to search...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
