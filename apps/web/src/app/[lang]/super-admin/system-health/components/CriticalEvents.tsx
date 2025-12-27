'use client';

import { getSeverityColor, getSeverityIcon } from '../types';

interface CriticalEvent {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
}

interface CriticalEventsProps {
  events: CriticalEvent[];
}

export default function CriticalEvents({ events }: CriticalEventsProps) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getSeverityIcon(event.severity)}</span>
            <div className="flex-1">
              <div className="font-semibold">{event.message}</div>
              <div className="text-sm opacity-75">
                {event.type} • {new Date(event.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
