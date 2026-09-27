import React, { useState, useEffect, useMemo } from 'react';
import { Clock, PlusCircle, Coffee, Calendar, Settings } from 'lucide-react';
import { AttendanceRecord, ShiftConfig, LeaveRecord } from './types';
import {
  getCurrentJalaliDate,
  getTodayJalaliString,
  PERSIAN_MONTH_NAMES,
  toPersianDigits,
} from './utils/jalali';
import {
  calculateAttendanceMetrics,
  calculateMonthlyStats,
  DEFAULT_SHIFT_CONFIG,
} from './utils/calculator';
import {
  initializeSampleDataIfEmpty,
  getStoredAttendanceRecords,
  saveAttendanceRecords,
  getStoredShiftConfig,
  saveShiftConfig,
  getStoredLeaveRecords,
  saveLeaveRecords,
  exportMonthToExcel,
} from './utils/storage';

import { Navbar } from './components/Navbar';
import { ClockCard } from './components/ClockCard';
import { StatsCards } from './components/StatsCards';
import { AttendanceTable } from './components/AttendanceTable';
import { ManualEntryModal } from './components/ManualEntryModal';
import { LeaveModal } from './components/LeaveModal';
import { SettingsModal } from './components/SettingsModal';
import { BackupModal } from './components/BackupModal';

