"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchFilters, {
  SearchFilters as FilterType,
} from "@/components/search/SearchFilters";
import { useState } from "react";

interface SearchTabsProps {
  query: string;
  currentType: string;
  currentSortBy: string;
}

export default function SearchTabs({
  query,
  currentType,
  currentSortBy,
}: SearchTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterType>({});

  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleTypeChange = (type: string) => {
    updateSearchParams({ type });
  };

  const handleSortChange = (sortBy: string) => {
    updateSearchParams({ sortBy });
  };

  return (
    <div className="space-y-4">
      {/* Search Type Tabs */}
      <Tabs value={currentType} onValueChange={handleTypeChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sort Options and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Sort by:</div>
          <Select value={currentSortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SearchFilters currentFilters={filters} onFiltersChange={setFilters} />
      </div>
    </div>
  );
}
