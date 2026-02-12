import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useCreateBooking, useUpdateBooking, useDeleteBooking } from '@/hooks/useQueries';
import { Booking } from '@/backend';
import { normalizeError, logErrorDetails } from '@/utils/userFacingErrors';
import { buildDateTimeFromInputs, computeDurationMinutes, formatDateForInput, formatTimeForInput } from '@/utils/bookingTime';

interface BookingUpsertDialogProps {
  open: boolean;
  onClose: () => void;
  booking?: Booking | null;
  defaultDate?: Date;
}

export default function BookingUpsertDialog({ open, onClose, booking, defaultDate }: BookingUpsertDialogProps) {
  const isEditing = !!booking;

  // Form state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [validationError, setValidationError] = useState('');

  const createMutation = useCreateBooking();
  const updateMutation = useUpdateBooking();
  const deleteMutation = useDeleteBooking();

  // Initialize form
  useEffect(() => {
    if (open) {
      if (booking) {
        // Edit mode
        const bookingDate = new Date(Number(booking.dateTime / BigInt(1_000_000)));
        setDate(formatDateForInput(bookingDate));
        setStartTime(formatTimeForInput(bookingDate));
        
        const endDate = new Date(bookingDate.getTime() + Number(booking.durationMinutes) * 60000);
        setEndTime(formatTimeForInput(endDate));
        
        setClientName(booking.clientName);
        setClientEmail(booking.clientEmail);
        setNotes(booking.notes);
        setIsConfirmed(booking.isConfirmed);
      } else {
        // Create mode
        const initialDate = defaultDate || new Date();
        setDate(formatDateForInput(initialDate));
        setStartTime('09:00');
        setEndTime('10:00');
        setClientName('');
        setClientEmail('');
        setNotes('');
        setIsConfirmed(false);
      }
      setValidationError('');
    }
  }, [open, booking, defaultDate]);

  const validateForm = (): boolean => {
    if (!date) {
      setValidationError('Date is required');
      return false;
    }
    if (!startTime) {
      setValidationError('Start time is required');
      return false;
    }
    if (!endTime) {
      setValidationError('End time is required');
      return false;
    }
    if (!clientName.trim()) {
      setValidationError('Client name is required');
      return false;
    }

    // Validate time range
    const startDateTime = buildDateTimeFromInputs(date, startTime);
    const endDateTime = buildDateTimeFromInputs(date, endTime);
    
    if (endDateTime <= startDateTime) {
      setValidationError('End time must be after start time');
      return false;
    }

    const duration = computeDurationMinutes(startDateTime, endDateTime);
    if (duration < 15) {
      setValidationError('Booking must be at least 15 minutes');
      return false;
    }
    if (duration > 480) {
      setValidationError('Booking cannot exceed 8 hours');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!validateForm()) {
      return;
    }

    try {
      const startDateTime = buildDateTimeFromInputs(date, startTime);
      const endDateTime = buildDateTimeFromInputs(date, endTime);
      const durationMinutes = computeDurationMinutes(startDateTime, endDateTime);

      const bookingData = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        dateTime: BigInt(startDateTime.getTime()) * BigInt(1_000_000),
        durationMinutes: BigInt(durationMinutes),
        notes: notes.trim(),
        isConfirmed,
      };

      if (isEditing && booking) {
        await updateMutation.mutateAsync({
          bookingId: booking.id,
          updatedBooking: bookingData,
        });
      } else {
        await createMutation.mutateAsync(bookingData);
      }

      onClose();
    } catch (err: any) {
      logErrorDetails(err, 'BookingUpsertDialog');
      setValidationError(normalizeError(err));
    }
  };

  const handleDelete = async () => {
    if (!booking) return;

    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(booking.id);
      onClose();
    } catch (err: any) {
      logErrorDetails(err, 'BookingUpsertDialog - Delete');
      setValidationError(normalizeError(err));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Booking' : 'Add New Booking'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update booking details' : 'Create a new client booking'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email (optional)</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
            <Label htmlFor="confirmed" className="cursor-pointer">
              Confirmed
            </Label>
            <Switch
              id="confirmed"
              checked={isConfirmed}
              onCheckedChange={setIsConfirmed}
              disabled={isPending}
            />
          </div>

          {validationError && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
                className="gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && !deleteMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditing ? 'Update' : 'Create'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
