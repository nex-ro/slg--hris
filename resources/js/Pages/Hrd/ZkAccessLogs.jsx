import React, { useState, useMemo, useEffect } from 'react';
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
  CalendarRange,
  MapPin,
  Edit2,
  Info,
  Plus,
  Trash2,
  X,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function ZkAccessLogs({
  initialLogs = [],
  initialDate = '',
  initialCount = 0,
  defaultDevices = [],
  connectionInfo = {}
}) {
  // 1. State Mesin / Lokasi On-Premise (dengan persistensi LocalStorage)
  const [devices, setDevices] = useState(() => {
    try {
      const saved = localStorage.getItem('zkaccess_devices_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) { }

    return defaultDevices && defaultDevices.length >= 2 ? defaultDevices : [
      {
        id: 'dev_1',
        name: 'Lokasi 1 (Liberty Lt. 1 Front Office)',
        ip: '192.168.87.201',
        port: 4370,
        online: true,
      },
      {
        id: 'dev_2',
        name: 'Lokasi 2 (Mesin 2)',
        ip: '192.168.87.202',
        port: 4370,
        online: false,
      }
    ];
  });

  // Simpan ke LocalStorage setiap kali ada perubahan pada daftar mesin
  const updateDevicesList = (newDevices) => {
    setDevices(newDevices);
    try {
      localStorage.setItem('zkaccess_devices_list', JSON.stringify(newDevices));
    } catch (e) { }
  };

  const [activeDeviceId, setActiveDeviceId] = useState(() => {
    return devices[0]?.id || 'dev_1';
  });

  const activeDevice = useMemo(() => {
    return devices.find(d => d.id === activeDeviceId) || devices[0] || {
      id: 'dev_1',
      name: 'Lokasi 1 (Liberty Lt. 1 Front Office)',
      ip: '192.168.87.201',
      port: 4370,
      online: false,
    };
  }, [devices, activeDeviceId]);

  // State Modal Tambah Mesin Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeviceForm, setNewDeviceForm] = useState({
    name: '',
    ip: '',
    port: 4370,
  });

  // State proses bersihkan log mesin fisik
  const [clearingLogs, setClearingLogs] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Helper tanggal lokal (YYYY-MM-DD) agar tidak terpengaruh offset UTC
  const getLocalDateString = (dateObj = new Date()) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State data in-memory (On-Premise)
  const [logs, setLogs] = useState(initialLogs);
  const [selectedDate, setSelectedDate] = useState(initialDate || getLocalDateString());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, I (Masuk), O (Pulang)

  // Uji koneksi perangkat (Online )
  const checkDeviceOnline = async (ip, port, devId) => {
    try {
      const res = await axios.get('/absensi/zkaccess/test', {
        params: { ip, port }
      });
      const isOnline = res.data?.online ?? false;
      setDevices(prev => prev.map(d => d.id === devId ? { ...d, online: isOnline } : d));
    } catch (e) {
      setDevices(prev => prev.map(d => d.id === devId ? { ...d, online: false } : d));
    }
  };

  const fetchLogs = async (dateToFetch = selectedDate, targetIp = activeDevice.ip, targetPort = activeDevice.port) => {
    setLoading(true);
    try {
      const queryDate = dateToFetch === 'ALL' ? '' : dateToFetch;
      const response = await axios.get('/absensi/zkaccess/logs', {
        params: {
          date: queryDate,
          limit: 1000,
          ip: targetIp,
          port: targetPort
        }
      });

      if (response.data.status === 'success') {
        const incoming = response.data.data || [];
        setLogs(incoming);
        setDevices(prev => prev.map(d => d.id === activeDevice.id ? { ...d, online: true } : d));
        toast.success(`Berhasil memuat ${incoming.length} log untuk ${dateToFetch || 'semua tanggal'}`);
      } else {
        toast.error(response.data.message || 'Gagal mengambil data log dari ZKAccess');
        setDevices(prev => prev.map(d => d.id === activeDevice.id ? { ...d, online: false } : d));
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menghubungi server.');
      setDevices(prev => prev.map(d => d.id === activeDevice.id ? { ...d, online: false } : d));
    } finally {
      setLoading(false);
    }
  };

  // Ambil data log untuk rentang tanggal (Kemarin & Hari Ini)
  const fetchLogsRange = async (startDate, endDate, targetIp = activeDevice.ip, targetPort = activeDevice.port) => {
    setLoading(true);
    try {
      const response = await axios.get('/absensi/zkaccess/logs', {
        params: {
          startDate,
          endDate,
          limit: 1000,
          ip: targetIp,
          port: targetPort
        }
      });

      if (response.data.status === 'success') {
        const incoming = response.data.data || [];
        setLogs(incoming);
        setDevices(prev => prev.map(d => d.id === activeDevice.id ? { ...d, online: true } : d));
        toast.success(`Berhasil memuat ${incoming.length} log (${startDate} s/d ${endDate})`);
      } else {
        toast.error(response.data.message || 'Gagal mengambil data log dari ZKAccess');
        setDevices(prev => prev.map(d => d.id === activeDevice.id ? { ...d, online: false } : d));
      }
    } catch (error) {
      console.error('Error fetching logs range:', error);
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menghubungi server.');
      setDevices(prev => prev.map(d => d.id === activeDevice.id ? { ...d, online: false } : d));
    } finally {
      setLoading(false);
    }
  };

  // Otomatis muat koneksi & data hari ini saat halaman pertama kali dibuka
  useEffect(() => {
    devices.forEach(dev => {
      checkDeviceOnline(dev.ip, dev.port, dev.id);
    });

    const today = getLocalDateString();
    fetchLogs(today, activeDevice.ip, activeDevice.port);
  }, []);

  // Berganti lokasi mesin
  const handleSwitchDevice = (dev) => {
    if (dev.id === activeDeviceId) return;
    setActiveDeviceId(dev.id);
    checkDeviceOnline(dev.ip, dev.port, dev.id);
    toast.info(`Beralih ke ${dev.name} (${dev.ip})`);

    // Tarik log untuk mesin yang baru dipilih
    if (selectedDate.includes('s/d')) {
      const parts = selectedDate.split(' s/d ');
      fetchLogsRange(parts[0], parts[1], dev.ip, dev.port);
    } else {
      fetchLogs(selectedDate, dev.ip, dev.port);
    }
  };

  // Tambah Mesin Baru
  const handleCreateDevice = (e) => {
    e.preventDefault();
    if (!newDeviceForm.name.trim() || !newDeviceForm.ip.trim()) {
      toast.error('Nama mesin dan Alamat IP harus diisi!');
      return;
    }

    const newDev = {
      id: `dev_${Date.now()}`,
      name: newDeviceForm.name.trim(),
      ip: newDeviceForm.ip.trim(),
      port: parseInt(newDeviceForm.port) || 4370,
      online: false,
    };

    const nextDevices = [...devices, newDev];
    updateDevicesList(nextDevices);
    setActiveDeviceId(newDev.id);
    setIsAddModalOpen(false);
    setNewDeviceForm({ name: '', ip: '', port: 4370 });

    toast.success(`Mesin "${newDev.name}" berhasil ditambahkan! Menguji koneksi...`);
    checkDeviceOnline(newDev.ip, newDev.port, newDev.id);
  };

  // Hapus Mesin dari Daftar
  const handleDeleteDevice = (devId, devName) => {
    if (devices.length <= 1) {
      toast.warning('Minimal harus ada 1 mesin absensi terdaftar.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus "${devName}" dari daftar mesin?`)) {
      return;
    }

    const nextDevices = devices.filter(d => d.id !== devId);
    updateDevicesList(nextDevices);

    if (activeDeviceId === devId) {
      const fallbackId = nextDevices[0].id;
      setActiveDeviceId(fallbackId);
      toast.info(`Beralih ke mesin ${nextDevices[0].name}`);
    }

    toast.success(`Mesin "${devName}" berhasil dihapus.`);
  };

  // Ubah IP / Nama Mesin
  const handleEditDevice = (dev) => {
    const newName = prompt(`Ubah Nama Mesin:`, dev.name);
    if (newName === null) return;
    const newIp = prompt(`Ubah Alamat IP Mesin (${dev.name}):`, dev.ip);
    if (newIp === null) return;

    const trimmedName = newName.trim() || dev.name;
    const trimmedIp = newIp.trim() || dev.ip;

    const nextDevices = devices.map(d => {
      if (d.id === dev.id) {
        return { ...d, name: trimmedName, ip: trimmedIp };
      }
      return d;
    });

    updateDevicesList(nextDevices);
    toast.success(`Mesin "${trimmedName}" berhasil diperbarui.`);
    checkDeviceOnline(trimmedIp, dev.port, dev.id);
  };

  // Bersihkan Seluruh Log pada Memori Mesin Fisik
  const handleClearMachineLogs = async () => {
    setClearingLogs(true);
    try {
      const response = await axios.post('/absensi/zkaccess/clear-logs', {
        ip: activeDevice.ip,
        port: activeDevice.port,
      });

      if (response.data.status === 'success') {
        toast.success(response.data.message || 'Log mesin fisik berhasil dibersihkan!');
        setIsClearModalOpen(false);
        // Refresh log tampilan
        fetchLogs(selectedDate, activeDevice.ip, activeDevice.port);
      } else {
        toast.error(response.data.message || 'Gagal membersihkan log mesin.');
      }
    } catch (error) {
      console.error('Clear logs error:', error);
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat membersihkan log mesin.');
    } finally {
      setClearingLogs(false);
    }
  };

  // Handler tombol cepat tanggal
  const handleSelectSingleDate = (dateVal) => {
    setSelectedDate(dateVal);
    fetchLogs(dateVal, activeDevice.ip, activeDevice.port);
  };

  const handleSelectDateRange = (startDate, endDate) => {
    const label = `${startDate} s/d ${endDate}`;
    setSelectedDate(label);
    fetchLogsRange(startDate, endDate, activeDevice.ip, activeDevice.port);
  };

  // Sinkronkan ke tabel kehadiran HRIS (Masuk & Pulang)
  const handleSyncToKehadiran = async () => {
    const isRange = selectedDate.includes('s/d');
    const isToday = !selectedDate || selectedDate === getLocalDateString();
    const parts = isRange ? selectedDate.split(' s/d ') : [];

    const confirmMessage = isRange
      ? `Apakah Anda ingin menyinkronkan data kehadiran untuk periode ${selectedDate} dari ${activeDevice.name} ke tabel Kehadiran?`
      : isToday
        ? `Apakah Anda ingin menyinkronkan data Pulang Kemarin & Kedatangan Hari Ini dari ${activeDevice.name} ke tabel Kehadiran?`
        : `Apakah Anda yakin ingin menyinkronkan data log tanggal ${selectedDate} dari ${activeDevice.name} ke tabel Kehadiran?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setSyncing(true);
    try {
      const response = await axios.post('/absensi/zkaccess/sync', {
        date: isRange ? '' : selectedDate,
        startDate: isRange ? parts[0] : '',
        endDate: isRange ? parts[1] : '',
        ip: activeDevice.ip,
        port: activeDevice.port
      });

      if (response.data.status === 'success') {
        toast.success(response.data.message || 'Sinkronisasi berhasil!');
        fetchLogs(getLocalDateString(), activeDevice.ip, activeDevice.port);
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

  // Filter logs berdasarkan search, tipe (Masuk: I, Pulang: O), dan tanggal
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

      let matchDate = true;
      if (selectedDate && selectedDate !== 'ALL' && item.checktime) {
        const itemDate = item.checktime.substring(0, 10);
        if (selectedDate.includes('s/d')) {
          const parts = selectedDate.split(' s/d ');
          if (parts.length === 2) {
            matchDate = itemDate >= parts[0] && itemDate <= parts[1];
          }
        } else {
          matchDate = itemDate === selectedDate;
        }
      }

      return matchSearch && matchType && matchDate;
    });
  }, [logs, searchQuery, typeFilter, selectedDate]);

  // Statistik ringkas berdasarkan data yang sedang tampil
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const uniquePins = new Set(filteredLogs.map(l => l.pin)).size;
    const checkIns = filteredLogs.filter(l => l.checktype === 'I').length;
    const checkOuts = filteredLogs.filter(l => l.checktype === 'O').length;
    return { total, uniquePins, checkIns, checkOuts };
  }, [filteredLogs]);

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
                  Data log on-premise dari mesin fingerprint & access control (Masuk & Pulang Kerja)
                </p>
              </div>
            </div>
          </div>

          {/* Active device indicator */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
            <span className="relative flex h-3 w-3">
              {activeDevice.online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeDevice.online ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
            </span>
            <div className="text-xs">
              <p className="font-semibold text-gray-800">{activeDevice.name}</p>
              <p className="text-gray-500 font-mono">
                IP: {activeDevice.ip}:{activeDevice.port} •{' '}
                <span className={activeDevice.online ? 'text-emerald-600 font-semibold' : 'text-gray-500 font-semibold'}>
                  {activeDevice.online ? 'Online' : 'Offline'}
                </span>
              </p>
            </div>
            <button
              onClick={() => checkDeviceOnline(activeDevice.ip, activeDevice.port, activeDevice.id)}
              title="Cek Status Koneksi"
              className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Cek
            </button>
          </div>
        </div>

        {/* Location & Machine Switcher */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Pilih Lokasi Mesin Absensi ({devices.length} Terdaftar)</span>
              </h2>
              <p className="text-xs text-gray-500">
                Klik kartu lokasi untuk berganti mesin aktif. Indikator hijau menandakan mesin terhubung di jaringan on-premise.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 font-semibold px-3 py-2 rounded-xl shadow-sm transition-all self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Mesin</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {devices.map((dev) => {
              const isSelected = dev.id === activeDeviceId;
              return (
                <div
                  key={dev.id}
                  onClick={() => handleSwitchDevice(dev)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${isSelected
                    ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-gray-200 bg-gray-50/60 hover:bg-white hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-3.5 w-3.5 flex-shrink-0">
                      {dev.online && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${dev.online ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}></span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                          {dev.name}
                        </p>
                        {isSelected && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        IP: <span className="font-semibold text-gray-700">{dev.ip}:{dev.port}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${dev.online
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                      {dev.online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        checkDeviceOnline(dev.ip, dev.port, dev.id);
                      }}
                      title="Periksa Koneksi"
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDevice(dev);
                      }}
                      title="Ubah Nama / IP Mesin"
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {devices.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDevice(dev.id, dev.name);
                        }}
                        title="Hapus Mesin dari Daftar"
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
              <p className="text-[10px] text-gray-400 mt-0.5">&lt; Jam 17:00</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out (Pulang)</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.checkOuts}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">&ge; Jam 17:00:00</p>
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate.includes('s/d') || selectedDate === 'ALL' ? '' : selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSelectSingleDate(e.target.value);
                    }
                  }}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none border-none p-0 focus:ring-0"
                />
              </div>

              <button
                onClick={() => {
                  const today = getLocalDateString();
                  handleSelectSingleDate(today);
                }}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${selectedDate === getLocalDateString()
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
                  const yesterday = getLocalDateString(d);
                  handleSelectSingleDate(yesterday);
                }}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${(() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  return selectedDate === getLocalDateString(d);
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
                  const yesterday = getLocalDateString(d);
                  const today = getLocalDateString();
                  handleSelectDateRange(yesterday, today);
                }}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${selectedDate === `${(() => { const d = new Date(); d.setDate(d.getDate() - 1); return getLocalDateString(d); })()} s/d ${getLocalDateString()}`
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                  }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                Kemarin & Hari Ini
              </button>

              <button
                onClick={() => handleSelectSingleDate('ALL')}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${selectedDate === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                title="Tampilkan semua data log"
              >
                Semua Tanggal
              </button>

              {/* Filter Tipe Scan: Semua / Masuk / Pulang */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-medium text-gray-600 ml-1">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${typeFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'hover:text-gray-900'
                    }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTypeFilter('I')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${typeFilter === 'I' ? 'bg-emerald-500 text-white shadow-sm font-semibold' : 'hover:text-gray-900'
                    }`}
                  title="Scan sebelum jam 17:00"
                >
                  Masuk Kerja
                </button>
                <button
                  onClick={() => setTypeFilter('O')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${typeFilter === 'O' ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'hover:text-gray-900'
                    }`}
                  title="Scan jam 17:00 ke atas (Pulang)"
                >
                  Pulang Kerja
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Button Refresh Mesin Langsung */}
              <button
                onClick={() => {
                  if (selectedDate.includes('s/d')) {
                    const parts = selectedDate.split(' s/d ');
                    fetchLogsRange(parts[0], parts[1], activeDevice.ip, activeDevice.port);
                  } else {
                    fetchLogs(selectedDate, activeDevice.ip, activeDevice.port);
                  }
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Membaca Data...' : 'Refresh Log Mesin'}</span>
              </button>

              {/* Button Sinkronkan ke Kehadiran (Masuk & Pulang) */}
              <button
                onClick={handleSyncToKehadiran}
                disabled={syncing || loading}
                title="Melengkapi Jam Pulang & Jam Masuk ke tabel Kehadiran"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
              >
                <Database className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse' : ''}`} />
                <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan ke Kehadiran'}</span>
              </button>

              {/* Button Bersihkan Log Mesin Fisik */}
              <button
                onClick={() => setIsClearModalOpen(true)}
                disabled={clearingLogs || loading}
                title={`Kosongkan/hapus seluruh memori log transaksi pada mesin ${activeDevice.name} (${activeDevice.ip})`}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Bersihkan Log Mesin</span>
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
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Daftar Log Absensi ({filteredLogs.length} record) • <span className="text-blue-600">{activeDevice.name}</span>
              </h3>
            </div>
            <span className="text-xs text-gray-500">
              Periode: <strong className="text-gray-700">{selectedDate === 'ALL' ? 'Semua Tanggal' : selectedDate}</strong>
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
                        <p className="font-medium text-gray-700">Tidak ada log absensi yang ditemukan.</p>
                        <p className="text-xs text-gray-500 max-w-md">
                          Tidak ada log untuk periode "{selectedDate}" di {activeDevice.name}. Silakan pilih tanggal lain atau tekan tombol di bawah.
                        </p>
                        <button
                          onClick={() => {
                            if (selectedDate.includes('s/d')) {
                              const parts = selectedDate.split(' s/d ');
                              fetchLogsRange(parts[0], parts[1], activeDevice.ip, activeDevice.port);
                            } else {
                              fetchLogs(selectedDate, activeDevice.ip, activeDevice.port);
                            }
                          }}
                          disabled={loading}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-blue-700"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                          <span>{loading ? 'Membaca Data...' : 'Refresh Log Mesin Sekarang'}</span>
                        </button>
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
                              {log.name && log.system_name && log.name !== log.system_name && (
                                <p className="text-[11px] text-gray-400">
                                  Nama Mesin: {log.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600 text-xs">
                          {log.divisi ? (
                            <div>
                              <span className="font-medium text-gray-800">{log.divisi}</span>
                              {log.tower && <span className="text-gray-400"> • {log.tower}</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-700 font-semibold">
                          {log.checktime}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {isCheckIn && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <LogIn className="w-3 h-3 text-emerald-600" />
                                Masuk
                              </span>
                              {log.checktime && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.checktime.substring(11, 19) <= '08:00:59'
                                  ? 'text-emerald-700 bg-emerald-100'
                                  : 'text-rose-700 bg-rose-100'
                                  }`}>
                                  {log.checktime.substring(11, 19) <= '08:00:59' ? 'On Time' : 'Terlambat'}
                                </span>
                              )}
                            </div>
                          )}
                          {isCheckOut && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                                <LogOut className="w-3 h-3 text-amber-600" />
                                Pulang (Check-Out)
                              </span>
                            </div>
                          )}
                          {!isCheckIn && !isCheckOut && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {log.checktype || 'Scan'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {log.user_exists ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              Terdaftar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500">
                              <AlertCircle className="w-3 h-3 text-gray-400" />
                              UID Bebas
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

      {/* Modal Tambah Mesin Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Tambah Mesin Absensi Baru</h3>
                  <p className="text-xs text-gray-500">Daftarkan alamat IP perangkat ZKTeco baru</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nama / Lokasi Mesin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lokasi 2 (Pintu Belakang) / Lt. 2"
                  value={newDeviceForm.name}
                  onChange={(e) => setNewDeviceForm({ ...newDeviceForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Alamat IP Mesin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.87.xxx"
                    value={newDeviceForm.ip}
                    onChange={(e) => setNewDeviceForm({ ...newDeviceForm, ip: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Port
                  </label>
                  <input
                    type="number"
                    placeholder="4370"
                    value={newDeviceForm.port}
                    onChange={(e) => setNewDeviceForm({ ...newDeviceForm, port: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Pastikan komputer HRIS ini berada dalam satu jaringan LAN / WiFi dengan IP mesin yang dimasukkan agar status mesin berwarna hijau (ONLINE).
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan & Hubungkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembersihan Log Mesin Fisik */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden transform transition-all p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Confirmation</h3>
                  <p className="text-xs text-gray-500">Pembersihan Memori Mesin Absensi</p>
                </div>
              </div>
              <button
                onClick={() => !clearingLogs && setIsClearModalOpen(false)}
                disabled={clearingLogs}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-sm text-gray-600">
              <p>
                Apakah Anda yakin ingin mengosongkan seluruh rekaman log absensi di dalam memori perangkat fisik berikut?
              </p>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-gray-700 font-sans">
                  <span className="text-gray-500">Perangkat:</span>
                  <span className="font-semibold text-gray-900">{activeDevice.name}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="text-gray-500 font-sans">IP / Port:</span>
                  <span className="font-semibold text-blue-700">{activeDevice.ip}:{activeDevice.port}</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Perhatian Penting:</p>
                  <p>1. Pastikan Anda telah menyinkronkan data ke tabel Kehadiran HRIS.</p>
                  <p>2. Seluruh log transaksi di mesin fisik akan direset menjadi 0 dan tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={clearingLogs}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearMachineLogs}
                disabled={clearingLogs}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {clearingLogs ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayouts>
  );
}
