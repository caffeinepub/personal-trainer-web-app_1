import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRequestAppointment, useGetConfirmedAppointmentsForClient } from '../../hooks/useQueries';

interface AppointmentsSectionProps {
  username: string;
}

export default function AppointmentsSection({ username }: AppointmentsSectionProps) {
  const [appointmentType, setAppointmentType] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const requestMutation = useRequestAppointment();
  const { data: confirmedAppointments, isLoading: loadingAppointments } = useGetConfirmedAppointmentsForClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!appointmentType) {
      setError('Please select an appointment type.');
      return;
    }

    if (!preferredDate || !preferredTime) {
      setError('Please select a preferred date and time.');
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError('Please enter a valid duration.');
      return;
    }

    try {
      const dateTimeString = `${preferredDate}T${preferredTime}:00`;
      const dateTime = new Date(dateTimeString).getTime();
      const dateTimeBigInt = BigInt(dateTime * 1_000_000); // Convert to nanoseconds

      const notesWithType = `Type: ${appointmentType}\n${notes}`;

      await requestMutation.mutateAsync({
        clientName: username,
        clientEmail: contactEmail,
        dateTime: dateTimeBigInt,
        durationMinutes: BigInt(durationNum),
        notes: notesWithType,
      });

      setSuccess('Appointment request submitted successfully! Your trainer will confirm it soon.');
      setAppointmentType('');
      setPreferredDate('');
      setPreferredTime('');
      setDuration('60');
      setNotes('');
      setContactEmail('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit appointment request.');
    }
  };

  const formatDateTime = (dateTime: bigint) => {
    const milliseconds = Number(dateTime / BigInt(1_000_000));
    const date = new Date(milliseconds);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
        <p className="text-muted-foreground">Request a session or view your confirmed appointments</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="mb-6 border-green-500/50 bg-green-500/10 text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Form */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Request Appointment
            </CardTitle>
            <CardDescription>
              Submit a request for a training session with your personal trainer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentType">Appointment Type *</Label>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger id="appointmentType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-person">In-person</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    disabled={requestMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred Time *</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    disabled={requestMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={requestMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={requestMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Message</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional information or preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={requestMutation.isPending}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={requestMutation.isPending}
                className="w-full"
              >
                {requestMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Confirmed Appointments List */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Confirmed Appointments
            </CardTitle>
            <CardDescription>
              Your upcoming confirmed training sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAppointments ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : confirmedAppointments && confirmedAppointments.length > 0 ? (
              <div className="space-y-3">
                {confirmedAppointments.map((appointment) => (
                  <div
                    key={appointment.id.toString()}
                    className="rounded-lg border border-border/50 bg-background/50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-medium">
                          {formatDateTime(appointment.dateTime)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {appointment.durationMinutes.toString()} minutes
                        </div>
                        {appointment.notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center">
                <Calendar className="mb-2 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No confirmed appointments yet.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit a request and your trainer will confirm it.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
