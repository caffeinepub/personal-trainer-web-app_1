import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import type { TrainerDetails } from '../../backend';

interface PersonnelTableProps {
  trainers: TrainerDetails[];
}

export default function PersonnelTable({ trainers }: PersonnelTableProps) {
  if (trainers.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personnel
          </CardTitle>
          <CardDescription>
            List of all registered trainers with their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No personnel found
            </p>
            <p className="text-sm text-muted-foreground">
              No trainers have registered their identity yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Personnel
        </CardTitle>
        <CardDescription>
          List of all registered trainers with their details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>PT Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers.map((trainer) => (
                <TableRow key={trainer.ptCode.toString()}>
                  <TableCell className="font-medium">
                    {trainer.firstName || <span className="text-muted-foreground">Not set</span>}
                  </TableCell>
                  <TableCell className="font-medium">
                    {trainer.lastName || <span className="text-muted-foreground">Not set</span>}
                  </TableCell>
                  <TableCell className="font-mono">
                    {String(trainer.ptCode).padStart(5, '0')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