export function App() {
  const todayStr = useMemo(() => getTodayJalaliString(), []);
  const todayJalali = useMemo(() => getCurrentJalaliDate(), []);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [config, setConfig] = useState<ShiftConfig>(DEFAULT_SHIFT_CONFIG);

  const [selectedYear, setSelectedYear] = useState<number>(todayJalali.jy);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayJalali.jm);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // Initialize and load data
  useEffect(() => {
    const initial = initializeSampleDataIfEmpty();
    setRecords(initial.records);
    setLeaves(initial.leaves);
    setConfig(initial.config);
  }, []);

  // Today's record
  const todayRecord = useMemo(() => {
    return records.find((r) => r.date === todayStr) || null;
  }, [records, todayStr]);

  const isWorkingNow = Boolean(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(records, selectedYear, selectedMonth, config, leaves);
  }, [records, selectedYear, selectedMonth, config, leaves]);

  const selectedMonthName = PERSIAN_MONTH_NAMES[selectedMonth - 1] || '';

  // 1. Clock in today
  const handleCheckIn = (time: string) => {
    let existing = records.find((r) => r.date === todayStr);
    const updatedRecord = calculateAttendanceMetrics(
      {
        ...(existing || { id: `att_${Date.now()}` }),
        date: todayStr,
        checkIn: time,
        checkOut: null,
        status: 'in_progress',
      },
      config
    );

    const updatedList = existing
      ? records.map((r) => (r.date === todayStr ? updatedRecord : r))
      : [updatedRecord, ...records];

    setRecords(updatedList);
    saveAttendanceRecords(updatedList);
  };

  // 2. Clock out today
  const handleCheckOut = (time: string, breakMinutes: number) => {
    let existing = records.find((r) => r.date === todayStr);
    if (!existing) return;

    const updatedRecord = calculateAttendanceMetrics(
      {
        ...existing,
        checkOut: time,
        breakMinutes: breakMinutes,
        status: 'present',
      },
      config
    );

    const updatedList = records.map((r) => (r.date === todayStr ? updatedRecord : r));
    setRecords(updatedList);
    saveAttendanceRecords(updatedList);
  };

  // 3. Reset today
  const handleResetToday = () => {
    if (window.confirm('آیا از بازنشانی ثبت ورود/خروج امروز مطمئن هستید؟')) {
      const updatedList = records.filter((r) => r.date !== todayStr);
      setRecords(updatedList);
      saveAttendanceRecords(updatedList);
    }
  };

  // 4. Save manual record (create or edit)
  const handleSaveManualRecord = (data: Partial<AttendanceRecord>) => {
    if (!data.date) return;

    const calculated = calculateAttendanceMetrics(data as any, config);
    const exists = records.some((r) => r.id === calculated.id || r.date === calculated.date);

    let updatedList: AttendanceRecord[];
    if (exists) {
      updatedList = records.map((r) =>
        r.id === calculated.id || r.date === calculated.date ? calculated : r
      );
    } else {
      updatedList = [calculated, ...records];
    }

    setRecords(updatedList);
    saveAttendanceRecords(updatedList);
    setEditingRecord(null);
  };

  // 5. Delete record
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('آیا از حذف این تردد مطمئن هستید؟')) {
      const updatedList = records.filter((r) => r.id !== id);
      setRecords(updatedList);
      saveAttendanceRecords(updatedList);
    }
  };

  // 6. Leaves management
  const handleAddLeave = (leaveData: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    const newLeave: LeaveRecord = {
      ...leaveData,
      id: `leave_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedLeaves = [newLeave, ...leaves];
    setLeaves(updatedLeaves);
    saveLeaveRecords(updatedLeaves);

    // If it's a full-day leave, also update the attendance day record
    if (leaveData.type === 'daily' || leaveData.type === 'sick') {
      const dayRec = calculateAttendanceMetrics(
        {
          date: leaveData.date,
          status: 'leave',
          note: `مرخصی: ${leaveData.reason}`,
        },
        config
      );
      const exists = records.some((r) => r.date === leaveData.date);
      const updatedRecords = exists
        ? records.map((r) => (r.date === leaveData.date ? dayRec : r))
        : [dayRec, ...records];
      setRecords(updatedRecords);
      saveAttendanceRecords(updatedRecords);
    }
  };

  const handleDeleteLeave = (id: string) => {
    const updatedLeaves = leaves.filter((l) => l.id !== id);
    setLeaves(updatedLeaves);
    saveLeaveRecords(updatedLeaves);
  };

  // 7. Update Shift settings & recalculate all records
  const handleSaveConfig = (newConfig: ShiftConfig) => {
    setConfig(newConfig);
    saveShiftConfig(newConfig);

    // Recalculate metrics for all existing records with new policy
    const recalculated = records.map((r) => calculateAttendanceMetrics(r, newConfig));
    setRecords(recalculated);
    saveAttendanceRecords(recalculated);
  };

  // 8. Excel Export
  const handleExportExcel = () => {
    exportMonthToExcel(records, selectedYear, selectedMonth, selectedMonthName);
  };

  // 9. Data restore & Reset
  const handleDataRestored = () => {
    setRecords(getStoredAttendanceRecords());
    setLeaves(getStoredLeaveRecords());
    setConfig(getStoredShiftConfig());
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setRecords([]);
    setLeaves([]);
    setConfig(DEFAULT_SHIFT_CONFIG);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans pb-24 md:pb-16">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenManualEntry={() => {
          setEditingRecord(null);
          setIsManualModalOpen(true);
        }}
        onOpenLeaves={() => setIsLeaveModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        isWorkingNow={isWorkingNow}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-4 sm:space-y-6 flex-1">
        {/* Hero Section: Today's Clock In / Clock Out & Live Stopwatch */}
        <section id="today-section">
          <ClockCard
            todayRecord={todayRecord}
            config={config}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onResetToday={handleResetToday}
            onOpenEdit={() => {
              setEditingRecord(todayRecord);
              setIsManualModalOpen(true);
            }}
          />
        </section>

        {/* Bento Grid: Monthly Statistics Cards */}
        <section aria-label="آمار و شاخص‌های ماهانه">
          <StatsCards
            stats={monthlyStats}
            monthName={selectedMonthName}
            year={selectedYear}
          />
        </section>

        {/* Monthly Attendance Table & Filters */}
        <section id="attendance-section" aria-label="جدول تردد و فیلترها">
          <AttendanceTable
            records={records}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            config={config}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setIsManualModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
            onAddNewForDate={(date) => {
              setEditingRecord({ date } as any);
              setIsManualModalOpen(true);
            }}
            onExportExcel={handleExportExcel}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 sm:mt-12 text-center text-[11px] sm:text-xs text-slate-600 border-t border-slate-900 pt-5 pb-2">
        <p>سامانه مدیریت تردد و کارکرد | طراحی شده با تقویم شمسی و استانداردهای قانون کار</p>
      </footer>

      {/* Mobile Bottom Navigation Bar (Thumb friendly for phones) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around text-[10px] text-slate-400 shadow-2xl">
        <button
          onClick={() => {
            const el = document.getElementById('today-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 py-1 px-2 hover:text-indigo-400 active:scale-95 transition-all"
        >
          <Clock className="h-4 w-4" />
          <span>میز کار</span>
        </button>

        <button
          onClick={() => {
            setEditingRecord(null);
            setIsManualModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 py-1 px-2.5 text-indigo-400 font-bold active:scale-95 transition-all"
        >
          <div className="h-7 w-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <PlusCircle className="h-4 w-4" />
          </div>
          <span>ثبت دستی</span>
        </button>

        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 hover:text-amber-400 active:scale-95 transition-all"
        >
          <Coffee className="h-4 w-4 text-amber-400" />
          <span>مرخصی</span>
        </button>

        <button
          onClick={() => {
            const el = document.getElementById('attendance-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 py-1 px-2 hover:text-cyan-400 active:scale-95 transition-all"
        >
          <Calendar className="h-4 w-4" />
          <span>کارکرد</span>
        </button>

        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2 hover:text-white active:scale-95 transition-all"
        >
          <Settings className="h-4 w-4" />
          <span>تنظیمات</span>
        </button>
      </div>

      {/* Modals */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveManualRecord}
        initialRecord={editingRecord}
      />

      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        leaves={leaves.filter((l) =>
          l.date.startsWith(`${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`)
        )}
        onAddLeave={handleAddLeave}
        onDeleteLeave={handleDeleteLeave}
        monthlyQuotaHours={config.monthlyLeaveQuotaHours}
        monthlyQuotaDays={config.monthlyLeaveDays || 2.5}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={handleDataRestored}
        onResetAllData={handleResetAllData}
      />
    </div>
  );
}

export default App;
