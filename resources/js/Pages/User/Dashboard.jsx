import { useState, useEffect } from 'react';
import DashboardLayouts from "@/Layouts/DasboardLayout";
import { Calendar, Clock, Users, FileText, TrendingUp, AlertCircle } from 'lucide-react';

function Dashboard({ auth, jatahCuti, kehadiranBulanIni, statistik }) {
  // Sample data - akan diganti dengan props dari backend
  const [stats, setStats] = useState({
    totalCuti: jatahCuti?.jumlah_cuti || 12,
    cutiTerpakai: jatahCuti?.cuti_dipakai || 0,
    sisaCuti: jatahCuti?.sisa_cuti || 12,
    kehadiranBulanIni: statistik?.hadir || 0,
    izinBulanIni: statistik?.izin || 0,
    sakitBulanIni: statistik?.sakit || 0,
    alpaBulanIni: statistik?.alpa || 0
  });

  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Hitung persentase cuti
  const cutiPercentage = stats.totalCuti > 0 
    ? ((stats.cutiTerpakai / stats.totalCuti) * 100).toFixed(1)
    : 0;

  // Hitung total hari kerja bulan ini (asumsi 22 hari kerja)
  const totalHariKerja = 22;
  const kehadiranPercentage = totalHariKerja > 0
    ? ((stats.kehadiranBulanIni / totalHariKerja) * 100).toFixed(1)
    : 0;

  return (
    <DashboardLayouts>
      <div className="p-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Sisa Cuti Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Sisa Cuti</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.sisaCuti}</p>
                <p className="text-xs text-gray-500 mt-1">dari {stats.totalCuti} hari</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Terpakai</span>
                <span className="text-gray-600">{cutiPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${cutiPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Kehadiran Bulan Ini */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Kehadiran</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.kehadiranBulanIni}</p>
                <p className="text-xs text-gray-500 mt-1">hari bulan ini</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Persentase</span>
                <span className="text-gray-600">{kehadiranPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${kehadiranPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Izin Bulan Ini */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Izin</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.izinBulanIni}</p>
                <p className="text-xs text-gray-500 mt-1">hari bulan ini</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Termasuk sakit: {stats.sakitBulanIni} hari</span>
            </div>
          </div>

          {/* Alpa Bulan Ini */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Alpa</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.alpaBulanIni}</p>
                <p className="text-xs text-gray-500 mt-1">hari bulan ini</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            {stats.alpaBulanIni > 0 && (
              <div className="mt-4 flex items-center text-xs text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span>Perlu perhatian</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ringkasan Kehadiran */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Ringkasan Kehadiran - {monthName}
            </h2>
            
            <div className="space-y-4">
              {/* Hadir */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-700">Hadir</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.kehadiranBulanIni}</span>
              </div>

              {/* Izin */}
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-700">Izin</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{stats.izinBulanIni}</span>
              </div>

              {/* Sakit */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-700">Sakit</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">{stats.sakitBulanIni}</span>
              </div>

              {/* Alpa */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-700">Alpa</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.alpaBulanIni}</span>
              </div>
            </div>
          </div>

          {/* Info Cuti */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Cuti</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Jatah Cuti Tahun Ini</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalCuti}</p>
                <p className="text-xs text-gray-500 mt-1">hari</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Cuti Terpakai</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.cutiTerpakai}</p>
                <p className="text-xs text-gray-500 mt-1">hari</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Sisa Cuti</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.sisaCuti}</p>
                <p className="text-xs text-gray-500 mt-1">hari</p>
              </div>

              {jatahCuti?.pinjam_tahun_prev > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium">
                    Pinjam dari tahun sebelumnya: {jatahCuti.pinjam_tahun_prev} hari
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 rounded-lg p-4 text-left">
              <Calendar className="w-6 h-6 mb-2" />
              <p className="font-medium">Ajukan Cuti</p>
              <p className="text-sm opacity-90">Buat pengajuan cuti baru</p>
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 rounded-lg p-4 text-left">
              <Clock className="w-6 h-6 mb-2" />
              <p className="font-medium">Riwayat Kehadiran</p>
              <p className="text-sm opacity-90">Lihat detail kehadiran</p>
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 rounded-lg p-4 text-left">
              <FileText className="w-6 h-6 mb-2" />
              <p className="font-medium">Laporan</p>
              <p className="text-sm opacity-90">Download laporan</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayouts>
  );
}

export default Dashboard;