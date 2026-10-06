import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  PlusCircle,
  Coffee,
  Calendar,
  Settings,
  LayoutDashboard,
  Table as TableIcon,
  TrendingUp,
  CalendarClock,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, LeaveRecord } from './types';
import {
  getCurrentJalaliDate,
  getTodayJalaliString,
  PERSIAN_MONTH_NAMES,
  toPersianDigits,
  getJalaliWeekdayIndex,
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

import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { StorageModeModal } from './components/StorageModeModal';

import { Navbar, ActiveTab } from './components/Navbar';
import { ClockCard } from './components/ClockCard';
import { StatsCards } from './components/StatsCards';
import { AttendanceTable } from './components/AttendanceTable';
import { PersianCalendar } from './components/PersianCalendar';
import { DashboardCharts } from './components/DashboardCharts';
import { RecentActivityCard } from './components/RecentActivityCard';
import { LeavesTab } from './components/LeavesTab';
import { ReportsTab } from './components/ReportsTab';
import { ManualEntryModal } from './components/ManualEntryModal';
import { LeaveModal } from './components/LeaveModal';
import { SettingsModal } from './components/SettingsModal';
import { BackupModal } from './components/BackupModal';

function DashboardApp() {
  const { user, storageMode, syncDataToCloud, loadDataFromCloud } = useAuth();
  const userId = user?.id;

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

  // Search & Dashboard View Mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dashboardView, setDashboardView] = useState<'calendar' | 'charts'>('calendar');

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);

  // Initialize theme on mount
  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    saveStoredTheme(theme);
  };

  // Auto-sync helper to cloud if user opted into cloud_encrypted
  const triggerAutoSync = useCallback(
    (updatedRecords: AttendanceRecord[], updatedLeaves: LeaveRecord[], updatedConfig: ShiftConfig) => {
      if (storageMode === 'cloud_encrypted') {
        syncDataToCloud({
          records: updatedRecords,
          leaves: updatedLeaves,
          config: updatedConfig,
        }).catch((e) => console.warn('Auto cloud sync notice:', e));
      }
    },
    [storageMode, syncDataToCloud]
  );

  // Initialize and load data scoped to current user
  useEffect(() => {
    if (!userId) return;

    // Load local data first
    const initial = initializeSampleDataIfEmpty(userId);
    setRecords(initial.records);
    setLeaves(initial.leaves);
    setConfig(initial.config);

    // If user has cloud sync enabled, attempt to load cloud data if local was default or empty
    if (storageMode === 'cloud_encrypted') {
      loadDataFromCloud().then((cloudData) => {
        if (cloudData && cloudData.records && cloudData.records.length > 0) {
          setRecords(cloudData.records);
          saveAttendanceRecords(cloudData.records, userId);
          if (cloudData.leaves) {
            setLeaves(cloudData.leaves);
            saveLeaveRecords(cloudData.leaves, userId);
          }
          if (cloudData.config) {
            setConfig(cloudData.config);
            saveShiftConfig(cloudData.config, userId);
          }
        }
      }).catch((e) => console.warn('Cloud initial load notice:', e));
    }
  }, [userId, storageMode]);

  // Manual trigger to push local data to encrypted cloud
  const handleTriggerSync = async () => {
    await syncDataToCloud({ records, leaves, config });
  };

  // Manual trigger to pull data from encrypted cloud
  const handleTriggerPull = async () => {
    const cloudData = await loadDataFromCloud();
    if (cloudData) {
      if (cloudData.records && Array.isArray(cloudData.records)) {
        setRecords(cloudData.records);
        saveAttendanceRecords(cloudData.records, userId);
      }
      if (cloudData.leaves && Array.isArray(cloudData.leaves)) {
        setLeaves(cloudData.leaves);
        saveLeaveRecords(cloudData.leaves, userId);
      }
      if (cloudData.config) {
        setConfig(cloudData.config);
        saveShiftConfig(cloudData.config, userId);
      }
    }
  };

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
    const weekday = getJalaliWeekdayIndex(dateStr);
    const isThursday = weekday === 5;
    const isThursdayHalfDay = isThursday && cfg.thursdayStatus === 'half_day';
    const hasFullDay = dayLeaves.some(
      (l) =>
        l.type === 'daily' ||
        l.type === 'sick' ||
        l.type === 'unpaid' ||
        (isThursdayHalfDay && l.type === 'half_day')
    );

    const baseData: Partial<AttendanceRecord> & { date: string } = existing
      ? {
          ...existing,
          checkIn: hasFullDay ? null : existing.checkIn,
          checkOut: hasFullDay ? null : existing.checkOut,
          status: hasFullDay ? 'leave' : existing.status,
        }
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
    saveAttendanceRecords(updatedList, userId);
    triggerAutoSync(updatedList, leaves, config);
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
    saveAttendanceRecords(updatedList, userId);
    triggerAutoSync(updatedList, leaves, config);
  };

  // 3. Reset today
  const handleResetToday = () => {
    if (window.confirm('آیا از بازنشانی ثبت ورود/خروج امروز مطمئن هستید؟')) {
      const updatedList = records.filter((r) => r.date !== todayStr);
      setRecords(updatedList);
      saveAttendanceRecords(updatedList, userId);
      triggerAutoSync(updatedList, leaves, config);
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
    saveAttendanceRecords(updatedList, userId);
    triggerAutoSync(updatedList, leaves, config);
    setEditingRecord(null);
  };

  // 5. Delete record
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('آیا از حذف این تردد مطمئن هستید؟')) {
      const updatedList = records.filter((r) => r.id !== id);
      setRecords(updatedList);
      saveAttendanceRecords(updatedList, userId);
      triggerAutoSync(updatedList, leaves, config);
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
    saveLeaveRecords(updatedLeaves, userId);

    const updatedRecords = syncRecordWithLeaves(leaveData.date, records, updatedLeaves, config);
    setRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords, userId);
    triggerAutoSync(updatedRecords, updatedLeaves, config);
  };

  const handleUpdateLeave = (updatedLeave: LeaveRecord) => {
    const updatedLeaves = leaves.map((l) => (l.id === updatedLeave.id ? updatedLeave : l));
    setLeaves(updatedLeaves);
    saveLeaveRecords(updatedLeaves, userId);

    const updatedRecords = syncRecordWithLeaves(updatedLeave.date, records, updatedLeaves, config);
    setRecords(updatedRecords);
    saveAttendanceRecords(updatedRecords, userId);
    triggerAutoSync(updatedRecords, updatedLeaves, config);
  };

  const handleDeleteLeave = (id: string) => {
    const targetLeave = leaves.find((l) => l.id === id);
    const dateStr = targetLeave?.date;
    const updatedLeaves = leaves.filter((l) => l.id !== id);
    setLeaves(updatedLeaves);
    saveLeaveRecords(updatedLeaves, userId);

    if (dateStr) {
      const updatedRecords = syncRecordWithLeaves(dateStr, records, updatedLeaves, config);
      setRecords(updatedRecords);
      saveAttendanceRecords(updatedRecords, userId);
      triggerAutoSync(updatedRecords, updatedLeaves, config);
    }
  };

  // 7. Update Shift settings & recalculate all records
  const handleSaveConfig = (newConfig: ShiftConfig) => {
    setConfig(newConfig);
    saveShiftConfig(newConfig, userId);

    const recalculated = records.map((r) =>
      calculateAttendanceMetrics(r, newConfig, leaves.filter((l) => l.date === r.date))
    );
    setRecords(recalculated);
    saveAttendanceRecords(recalculated, userId);
    triggerAutoSync(recalculated, leaves, newConfig);
  };

  // 8. Excel Export
  const handleExportExcel = () => {
    exportMonthToExcel(records, selectedYear, selectedMonth, selectedMonthName);
  };

  // 9. Data restore & Reset
  const handleDataRestored = () => {
    const storedRecs = getStoredAttendanceRecords(userId);
    const storedLeaves = getStoredLeaveRecords(userId);
    const storedCfg = getStoredShiftConfig(userId);
    setRecords(storedRecs);
    setLeaves(storedLeaves);
    setConfig(storedCfg);
    triggerAutoSync(storedRecs, storedLeaves, storedCfg);
  };

  const handleResetAllData = () => {
    saveAttendanceRecords([], userId);
    saveLeaveRecords([], userId);
    saveShiftConfig(DEFAULT_SHIFT_CONFIG, userId);
    setRecords([]);
    setLeaves([]);
    setConfig(DEFAULT_SHIFT_CONFIG);
    triggerAutoSync([], [], DEFAULT_SHIFT_CONFIG);
  };

  return (
    <div data-theme={currentTheme} className="min-h-screen flex flex-col font-sans pb-24 md:pb-16 transition-colors duration-300">
      {/* Top Navigation Bar with Tabs & User Profile */}
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
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenStorageMode={() => setIsStorageModalOpen(true)}
        isWorkingNow={isWorkingNow}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area: md:mr-20 accounts for the fixed vertical dock on desktop */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6 md:pr-20">
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            {/* Live Clock Card */}
            <section aria-label="ثبت زنده تردد">
              <ClockCard
                todayRecord={todayRecord}
                config={config}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onResetToday={handleResetToday}
                onOpenEdit={() => {
                  setEditingRecord(todayRecord || ({ date: todayStr } as any));
                  setIsManualModalOpen(true);
                }}
              />
            </section>

            {/* Quick KPI Stats Summary */}
            <section aria-label="خلاصه آماری ماه جاری">
              <StatsCards
                stats={monthlyStats}
                monthName={selectedMonthName}
                year={selectedYear}
              />
            </section>

            {/* Smart Solar Hijri Calendar (Prominent Centerpiece replacing charts) */}
            <section aria-label="تقویم شمسی هوشمند و برنامه کاری">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {dashboardView === 'calendar' ? 'تقویم هوشمند شمسی ماه جاری با تعطیلات رسمی' : 'نمودارهای آماری کارکرد'}
                  </span>
                </div>

                {/* View switcher between Calendar and Charts */}
                <div className="flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-[#171b28] p-1 shadow-inner text-xs">
                  <button
                    onClick={() => setDashboardView('calendar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                      dashboardView === 'calendar'
                        ? 'bg-[#2f68fd] text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>تقویم شمسی</span>
                  </button>
                  <button
                    onClick={() => setDashboardView('charts')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                      dashboardView === 'charts'
                        ? 'bg-[#2f68fd] text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>نمودارها</span>
                  </button>
                </div>
              </div>

              {dashboardView === 'calendar' ? (
                <PersianCalendar
                  records={records}
                  leaves={leaves}
                  config={config}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  onYearChange={setSelectedYear}
                  onMonthChange={setSelectedMonth}
                  onOpenManualEntryForDate={(dateStr) => {
                    const existing = records.find((r) => r.date === dateStr);
                    setEditingRecord(existing || ({ date: dateStr } as any));
                    setIsManualModalOpen(true);
                  }}
                  onOpenLeaveForDate={(dateStr) => {
                    setEditingLeave({ date: dateStr } as any);
                    setIsLeaveModalOpen(true);
                  }}
                  onDeleteRecord={handleDeleteRecord}
                />
              ) : (
                <DashboardCharts
                  records={records}
                  stats={monthlyStats}
                  config={config}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                />
              )}
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

        {/* Tab 2: Timesheet Table */}
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

        {/* Tab 3: Leaves Management */}
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

        {/* Tab 4: Comprehensive Reports */}
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

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around text-[10px]">
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

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <StorageModeModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        onTriggerSync={handleTriggerSync}
        onTriggerPull={handleTriggerPull}
      />
    </div>
  );
}

function AppWithAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4">
        <div className="relative flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <CalendarClock className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <span className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>در حال بررسی امنیت و بارگذاری سامانه...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <DashboardApp />;
}

export function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

export default App;
