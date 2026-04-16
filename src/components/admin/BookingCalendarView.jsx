import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, Waves } from 'lucide-react';



export default function BookingCalendarView({ bookings }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start to Monday
  const startDay = monthStart.getDay();
  const padDays = startDay === 0 ? 6 : startDay - 1;

  const getBookingsForDay = (day) => {
    return (bookings || []).filter((b) => {
      try {
        if (b.type === 'accommodation' && b.check_in && b.check_out) {
          const start = parseISO(b.check_in);
          const end = parseISO(b.check_out);
          if (start > end) return false;
          return isWithinInterval(day, { start, end });
        }
        if (b.type === 'surf' && b.surf_date) {
          return isSameDay(day, parseISO(b.surf_date));
        }
      } catch {
        return false;
      }
      return false;
    });
  };

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-heading text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: pt })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
        {Array(padDays).fill(null).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const isToday = isSameDay(day, new Date());
          const tooltipText = dayBookings.map(b =>
            `${b.guest_name} - ${b.type === 'accommodation' ? 'Alojamento' : `Surf ${b.surf_time || ''}`} (${b.status})`
          ).join('\n');

          return (
            <div
              key={day.toISOString()}
              title={tooltipText || undefined}
              className={`min-h-[80px] p-2 rounded-lg border transition-colors ${
                isToday ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
              }`}
            >
              <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground/70'}`}>
                {format(day, 'd')}
              </p>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : b.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {b.type === 'accommodation' ? <Home className="w-2.5 h-2.5 shrink-0" /> : <Waves className="w-2.5 h-2.5 shrink-0" />}
                    <span className="truncate">{b.guest_name}</span>
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{dayBookings.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}