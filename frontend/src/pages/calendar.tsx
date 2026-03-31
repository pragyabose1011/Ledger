import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";

type CalendarMeeting = {
  id: string;
  title: string;
  platform?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  participant_count: number;
  has_extractions: boolean;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadMeetings();
  }, [navigate, year, month]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/meetings/calendar?year=${year}&month=${month + 1}`);
      setMeetings(res.data);
    } catch (err) {
      console.error("Failed to load calendar meetings", err);
    } finally {
      setLoading(false);
    }
  };

  const meetingsByDay = useMemo(() => {
    const map = new Map<number, CalendarMeeting[]>();
    for (const m of meetings) {
      const d = new Date(m.start_time || m.created_at);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        const existing = map.get(day);
        if (existing) existing.push(m);
        else map.set(day, [m]);
      }
    }
    return map;
  }, [meetings, year, month]);

  const todayDay = useMemo(() => {
    const today = new Date();
    return today.getMonth() === month && today.getFullYear() === year ? today.getDate() : null;
  }, [year, month]);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const selectedDayMeetings = selectedDate
    ? (meetingsByDay.get(selectedDate.getDate()) ?? [])
    : [];

  const isSelected = (day: number) => {
    return selectedDate?.getDate() === day && 
           selectedDate?.getMonth() === month && 
           selectedDate?.getFullYear() === year;
  };

  return (
    <Layout>
      <div className="px-8 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Calendar</h1>
            <p className="mt-1 text-sm text-slate-400">
              View your meetings by date
            </p>
          </div>
          <button
            onClick={goToToday}
            className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-xs text-slate-500 font-medium py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-2 border-ledger-pink border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={idx} className="h-24" />;
                  }

                  const dayMeetings = meetingsByDay.get(day) ?? [];
                  const hasExtracted = dayMeetings.some((m) => m.has_extractions);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(new Date(year, month, day))}
                      className={`h-24 p-2 rounded-lg border transition-all text-left flex flex-col ${
                        isSelected(day)
                          ? "border-ledger-pink bg-pink-500/10"
                          : day === todayDay
                          ? "border-slate-600 bg-slate-800/50"
                          : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/30"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          day === todayDay ? "text-ledger-pink" : "text-slate-300"
                        }`}
                      >
                        {day}
                      </span>
                      {dayMeetings.length > 0 && (
                        <div className="mt-1 flex-1 overflow-hidden">
                          <div className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                hasExtracted ? "bg-emerald-500" : "bg-slate-500"
                              }`}
                            />
                            <span className="text-xs text-slate-400 truncate">
                              {dayMeetings.length} meeting{dayMeetings.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          {dayMeetings.slice(0, 2).map((m) => (
                            <div
                              key={m.id}
                              className="text-xs text-slate-500 truncate mt-0.5"
                            >
                              {m.title}
                            </div>
                          ))}
                          {dayMeetings.length > 2 && (
                            <div className="text-xs text-slate-600">
                              +{dayMeetings.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Day Details */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDate
                ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
                : "Select a date"}
            </h3>

            {selectedDate ? (
              selectedDayMeetings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayMeetings.map((meeting) => (
                    <button
                      key={meeting.id}
                      onClick={() => navigate(`/meetings/${meeting.id}`)}
                      className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-200 truncate">
                            {meeting.title}
                          </h4>
                          {meeting.platform && (
                            <span className="text-xs text-slate-500">
                              {meeting.platform}
                            </span>
                          )}
                        </div>
                        {meeting.has_extractions && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                            Extracted
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        {meeting.start_time && (
                          <span>
                            {new Date(meeting.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {meeting.participant_count > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                            {meeting.participant_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No meetings on this day</p>
                  <button
                    onClick={() => navigate("/meetings")}
                    className="mt-4 text-sm text-ledger-pink hover:text-pink-400 transition-colors"
                  >
                    Create a meeting
                  </button>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">
                  Click on a date to see meetings
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}