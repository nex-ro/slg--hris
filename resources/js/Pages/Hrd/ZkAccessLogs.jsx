import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayouts from '@/Layouts/DasboardLayout';
import {
  RefreshCw,
  Search,
  Calendar,
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  LogIn,
  LogOut,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  Filter,
  History,
  CalendarRange,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function ZkAccessLogs({
  initialLogs = [],
  initialDate = '',
  initialCount = 0,
  connectionInfo = {}
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingTwoDays, setSyncingTwoDays] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, I, O
  const [connection, setConnection] = useState(connectionInfo);

  // Ambil data log terbaru dari backend (Single Date)
  const fetchLogs = async (dateToFetch = selectedDate) => {
    setLoading(true);
    try {
      const response = await axios.get('/absensi/zkaccess/logs', {
        params: { date: dateToFetch, limit: 1000 }
      });

      if (response.data.status === 'success') {
        setLogs(response.data.data || []);
        toast.success(`Berhasil memuat ${response.data.count} log absensi untuk tanggal ${dateToFetch}`);
      } else {
        toast.error(response.data.message || 'Gagal mengambil data log dari ZKAccess');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  // Ambil data log untuk rentang tanggal (Kemarin & Hari Ini)
  const fetchLogsRange = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await axios.get('/absensi/zkaccess/logs', {
        params: { startDate, endDate, limit: 1000 }
      });

      if (response.data.status === 'success') {
        setLogs(response.data.data || []);
        toast.success(`Berhasil memuat ${response.data.count} log absensi (${startDate} s/d ${endDate})`);
      } else {
        toast.error(response.data.message || 'Gagal mengambil data log dari ZKAccess');
      }
    } catch (error) {
      console.error('Error fetching logs range:', error);
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  // Sinkronkan ke tabel kehadiran (Otomatis Pulang Kemarin & Datang Hari Ini jika tanggal hari ini)
  const handleSyncToKehadiran = async () => {
    const isTodayOrRange = !selectedDate || selectedDate === new Date().toISOString().split('T')[0] || selectedDate.includes('s/d');
    const confirmMessage = isTodayOrRange
      ? 'Apakah Anda ingin menyinkronkan data Pulang Kemarin & Kedatangan Hari Ini ke tabel Kehadiran?'
      : `Apakah Anda yakin ingin menyinkronkan data log tanggal ${selectedDate} ke tabel Kehadiran?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setSyncing(true);
    try {
      const response = await axios.post('/absensi/zkaccess/sync', {
        date: selectedDate.includes('s/d') ? '' : selectedDate
      });

      if (response.data.status === 'success') {
        toast.success(response.data.message || 'Sinkronisasi berhasil!');
        fetchLogs(new Date().toISOString().split('T')[0]);
      } else {
        toast.error(response.data.message || 'Sinkronisasi gagal.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error.response?.data?.message || 'Gagal menyinkronkan data.');
    } finally {
      setSyncing(false);
    }
  };

  // Uji koneksi ulang
  const handleTestConnection = async () => {
    try {
      const response = await axios.get('/absensi/zkaccess/test');
      setConnection(response.data);
      if (response.data.status === 'success') {
        toast.success('Koneksi ke perangkat ZKAccess normal.');
      } else {
        toast.warn(response.data.message);
      }
    } catch (err) {
      toast.error('Gagal menguji koneksi.');
    }
  };

  // Filter logs berdasarkan search dan tipe (I / O)
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (item.pin && item.pin.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.system_name && item.system_name.toLowerCase().includes(q));

      const matchType =
        typeFilter === 'ALL' ||
        (typeFilter === 'I' && (item.checktype === 'I')) ||
        (typeFilter === 'O' && (item.checktype === 'O'));

      return matchSearch && matchType;
    });
  }, [logs, searchQuery, typeFilter]);

  // Statistik ringkas
  const stats = useMemo(() => {
    const total = logs.length;
    const uniquePins = new Set(logs.map(l => l.pin)).size;
    const checkIns = logs.filter(l => l.checktype === 'I').length;
    const checkOuts = logs.filter(l => l.checktype === 'O').length;
    return { total, uniquePins, checkIns, checkOuts };
  }, [logs]);

  const device = connection?.devices?.[0] || {
    name: 'Liberty Lt. 1 Front Office',
    ip: '192.168.87.201',
    port: 4370
  };

  return (
    <DashboardLayouts>
      <Head title="Log Mesin Absensi ZKAccess" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Log Mesin Absensi (ZKAccess)</h1>
                <p className="text-sm text-gray-500">
                  Data log absensi real-time dari mesin fingerprint & access control
                </p>
              </div>
            </div>
          </div>

          {/* Device info badge */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-xs">
              <p className="font-semibold text-gray-800">{device.name}</p>
              <p className="text-gray-500 font-mono">
                IP: {device.ip}:{device.port} • <span className="text-emerald-600 font-semibold">Tarik Langsung dari Mesin</span>
              </p>
            </div>
            <button
              onClick={handleTestConnection}
              title="Cek Status Koneksi"
              className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Cek
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Log Terbaca</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pegawai Scan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.uniquePins}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In (Masuk)</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.checkIns}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out (Pulang)</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.checkOuts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Actions */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Filter Tanggal & Quick Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate.includes('s/d') ? '' : selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    fetchLogs(e.target.value);
                  }}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none border-none p-0 focus:ring-0"
                />
              </div>

              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setSelectedDate(today);
                  fetchLogs(today);
                }}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hari Ini
              </button>

              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  const yesterday = d.toISOString().split('T')[0];
                  setSelectedDate(yesterday);
                  fetchLogs(yesterday);
                }}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                  (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    return selectedDate === d.toISOString().split('T')[0];
                  })()
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Kemarin
              </button>

              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  const yesterday = d.toISOString().split('T')[0];
                  const today = new Date().toISOString().split('T')[0];
                  setSelectedDate(`${yesterday} s/d ${today}`);
                  fetchLogsRange(yesterday, today);
                }}
                className="text-xs px-3 py-2 rounded-xl font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-all flex items-center gap-1.5"
              >
                <CalendarRange className="w-3.5 h-3.5" />
                Lihat Kemarin & Hari Ini
              </button>

              {/* Filter Tipe Scan */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-medium text-gray-600 ml-1">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    typeFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'hover:text-gray-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTypeFilter('I')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    typeFilter === 'I' ? 'bg-emerald-500 text-white shadow-sm font-semibold' : 'hover:text-gray-900'
                  }`}
                >
                  Masuk
                </button>
                <button
                  onClick={() => setTypeFilter('O')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    typeFilter === 'O' ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'hover:text-gray-900'
                  }`}
                >
                  Pulang
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Button Refresh */}
              <button
                onClick={() => {
                  if (selectedDate.includes('s/d')) {
                    const parts = selectedDate.split(' s/d ');
                    fetchLogsRange(parts[0], parts[1]);
                  } else {
                    fetchLogs(selectedDate);
                  }
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Membaca Mesin...' : 'Refresh Log Mesin'}</span>
              </button>

              {/* Button Sinkronkan ke Kehadiran (Pulang Kemarin + Datang Hari Ini) */}
              <button
                onClick={handleSyncToKehadiran}
                disabled={syncing || loading}
                title="Melengkapi Jam Pulang Kemarin & Jam Masuk Hari Ini ke tabel Kehadiran"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
              >
                <Database className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse' : ''}`} />
                <span>{syncing ? 'Menyinkronkan Kehadiran...' : 'Sinkronkan ke Kehadiran'}</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan PIN atau Nama Pegawai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table Log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Daftar Log Absensi ({filteredLogs.length} record)
            </h3>
            <span className="text-xs text-gray-500">
              Periode: <strong className="text-gray-700">{selectedDate}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 w-16">No</th>
                  <th className="px-5 py-3.5">PIN / UID</th>
                  <th className="px-5 py-3.5">Nama Pegawai</th>
                  <th className="px-5 py-3.5">Divisi / Tower</th>
                  <th className="px-5 py-3.5">Waktu Scan</th>
                  <th className="px-5 py-3.5 text-center">Tipe Scan</th>
                  <th className="px-5 py-3.5 text-center">Status HRIS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-gray-300" />
                        <p className="font-medium text-gray-500">Tidak ada log absensi ditemukan.</p>
                        <p className="text-xs text-gray-400">
                          Tekan tombol <strong>"Refresh / Tarik Log"</strong> atau pilih tanggal yang berbeda.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => {
                    const isCheckIn = log.checktype === 'I';
                    const isCheckOut = log.checktype === 'O';
                    return (
                      <tr key={index} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-5 py-3 text-gray-400 font-mono text-xs">{index + 1}</td>
                        <td className="px-5 py-3 font-semibold font-mono text-gray-900">
                          {log.pin}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                              {(log.system_name || log.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 leading-tight">
                                {log.system_name || log.name || 'Tidak Diketahui'}
                              </p>
                              {log.system_name && log.name && log.system_name !== log.name && (
                                <p className="text-[11px] text-gray-400">ZK: {log.name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">
                          {log.divisi ? (
                            <span>{log.divisi} {log.tower ? `(${log.tower})` : ''}</span>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-800 font-mono text-xs">
                          {log.checktime}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {isCheckIn ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <LogIn className="w-3 h-3" />
                              Masuk
                            </span>
                          ) : isCheckOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <LogOut className="w-3 h-3" />
                              Pulang
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              <Clock className="w-3 h-3" />
                              Antara
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {log.user_exists ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              Terdaftar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              UID Tidak Cocok
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayouts>
  );
}
