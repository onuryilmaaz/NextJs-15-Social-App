"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Zap, Database } from "lucide-react";

interface SlowQuery {
  id: string;
  query: string;
  duration: number;
  frequency: number;
  recommendation: string;
  severity: "low" | "medium" | "high";
}

const mockSlowQueries: SlowQuery[] = [
  {
    id: "1",
    query: "SELECT * FROM posts WHERE content ILIKE '%search%'",
    duration: 450,
    frequency: 23,
    recommendation: "Add GIN index on content field for full-text search",
    severity: "high",
  },
  {
    id: "2",
    query: "SELECT COUNT(*) FROM likes WHERE postId = ?",
    duration: 180,
    frequency: 156,
    recommendation:
      "Consider denormalizing like counts or use materialized views",
    severity: "medium",
  },
  {
    id: "3",
    query: "SELECT * FROM users ORDER BY createdAt DESC LIMIT 20",
    duration: 95,
    frequency: 45,
    recommendation: "Query already optimized with index on createdAt",
    severity: "low",
  },
];

export default function QueryAnalyzer() {
  const [selectedQuery, setSelectedQuery] = useState<SlowQuery | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Slow Queries</h3>
        <Button variant="outline" size="sm">
          <Database className="mr-2 h-4 w-4" />
          Run Analysis
        </Button>
      </div>

      <div className="space-y-3">
        {mockSlowQueries.map((query) => (
          <div
            key={query.id}
            className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50"
            onClick={() => setSelectedQuery(query)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getSeverityColor(query.severity)}
                    className="gap-1"
                  >
                    {getSeverityIcon(query.severity)}
                    {query.severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {query.duration}ms avg
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {query.frequency} times/hour
                  </span>
                </div>
                <code className="block rounded bg-muted px-2 py-1 font-mono text-sm">
                  {query.query}
                </code>
              </div>
            </div>

            {selectedQuery?.id === query.id && (
              <div className="mt-4 border-t pt-4">
                <h4 className="mb-2 font-medium">
                  Optimization Recommendation:
                </h4>
                <p className="text-sm text-muted-foreground">
                  {query.recommendation}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline">
                    View Execution Plan
                  </Button>
                  <Button size="sm" variant="outline">
                    Apply Optimization
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
        <div className="flex items-start gap-2">
          <Zap className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Performance Tips
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Use indexes on frequently queried columns</li>
              <li>• Consider pagination for large result sets</li>
              <li>• Implement caching for expensive queries</li>
              <li>• Monitor query execution plans regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
