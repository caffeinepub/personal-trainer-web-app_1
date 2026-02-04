import type { BodyWeightEntry } from '../../backend';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BodyweightProgressionChartProps {
  data: BodyWeightEntry[];
}

export default function BodyweightProgressionChart({ data }: BodyweightProgressionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border/50">
        <p className="text-sm text-muted-foreground">No bodyweight data yet</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const minWeight = Math.min(...sortedData.map(d => Number(d.weight)));
  const maxWeight = Math.max(...sortedData.map(d => Number(d.weight)));
  const range = maxWeight - minWeight || 1;

  const firstWeight = Number(sortedData[0].weight);
  const lastWeight = Number(sortedData[sortedData.length - 1].weight);
  const change = lastWeight - firstWeight;
  const changePercent = firstWeight > 0 ? ((change / firstWeight) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">Starting Weight</p>
          <p className="mt-1 text-2xl font-bold">{firstWeight} kg</p>
          <p className="text-xs text-muted-foreground">{sortedData[0].date}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">Current Weight</p>
          <p className="mt-1 text-2xl font-bold">{lastWeight} kg</p>
          <p className="text-xs text-muted-foreground">{sortedData[sortedData.length - 1].date}</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">Change</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-bold">
              {change > 0 ? '+' : ''}{change.toFixed(1)} kg
            </p>
            {change > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : change < 0 ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <Minus className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {change > 0 ? '+' : ''}{changePercent}%
          </p>
        </div>
      </div>

      {/* Simple Visual Chart */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Weight History</p>
        <div className="space-y-2">
          {sortedData.map((entry, index) => {
            const weight = Number(entry.weight);
            const percentage = ((weight - minWeight) / range) * 100;
            
            return (
              <div key={index} className="flex items-center gap-3">
                <span className="w-24 text-sm text-muted-foreground">{entry.date}</span>
                <div className="flex-1">
                  <div className="relative h-8 rounded-lg bg-muted/50">
                    <div
                      className="absolute left-0 top-0 h-full rounded-lg bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary-foreground">
                      {weight} kg
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
