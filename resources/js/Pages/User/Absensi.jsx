import { useState, useEffect } from "react";
import { Head, usePage } from '@inertiajs/react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Coffee, Home, Briefcase } from "lucide-react";
import LayoutTemplate from "@/Layouts/LayoutTemplate";
function Absensi() {
  const { auth } = usePage().props;
  const userId = auth?.user?.id;
  const userTMK = auth?.user?.tmk; // Ambil TMK dari user
  
  // Initialize dengan bulan dan tahun saat ini
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [absensiData, setAbsensiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    ontime: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    libur: 0
  });

  // Generate array tahun (5 tahun ke belakang sampai tahun ini)
  const years = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i);
  
  // Array bulan
  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  useEffect(() => {
    if (userId && selectedMonth && selectedYear) {
      fetchAbsensiData();
    }
  }, [selectedMonth, selectedYear, userId]);

  const fetchAbsensiData = async () => {
    setLoading(true);
    try {
      // Format tanggal: YYYY-MM-01 untuk query
      const queryDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      
      const response = await fetch(`/api/kehadiran/by-user?uid=${userId}&tanggal=${queryDate}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Filter data berdasarkan TMK - hanya tampilkan data setelah TMK
        let filteredData = data;
        if (userTMK) {
          const tmkDate = new Date(userTMK);
          filteredData = data.filter(item => {
            const itemDate = new Date(item.tanggal);
            return itemDate >= tmkDate;
          });
        }
        
        setAbsensiData(filteredData);
        calculateStats(filteredData);
      } else {
        console.error('Failed to fetch data');
        setAbsensiData([]);
      }
    } catch (error) {
      console.error('Error fetching absensi:', error);
      setAbsensiData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const newStats = {
      ontime: 0,
      terlambat: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      libur: 0
    };

    data.forEach(item => {
      const status = item.status?.toLowerCase();
      if (status === 'hadir' || status === 'on time') newStats.ontime++;
      else if (status === 'terlambat') newStats.terlambat++;
      else if (status === 'izin') newStats.izin++;
      else if (status === 'sakit') newStats.sakit++;
      else if (status === 'alpha') newStats.alpha++;
      else if (status === 'libur kerja') newStats.libur++;
    });

    setStats(newStats);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'hadir': { color: "bg-green-100 text-green-800", icon: CheckCircle, text: "On Time" },
      'on time': { color: "bg-green-100 text-green-800", icon: CheckCircle, text: "On Time" },
      'terlambat': { color: "bg-yellow-100 text-yellow-800", icon: Clock, text: "Terlambat" },
      'izin': { color: "bg-blue-100 text-blue-800", icon: Coffee, text: "Izin" },
      'sakit': { color: "bg-purple-100 text-purple-800", icon: Home, text: "Sakit" },
      'alpha': { color: "bg-red-100 text-red-800", icon: XCircle, text: "Alpha" },
      'libur kerja': { color: "bg-gray-100 text-gray-800", icon: Calendar, text: "Libur" },
      'n/a': { color: "bg-gray-100 text-gray-500", icon: XCircle, text: "N/A" }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig['n/a'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatTMK = (tmkDate) => {
    if (!tmkDate) return '-';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(tmkDate).toLocaleDateString('id-ID', options);
  };

  return (
    <LayoutTemplate>
      <Head title="Absensi Saya" />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Absensi Saya</h1>
                <p className="text-gray-600 mt-1">Riwayat kehadiran Anda</p>
                {userTMK && (
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="font-medium">TMK:</span> {formatTMK(userTMK)}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Bulan:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Tahun:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">On Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ontime}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Terlambat</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.terlambat}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Izin</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.izin}</p>
                </div>
                <Coffee className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sakit</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.sakit}</p>
                </div>
                <Home className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alpha</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.alpha}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Libur</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.libur}</p>
                </div>
                <Calendar className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Jam Kedatangan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Jam Pulang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-3 text-gray-600">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : absensiData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        Tidak ada data absensi untuk periode ini
                      </td>
                    </tr>
                  ) : (
                    absensiData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(item.tanggal)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {item.jam_kedatangan || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {item.jam_pulang || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {item.keterangan || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </LayoutTemplate>
  );
}

export default Absensi;