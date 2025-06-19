"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiscoverTabsProps {
  currentTab: string;
  currentCategory: string;
}

export default function DiscoverTabs({
  currentTab,
  currentCategory,
}: DiscoverTabsProps) {
  const router = useRouter();

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set("tab", updates.tab || currentTab);
    params.set("category", updates.category || currentCategory);
    router.push(`/discover?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Main Tabs */}
      <Tabs value={currentTab} onValueChange={(tab) => updateParams({ tab })}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Category Filter */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Category:</div>
        <Select
          value={currentCategory}
          onValueChange={(category) => updateParams({ category })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="tech">Technology</SelectItem>
            <SelectItem value="programming">Programming</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="lifestyle">Lifestyle</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
            <SelectItem value="science">Science</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
