import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  PlusCircle,
  Coffee,
  Calendar,
  Settings,
  LayoutDashboard,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react';
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
import {
  getStoredTheme,
  saveStoredTheme,
  applyThemeToDOM,
  AppTheme,
} from './utils/theme';

import { Navbar, ActiveTab } from './components/Navbar';
import { ClockCard } from './components/ClockCard';
import { StatsCards } from './components/StatsCards';
import { AttendanceTable } from './components/AttendanceTable';
import { DashboardCharts } from './components/DashboardCharts';
import { RecentActivityCard } from './components/RecentActivityCard';
import { LeavesTab } from './components/LeavesTab';
import { ReportsTab } from './components/ReportsTab';
import { ManualEntryModal } from './components/ManualEntryModal';
import { LeaveModal } from './components/LeaveModal';
import { SettingsModal } from './components/SettingsModal';
import { BackupModal } from './components/BackupModal';

export function App() {
  const todayStr = useMemo(() => getTodayJalaliString(), []);
  const todayJalali = useMemo(() => getCurrentJalaliDate(), []);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(getStoredTheme);

  // Active Tab State (dashboard, timesheet, leaves, reports)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [config, setConfig] = useState<ShiftConfig>(DEFAULT_SHIFT_CONFIG);

  const [selectedYear, setSelectedYear] = useState<number>(todayJalali.jy);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayJalali.jm);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // Initialize theme on mount
  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    saveStoredTheme(theme);
  };

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

  // Synchronize and recalculate an attendance record for a specific date using its leaves
  const syncRecordWithLeaves = (
    dateStr: string,
    currentRecords: AttendanceRecord[],
    currentLeaves: LeaveRecord[],
    cfg: ShiftConfig
  ): AttendanceRecord[] => {
    const dayLeaves = currentLeaves.filter((l) => l.date === dateStr);
    const existing = currentRecords.find((r) => r.date === dateStr);
    const hasFullDay = dayLeaves.some(
      (l) => l.type === 'daily' || l.type === 'sick' || l.type === 'unpaid'
    );

    const baseData: Partial<AttendanceRecord> & { date: string } = existing
      ? { ...existing }
      : {
          date: dateStr,
          status: hasFullDay ? 'leave' : 'present',
        };

    const recalculated = calculateAttendanceMetrics(baseData, cfg, dayLeaves);

    if (existing) {
      return currentRecords.map((r) => (r.date === dateStr ? recalculated : r));
    } else if (dayLeaves.length > 0) {
      return [recalculated, ...currentRecords];
    }
    return currentRecords;
  };

  // 1. Clock in today
  const handleCheckIn = (time: string) => {
    let existing = records.find((r) => r.date === todayStr);
    const dayLeaves = leaves.filter((l) => l.date === todayStr);
    const updatedRecord = calculateAttendanceMetrics(
      {
        ...(existing || { id: `att_${Date.now()}` }),
        date: todayStr,
        checkIn: time,
        checkOut: null,
        status: 'in_progress',
      },
      config,
      dayLeaves
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

    const dayLeaves = leaves.filter((l) => l.date === todayStr);
    const updatedRecord = calculateAttendanceMetrics(
      {
        ...existing,
        checkOut: time,
        breakMinutes: breakMinutes,
        status: 'present',
      },
      config,
      dayLeaves
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

    const dayLeaves = leaves.filter((l) => l.date === data.date);
    const calculated = calculateAttendanceMetrics(data as any, config, dayLeaves);
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

    const updatedRecords = syncRecordWithLeaves(leaveData.date, records, updatedLeaves, config);
    setRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords);
  };

  const handleUpdateLeave = (updatedLeave: LeaveRecord) => {
    const updatedLeaves = leaves.map((l) => (l.id === updatedLeave.id ? updatedLeave : l));
    setLeaves(updatedLeaves);
    saveLeaveRecords(updatedLeaves);

    const updatedRecords = syncRecordWithLeaves(updatedLeave.date, records, updatedLeaves, config);
    setRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords);
  };

  const handleDeleteLeave = (id: string) => {
    const targetLeave = leaves.find((l) => l.id === id);
    const dateStr = targetLeave?.date;
    const updatedLeaves = leaves.filter((l) => l.id !== id);
    setLeaves(updatedLeaves);
    saveLeaveRecords(updatedLeaves);

    if (dateStr) {
      const updatedRecords = syncRecordWithLeaves(dateStr, records, updatedLeaves, config);
      setRecords(updatedRecords);
      saveAttendanceRecords(updatedRecords);
    }
  };

  // 7. Update Shift settings & recalculate all records
  const handleSaveConfig = (newConfig: ShiftConfig) => {
    setConfig(newConfig);
    saveShiftConfig(newConfig);

    const recalculated = records.map((r) =>
      calculateAttendanceMetrics(r, newConfig, leaves.filter((l) => l.date === r.date))
    );
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
    <div data-theme={currentTheme} className="min-h-screen flex flex-col font-sans pb-24 md:pb-16 transition-colors duration-300">
      {/* Top Navigation Bar with Tabs & Theme Switcher */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        onOpenManualEntry={() => {
          setEditingRecord(null);
          setIsManualModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        isWorkingNow={isWorkingNow}
      />

      {/* Main Tabbed Content Area */}
      <main className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-4 sm:space-y-6 flex-1">
        {/* ======================================================== */}
        {/* TAB 1: پیشخوان (Dashboard - Uncluttered Executive View) */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            {/* Quick Hero: Today's Clock In / Clock Out Card */}
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

            {/* Bento Grid: Monthly Statistics Highlights */}
            <section aria-label="خلاصه شاخص‌های ماهانه">
              <StatsCards
                stats={monthlyStats}
                monthName={selectedMonthName}
                year={selectedYear}
              />
            </section>

            {/* Interactive Charts: Work Hours Trends & Donut Distribution */}
            <section aria-label="نمودارهای تحلیلی روند کارکرد">
              <DashboardCharts
                records={records}
                stats={monthlyStats}
                config={config}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
              />
            </section>

            {/* Recent Activity Mini-Table */}
            <section aria-label="آخرین ترددهای ثبت‌شده">
              <RecentActivityCard
                records={records}
                onNavigateToTimesheet={() => setActiveTab('timesheet')}
                onEditRecord={(rec) => {
                  setEditingRecord(rec);
                  setIsManualModalOpen(true);
                }}
              />
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: کارنامه تردد (Full Monthly Timesheet & Records) */}
        {/* ======================================================== */}
        {activeTab === 'timesheet' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
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
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: کاردکس و مرخصی‌ها (Dedicated Leaves Management) */}
        {/* ======================================================== */}
        {activeTab === 'leaves' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            <LeavesTab
              leaves={leaves.filter((l) =>
                l.date.startsWith(`${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`)
              )}
              onOpenAddModal={() => {
                setEditingLeave(null);
                setIsLeaveModalOpen(true);
              }}
              onEditLeave={(leave) => {
                setEditingLeave(leave);
                setIsLeaveModalOpen(true);
              }}
              onDeleteLeave={handleDeleteLeave}
              monthlyQuotaHours={config.monthlyLeaveQuotaHours}
              monthlyQuotaDays={config.monthlyLeaveDays || 2.5}
              selectedMonthName={selectedMonthName}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: گزارشات تحلیلی و مالی (Reports & Financial Overview) */}
        {/* ======================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            <ReportsTab
              stats={monthlyStats}
              records={records}
              config={config}
              selectedMonthName={selectedMonthName}
              selectedYear={selectedYear}
              onExportExcel={handleExportExcel}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 sm:mt-12 text-center text-[11px] sm:text-xs text-slate-500 border-t border-slate-800/80 pt-5 pb-2">
        <p>سامانه مدیریت تردد و کارکرد | طراحی مدرن با تقویم شمسی و استانداردهای قانون کار</p>
      </footer>

      {/* Mobile Bottom Navigation Bar (Touch & Thumb friendly with 4 Tabs) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around text-[10px] text-slate-400 shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${
            activeTab === 'dashboard'
              ? 'text-indigo-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>پیشخوان</span>
        </button>

        <button
          onClick={() => setActiveTab('timesheet')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${
            activeTab === 'timesheet'
              ? 'text-indigo-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TableIcon className="h-4 w-4" />
          <span>کارنامه</span>
        </button>

        {/* Center Quick Add Punch */}
        <button
          onClick={() => {
            setEditingRecord(null);
            setIsManualModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 py-0.5 px-2 text-indigo-400 font-bold active:scale-95 transition-all"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/30 flex items-center justify-center text-white">
            <PlusCircle className="h-5 w-5" />
          </div>
          <span className="text-[9px]">ثبت تردد</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${
            activeTab === 'leaves'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coffee className="h-4 w-4" />
          <span>مرخصی</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-all ${
            activeTab === 'reports'
              ? 'text-indigo-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>گزارشات</span>
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
        onClose={() => {
          setIsLeaveModalOpen(false);
          setEditingLeave(null);
        }}
        leaves={leaves.filter((l) =>
          l.date.startsWith(`${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`)
        )}
        onAddLeave={handleAddLeave}
        onUpdateLeave={handleUpdateLeave}
        onDeleteLeave={handleDeleteLeave}
        monthlyQuotaHours={config.monthlyLeaveQuotaHours}
        monthlyQuotaDays={config.monthlyLeaveDays || 2.5}
        todayRecord={todayRecord}
        shiftConfig={config}
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
