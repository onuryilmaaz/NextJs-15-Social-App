"use client";

import { useState } from "react";
import { CalendarDays, Users, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
}

export interface SearchFilters {
  dateRange?: "day" | "week" | "month" | "year";
  minLikes?: number;
  hasMedia?: boolean;
  fromUser?: string;
  language?: string;
}

export default function SearchFilters({
  onFiltersChange,
  currentFilters,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<SearchFilters>(currentFilters);

  const hasActiveFilters = Object.keys(currentFilters).some(
    (key) => currentFilters[key as keyof SearchFilters] !== undefined,
  );

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: SearchFilters = {};
    setTempFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className="gap-2"
        >
          <Filter className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-background px-1.5 py-0.5 text-xs">
              {Object.keys(currentFilters).length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Filters</DialogTitle>
          <DialogDescription>
            Refine your search results with advanced filters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Date Range
            </Label>
            <Select
              value={tempFilters.dateRange || ""}
              onValueChange={(value) => updateFilter("dateRange", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any time</SelectItem>
                <SelectItem value="day">Past 24 hours</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="year">Past year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From User */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="size-4" />
              From User
            </Label>
            <Input
              placeholder="Username (without @)"
              value={tempFilters.fromUser || ""}
              onChange={(e) => updateFilter("fromUser", e.target.value)}
            />
          </div>

          {/* Minimum Likes */}
          <div className="space-y-2">
            <Label>Minimum Likes</Label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={tempFilters.minLikes || ""}
              onChange={(e) =>
                updateFilter("minLikes", parseInt(e.target.value) || undefined)
              }
            />
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select
              value={tempFilters.hasMedia ? "media" : ""}
              onValueChange={(value) =>
                updateFilter("hasMedia", value === "media")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All content" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All content</SelectItem>
                <SelectItem value="media">Posts with media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1"
            >
              Clear All
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
