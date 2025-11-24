import { useState } from 'react';
import DashboardLayouts from "@/Layouts/DasboardLayout";
import { Calendar, Clock, Users, FileText, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Head } from '@inertiajs/react';

function Dashboard({ auth, jatahCuti, statistik, pengajuanMenunggu, bulanTahun }) {
  // Update bagian stats di useState
const [stats] = useState({
  totalCuti: jatahCuti?.jumlah_cuti || 0,
  cutiTerpakai: jatahCuti?.cuti_dipakai || 0,
  sisaCuti: jatahCuti?.sisa_cuti || 0,
  kehadiranBulanIni: statistik?.total_hadir || 0,
  hadirTepatWaktu: statistik?.hadir || 0,
  terlambat: statistik?.terlambat || 0,
  izinBulanIni: statistik?.total_izin || 0,
  sakitBulanIni: statistik?.sakit || 0,
  cutiFullBulanIni: statistik?.cuti_full || 0,
  cutiHalfBulanIni: statistik?.cuti_half || 0,
  dinasLuar: statistik?.dinas_luar || 0,
  wfh: statistik?.wfh || 0,
  persentaseHadir: statistik?.persentase_hadir || 0,
});

// Ganti perhitungan kehadiranPercentage

  // Hitung persentase cuti
  const cutiPercentage = stats.totalCuti > 0 
    ? ((stats.cutiTerpakai / stats.totalCuti) * 100).toFixed(1)
    : 0;

  // Hitung total hari kerja bulan ini (asumsi 22 hari kerja)
  const totalHariKerja = 22;
  const kehadiranPercentage = stats.persentaseHadir;

  return (
    <DashboardLayouts>
      <Head title="Dashboard" />

      <div className="">
        

        {/* Pengajuan Menunggu Approval */}
        {(pengajuanMenunggu?.cuti > 0 || pengajuanMenunggu?.izin > 0 || pengajuanMenunggu?.sakit > 0) && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Pengajuan Menunggu Persetujuan</h3>
                <div className="mt-2 text-sm text-yellow-700 space-x-4">
                  {pengajuanMenunggu.cuti > 0 && <span>Cuti: {pengajuanMenunggu.cuti}</span>}
                  {pengajuanMenunggu.izin > 0 && <span>Izin: {pengajuanMenunggu.izin}</span>}
                  {pengajuanMenunggu.sakit > 0 && <span>Sakit: {pengajuanMenunggu.sakit}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Kehadiran Bulan Ini */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Kehadiran</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.kehadiranBulanIni}</p>
                <p className="text-xs text-gray-500 mt-1">hari bulan ini</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-500" />
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

        
          {/* Izin Bulan Ini */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Izin & Sakit</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.izinBulanIni}</p>
                <p className="text-xs text-gray-500 mt-1">hari bulan ini</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Sakit: {stats.sakitBulanIni} hari</span>
            </div>
          </div>

          {/* Alpa Bulan Ini */}
         
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ringkasan Kehadiran */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Ringkasan Kehadiran - {bulanTahun}
            </h2>
            
            <div className="space-y-3">
              {/* Hadir Tepat Waktu */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-700">Hadir Tepat Waktu</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.kehadiranBulanIni - stats.terlambat}</span>
              </div>

              {/* Terlambat */}
              {stats.terlambat > 0 && (
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-700">Terlambat</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{stats.terlambat}</span>
                </div>
              )}

              {/* Cuti */}
              {(stats.cutiFullBulanIni > 0 || stats.cutiHalfBulanIni > 0) && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-700">Cuti</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-emerald-600">{stats.cutiFullBulanIni + stats.cutiHalfBulanIni}</span>
                    <p className="text-xs text-gray-500">Full: {stats.cutiFullBulanIni} | Half: {stats.cutiHalfBulanIni}</p>
                  </div>
                </div>
              )}

              {/* Sakit */}
              {stats.sakitBulanIni > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-700">Sakit</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.sakitBulanIni}</span>
                </div>
              )}

              {/* Izin */}
              {(stats.izinBulanIni - stats.sakitBulanIni) > 0 && (
                <div className="flex items-center justify-between p-4 bg-sky-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-sky-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-700">Izin</span>
                  </div>
                  <span className="text-2xl font-bold text-sky-600">{stats.izinBulanIni - stats.sakitBulanIni}</span>
                </div>
              )}

              {/* Dinas Luar */}
              {stats.dinasLuar > 0 && (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-700">Dinas Luar</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{stats.dinasLuar}</span>
                </div>
              )}

              {/* WFH */}
              {stats.wfh > 0 && (
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-700">Work From Home</span>
                  </div>
                  <span className="text-2xl font-bold text-amber-600">{stats.wfh}</span>
                </div>
              )}

            
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
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-orange-600 mr-2 mt-0.5" />
                    <p className="text-xs text-orange-700 font-medium">
                      Pinjam dari tahun sebelumnya: {jatahCuti.pinjam_tahun_prev} hari
                    </p>
                  </div>
                </div>
              )}

              {jatahCuti?.keterangan && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Keterangan:</span> {jatahCuti.keterangan}
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
              <p className="font-medium">Ajukan Izin</p>
              <p className="text-sm opacity-90">Buat pengajuan izin</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayouts>
  );
}

export default Dashboard;