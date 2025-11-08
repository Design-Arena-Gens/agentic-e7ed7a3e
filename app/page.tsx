'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Plus, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface Worker {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
}

interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string;
  status: 'present' | 'absent';
  hours?: number;
  overtime?: number;
}

export default function Home() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', role: 'Plumber', dailyRate: 0 });

  useEffect(() => {
    const savedWorkers = localStorage.getItem('workers');
    const savedAttendance = localStorage.getItem('attendance');
    if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
  }, []);

  useEffect(() => {
    localStorage.setItem('workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('attendance', JSON.stringify(attendance));
  }, [attendance]);

  const addWorker = () => {
    if (newWorker.name && newWorker.dailyRate > 0) {
      const worker: Worker = {
        id: Date.now().toString(),
        ...newWorker,
      };
      setWorkers([...workers, worker]);
      setNewWorker({ name: '', role: 'Plumber', dailyRate: 0 });
      setShowAddWorker(false);
    }
  };

  const removeWorker = (id: string) => {
    setWorkers(workers.filter(w => w.id !== id));
    setAttendance(attendance.filter(a => a.workerId !== id));
  };

  const markAttendance = (workerId: string, status: 'present' | 'absent', hours?: number, overtime?: number) => {
    const existing = attendance.find(a => a.workerId === workerId && a.date === selectedDate);

    if (existing) {
      setAttendance(attendance.map(a =>
        a.id === existing.id
          ? { ...a, status, hours, overtime }
          : a
      ));
    } else {
      const record: AttendanceRecord = {
        id: Date.now().toString(),
        workerId,
        date: selectedDate,
        status,
        hours,
        overtime,
      };
      setAttendance([...attendance, record]);
    }
  };

  const getAttendanceForDate = (workerId: string, date: string) => {
    return attendance.find(a => a.workerId === workerId && a.date === date);
  };

  const calculateTotalPayment = (workerId: string, startDate: string, endDate: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return 0;

    const records = attendance.filter(a =>
      a.workerId === workerId &&
      a.date >= startDate &&
      a.date <= endDate &&
      a.status === 'present'
    );

    return records.reduce((total, record) => {
      const basePayment = worker.dailyRate;
      const overtimePayment = (record.overtime || 0) * (worker.dailyRate / 8) * 1.5;
      return total + basePayment + overtimePayment;
    }, 0);
  };

  const getAttendanceSummary = (workerId: string) => {
    const records = attendance.filter(a => a.workerId === workerId);
    const present = records.filter(a => a.status === 'present').length;
    const absent = records.filter(a => a.status === 'absent').length;
    return { present, absent, total: records.length };
  };

  const getMonthTotal = (workerId: string) => {
    const now = new Date();
    const startOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
    const endOfMonth = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');
    return calculateTotalPayment(workerId, startOfMonth, endOfMonth);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            Contractor Management System
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Track attendance and manage payments for your plumbing team</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Workers</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{workers.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Today Present</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {attendance.filter(a => a.date === selectedDate && a.status === 'present').length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Month Total</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              ${workers.reduce((sum, w) => sum + getMonthTotal(w.id), 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Workers & Attendance</h2>
            <button
              onClick={() => setShowAddWorker(!showAddWorker)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Worker
            </button>
          </div>

          {showAddWorker && (
            <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Add New Worker</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Worker Name"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <select
                  value={newWorker.role}
                  onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option>Plumber</option>
                  <option>Helper</option>
                  <option>Supervisor</option>
                  <option>Technician</option>
                </select>
                <input
                  type="number"
                  placeholder="Daily Rate ($)"
                  value={newWorker.dailyRate || ''}
                  onChange={(e) => setNewWorker({ ...newWorker, dailyRate: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={addWorker}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Role</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Daily Rate</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Attendance</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Hours</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Overtime</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Summary</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Month Total</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => {
                  const record = getAttendanceForDate(worker.id, selectedDate);
                  const summary = getAttendanceSummary(worker.id);
                  const monthTotal = getMonthTotal(worker.id);

                  return (
                    <tr key={worker.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-white">{worker.name}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{worker.role}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">${worker.dailyRate}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => markAttendance(worker.id, 'present', record?.hours || 8, record?.overtime || 0)}
                            className={`p-2 rounded-lg transition-colors ${
                              record?.status === 'present'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100'
                            }`}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => markAttendance(worker.id, 'absent')}
                            className={`p-2 rounded-lg transition-colors ${
                              record?.status === 'absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100'
                            }`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={record?.hours || 8}
                          onChange={(e) => markAttendance(worker.id, 'present', parseFloat(e.target.value) || 8, record?.overtime || 0)}
                          disabled={record?.status !== 'present'}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max="8"
                          step="0.5"
                          value={record?.overtime || 0}
                          onChange={(e) => markAttendance(worker.id, 'present', record?.hours || 8, parseFloat(e.target.value) || 0)}
                          disabled={record?.status !== 'present'}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <div className="text-green-600 font-semibold">P: {summary.present}</div>
                          <div className="text-red-600 font-semibold">A: {summary.absent}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-purple-600">${monthTotal.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => removeWorker(worker.id)}
                          className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {workers.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No workers added yet. Click "Add Worker" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
