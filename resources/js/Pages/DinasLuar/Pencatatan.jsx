import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import { 
  FileSpreadsheet, Upload, Download, Search, Filter, CheckCircle, Clock, 
  AlertCircle, FileText, DollarSign, Calendar, Eye, X, Check, ArrowUpRight,
  ArrowDownRight, User, MapPin, Info, Trash2
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Pencatatan({ pencatatanList = [] }) {
  const { auth = {} } = usePage().props;
  const user = auth.user || {};

  const [list, setList] = useState(pencatatanList);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    no_sppd: 'DL/2026/02/001',
    nama_pegawai: user.name || 'Budi Santoso',
    divisi: user.divisi || 'IT Support',
    tujuan: 'PT Mitra Solusi Surabaya',
    estimasi_biaya: 4500000,
    realisasi_biaya: '',
    catatan: '',
    file_excel: null,
  });
  const [excelFileName, setExcelFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Statistics
  const totalLaporan = list.length;
  const totalRealisasi = list.reduce((acc, curr) => acc + (Number(curr.realisasi_biaya) || 0), 0);
  const pendingCount = list.filter(item => item.status_verifikasi === 'pending').length;
  const verifiedCount = list.filter(item => item.status_verifikasi === 'verified').length;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  const handleDownloadTemplate = () => {
    // Generate CSV template for Realisasi Biaya Dinas Luar
    const headers = ["No", "Tanggal", "Kategori_Biaya", "Keterangan_Pengeluaran", "Nominal_Rp", "No_Kwitansi_Bukti"];
    const sampleRows = [
      ["1", "2026-02-15", "Transportasi (Tiket Pesawat PP)", "Penerbangan JKT - SUB Garuda Indonesia", "2600000", "KW-001"],
      ["2", "2026-02-15", "Penginapan / Hotel", "Hotel Santika Premiere (2 Malam)", "1200000", "KW-002"],
      ["3", "2026-02-16", "Transport Lokal", "Taksi / Grab Bandara ke Lokasi Klien", "370000", "KW-003"],
      ["4", "2026-02-17", "Uang Harian & Makan", "Uang saku dinas 3 hari kerja", "450000", "KW-004"]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...sampleRows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_realisasi_biaya_dinas_luar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.info('Template Excel/CSV pelaporan realisasi berhasil diunduh!');
  };

  const handleFileChange = (file) => {
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      toast.error('Format file tidak didukung! Harap unggah file .xlsx, .xls, atau .csv');
      return;
    }

    setExcelFileName(file.name);
    setUploadForm(prev => ({ ...prev, file_excel: file }));
    // Auto populate sample realisasi if empty
    if (!uploadForm.realisasi_biaya) {
      setUploadForm(prev => ({ ...prev, realisasi_biaya: 4620000 }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();

    if (!uploadForm.file_excel) {
      toast.error('Harap pilih file Excel pelaporan biaya realisasi!');
      return;
    }

    const realisasiNominal = Number(uploadForm.realisasi_biaya) || 0;
    const estimasiNominal = Number(uploadForm.estimasi_biaya) || 0;
    const selisihNominal = realisasiNominal - estimasiNominal;

    const newRecord = {
      id: Date.now(),
      no_sppd: uploadForm.no_sppd,
      nama_pegawai: uploadForm.nama_pegawai,
      divisi: uploadForm.divisi,
      tujuan: uploadForm.tujuan,
      tanggal_dinas: '2026-02-15 s/d 2026-02-17',
      estimasi_biaya: estimasiNominal,
      realisasi_biaya: realisasiNominal,
      selisih: selisihNominal,
      status_verifikasi: 'pending',
      file_excel: excelFileName || 'realisasi_biaya.xlsx',
      tanggal_upload: new Date().toISOString().split('T')[0],
      rincian: [
        { kategori: 'Transportasi (Tiket/BBM)', nominal: Math.round(realisasiNominal * 0.55), bukti: 'bukti_transport.pdf' },
        { kategori: 'Penginapan / Hotel', nominal: Math.round(realisasiNominal * 0.28), bukti: 'invoice_hotel.pdf' },
        { kategori: 'Uang Saku & Konsumsi', nominal: Math.round(realisasiNominal * 0.17), bukti: 'kwitansi_konsumsi.pdf' },
      ],
    };

    setList([newRecord, ...list]);
    toast.success('File Excel pelaporan biaya realisasi berhasil diunggah!');
    setShowUploadModal(false);
    setUploadForm({
      no_sppd: 'DL/2026/02/001',
      nama_pegawai: user.name || 'Budi Santoso',
      divisi: user.divisi || 'IT Support',
      tujuan: 'PT Mitra Solusi Surabaya',
      estimasi_biaya: 4500000,
      realisasi_biaya: '',
      catatan: '',
      file_excel: null,
    });
    setExcelFileName('');
  };

  const filteredList = list.filter(item => {
    const matchSearch =
      item.no_sppd.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_pegawai.toLowerCase().includes(search.toLowerCase()) ||
      item.tujuan.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status_verifikasi === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <LayoutTemplate>
      <Head title="Pencatatan Dinas Luar & Realisasi Biaya" />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm">
                  Pelaporan & Realisasi Biaya
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Pencatatan Realisasi Dinas Luar</h1>
              <p className="text-teal-100 text-sm mt-1 max-w-xl">
                Unggah berkas Excel pelaporan biaya realisasi perjalanan dinas, cek selisih anggaran, dan verifikasi bukti pengeluaran.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-sm backdrop-blur-sm border border-white/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Format Excel</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-semibold text-sm shadow-md transition-all transform active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Excel Realisasi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Laporan Masuk</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalLaporan}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Realisasi</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">{formatRupiah(totalRealisasi)}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Menunggu Verifikasi</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Telah Diverifikasi</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{verifiedCount}</h3>
            </div>
          </div>
        </div>

        {/* Filter & Records Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari SPPD, nama pegawai, tujuan..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Semua Status Verifikasi</option>
                <option value="pending">Menunggu Verifikasi</option>
                <option value="verified">Diverifikasi (Disetujui)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">No. SPPD / Pegawai</th>
                  <th className="px-5 py-3.5">Tujuan & Jadwal</th>
                  <th className="px-5 py-3.5 text-right">Estimasi (Rp)</th>
                  <th className="px-5 py-3.5 text-right">Realisasi (Rp)</th>
                  <th className="px-5 py-3.5 text-right">Selisih</th>
                  <th className="px-5 py-3.5 text-center">Berkas Excel</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.length > 0 ? (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-teal-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{item.no_sppd}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {item.nama_pegawai} • <span className="text-teal-700 font-medium">{item.divisi}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{item.tujuan}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-gray-400" /> {item.tanggal_dinas}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-600">
                        {formatRupiah(item.estimasi_biaya)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">
                        {formatRupiah(item.realisasi_biaya)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {item.selisih > 0 ? (
                          <span className="inline-flex items-center text-red-600 text-xs">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +{formatRupiah(item.selisih)}
                          </span>
                        ) : item.selisih < 0 ? (
                          <span className="inline-flex items-center text-emerald-600 text-xs">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> {formatRupiah(item.selisih)}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Sesuai (Rp 0)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> {item.file_excel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {item.status_verifikasi === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3.5 h-3.5" /> Diverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5" /> Menunggu
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setDetailModal(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Rincian
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-5 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <FileSpreadsheet className="w-10 h-10 text-gray-300 mb-2" />
                        <p className="font-medium text-gray-600">Belum ada data pencatatan biaya realisasi</p>
                        <p className="text-xs text-gray-400 mt-1">Upload laporan biaya dinas dengan klik tombol "Upload Excel Realisasi".</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Excel Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Upload Excel Pelaporan Biaya Realisasi</h3>
                <p className="text-teal-100 text-xs mt-0.5">Unggah laporan pengeluaran aktual dari dinas luar</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <p>
                  Pastikan format file Excel sesuai dengan template standar (kolom: No, Tanggal, Kategori Biaya, Keterangan, Nominal, No Kwitansi).
                  Gunakan tombol <strong>"Unduh Format Excel"</strong> jika belum memiliki template.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih No. SPPD / Pengajuan Dinas <span className="text-red-500">*</span></label>
                <select
                  value={uploadForm.no_sppd}
                  onChange={(e) => setUploadForm({ ...uploadForm, no_sppd: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="DL/2026/02/001">DL/2026/02/001 - PT Mitra Solusi Surabaya (Budi Santoso)</option>
                  <option value="DL/2026/02/002">DL/2026/02/002 - Kantor Cabang Bandung (Siti Rahma)</option>
                  <option value="DL/2026/01/014">DL/2026/01/014 - Jakarta Convention Center (Ahmad Fauzi)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estimasi Anggaran Awal</label>
                  <input
                    type="text"
                    disabled
                    value={formatRupiah(uploadForm.estimasi_biaya)}
                    className="w-full text-sm bg-gray-100 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Realisasi Aktual (Rp) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={uploadForm.realisasi_biaya}
                    onChange={(e) => setUploadForm({ ...uploadForm, realisasi_biaya: e.target.value })}
                    placeholder="Contoh: 4620000"
                    className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">File Excel (.xlsx, .xls, .csv) <span className="text-red-500">*</span></label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive 
                      ? 'border-teal-500 bg-teal-50/50' 
                      : 'border-gray-300 hover:border-teal-400 bg-gray-50/50'
                  }`}
                >
                  <FileSpreadsheet className="w-12 h-12 text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-800">Tarik & letakkan file Excel di sini</p>
                  <p className="text-xs text-gray-500 mt-1">Atau klik tombol di bawah untuk memilih file</p>
                  <input
                    type="file"
                    id="excel-file-input"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    className="hidden"
                  />
                  <label
                    htmlFor="excel-file-input"
                    className="inline-block mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm transition-all"
                  >
                    Pilih File Excel
                  </label>
                  {excelFileName && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                      <span className="font-medium truncate max-w-xs">{excelFileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setExcelFileName('');
                          setUploadForm(prev => ({ ...prev, file_excel: null }));
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows="2"
                  value={uploadForm.catatan}
                  onChange={(e) => setUploadForm({ ...uploadForm, catatan: e.target.value })}
                  placeholder="Keterangan mengenai selisih biaya atau catatan penting lainnya..."
                  className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-teal-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md transition-all"
                >
                  Simpan & Unggah Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Rincian Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-teal-700 text-white">
              <div>
                <h3 className="font-bold text-lg">Rincian Realisasi Biaya Dinas</h3>
                <p className="text-xs text-teal-100 mt-0.5">{detailModal.no_sppd} • {detailModal.nama_pegawai}</p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <div>
                  <span className="text-xs text-gray-500 block">Estimasi</span>
                  <span className="font-bold text-gray-800">{formatRupiah(detailModal.estimasi_biaya)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Realisasi</span>
                  <span className="font-bold text-teal-700">{formatRupiah(detailModal.realisasi_biaya)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Selisih</span>
                  <span className={`font-bold ${detailModal.selisih > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {detailModal.selisih > 0 ? `+${formatRupiah(detailModal.selisih)}` : formatRupiah(detailModal.selisih)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Item Pengeluaran (Dari Excel)</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
                      <tr>
                        <th className="px-3.5 py-2.5">Kategori</th>
                        <th className="px-3.5 py-2.5 text-right">Nominal</th>
                        <th className="px-3.5 py-2.5 text-center">Bukti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detailModal.rincian?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3.5 py-2.5 font-medium text-gray-800">{item.kategori}</td>
                          <td className="px-3.5 py-2.5 text-right font-semibold text-gray-900">{formatRupiah(item.nominal)}</td>
                          <td className="px-3.5 py-2.5 text-center">
                            <span className="text-teal-600 hover:underline cursor-pointer font-medium">Lihat</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <span className="text-emerald-800 font-medium">File Excel Pelaporan:</span>
                <span className="font-bold text-emerald-900">{detailModal.file_excel}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">Tanggal Upload: {detailModal.tanggal_upload}</span>
              <button
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutTemplate>
  );
}

