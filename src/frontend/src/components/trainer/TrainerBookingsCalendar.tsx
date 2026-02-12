import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Plus, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { useGetBookingsByDateRange } from '@/hooks/useQueries';
import { normalizeError, logErrorDetails } from '@/utils/userFacingErrors';
import BookingUpsertDialog from './BookingUpsertDialog';
import { Booking } from '@/backend';
import { formatBookingTime } from '@/utils/bookingTime';

export default function TrainerBookingsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Calculate month range for query
  const { startTime, endTime } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    return {
      startTime: BigInt(start.getTime()) * BigInt(1_000_000),
      endTime: BigInt(end.getTime()) * BigInt(1_000_000),
    };
  }, [currentDate]);

  const { data: bookings = [], isLoading, isError, error } = useGetBookingsByDateRange(startTime, endTime);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentDate]);

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(Number(booking.dateTime / BigInt(1_000_000)));
      return (
        bookingDate.getFullYear() === date.getFullYear() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getDate() === date.getDate()
      );
    });
  };

  // Selected day bookings
  const selectedDayBookings = useMemo(() => {
    if (!selectedDate) return [];
    return getBookingsForDate(selectedDate);
  }, [selectedDate, bookings]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddBooking = () => {
    setEditingBooking(null);
    setIsDialogOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBooking(null);
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isError) {
    logErrorDetails(error, 'TrainerBookingsCalendar');
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{normalizeError(error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{monthName}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleAddBooking} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Booking
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-20" />;
              }

              const dayBookings = getBookingsForDate(day);
              const isToday = day.getTime() === today.getTime();
              const isSelected = selectedDate && day.getTime() === selectedDate.getTime();

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative h-20 rounded-lg border p-2 text-left transition-all
                    ${isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'}
                    ${isToday ? 'border-primary/70 bg-primary/5' : ''}
                  `}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                    {day.getDate()}
                  </div>
                  {dayBookings.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <div
                          key={Number(booking.id)}
                          className="truncate rounded bg-primary/20 px-1 py-0.5 text-xs text-primary"
                        >
                          {formatBookingTime(booking.dateTime)}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="border-border/50 bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h4>
            <Button size="sm" variant="outline" onClick={handleAddBooking} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {selectedDayBookings.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/50">
              <div className="text-center">
                <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No bookings for this day</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayBookings.map((booking) => (
                <button
                  key={Number(booking.id)}
                  onClick={() => handleEditBooking(booking)}
                  className="w-full rounded-lg border border-border/50 bg-card p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatBookingTime(booking.dateTime)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({Number(booking.durationMinutes)} min)
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{booking.clientName}</p>
                      {booking.clientEmail && (
                        <p className="text-xs text-muted-foreground">{booking.clientEmail}</p>
                      )}
                      {booking.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">{booking.notes}</p>
                      )}
                    </div>
                    {booking.isConfirmed && (
                      <div className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                        Confirmed
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Booking Dialog */}
      <BookingUpsertDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        booking={editingBooking}
        defaultDate={selectedDate || undefined}
      />
    </div>
  );
}
