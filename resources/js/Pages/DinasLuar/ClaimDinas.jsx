import React, { useState } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import {
  FileSpreadsheet, Upload, Download, Search, Filter, CheckCircle, Clock,
  AlertCircle, FileText, DollarSign, Calendar, Eye, X, Check, ArrowUpRight,
  ArrowDownRight, User, MapPin, Info, Trash2, Plus, Paperclip, CheckCircle2, XCircle
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ClaimDinas({ klaimList = [] }) {
  const { auth = {} } = usePage().props;
  const user = auth.user || {};
  const isHrdOrAdmin = user.role === 'hrd' || user.role === 'admin';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Default filter bulan berjalan (contoh: "2026-11")
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState(currentYearMonth);
  const [detailModal, setDetailModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'Disetujui', catatan_hrd: '' });

  // Format Mata Uang
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      return cleanDate;
    } catch {
      return dateStr;
    }
  };

  // Filter List
  const filteredList = klaimList.filter(item => {
    const matchSearch =
      (item.nomor_klaim || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nama_lengkap || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.kegiatan || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nomor_surat_dinas || '').toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || item.status === filterStatus;

    // Filter berdasarkan bulan (menggunakan tanggal_pengajuan atau created_at)
    let matchMonth = true;
    if (filterMonth) {
      const itemDateStr = item.tanggal_pengajuan || item.created_at || '';
      matchMonth = itemDateStr.startsWith(filterMonth);
    }

    return matchSearch && matchStatus && matchMonth;
  });

  // Statistics
  const totalLaporan = klaimList.length;
  const totalRealisasi = klaimList.reduce((acc, curr) => acc + (parseFloat(curr.total_realisasi) || 0), 0);
  const totalSisaKurang = klaimList.reduce((acc, curr) => acc + (parseFloat(curr.sisa_kurang) || 0), 0);
  const pendingCount = klaimList.filter(item => item.status === 'Diajukan' || item.status === 'Diproses').length;
  const verifiedCount = klaimList.filter(item => item.status === 'Disetujui').length;

  const handleUpdateStatusSubmit = (e) => {
    e.preventDefault();
    if (!statusModal) return;

    router.put(route('dinas-luar.claim.update-status', statusModal.id), statusForm, {
      onSuccess: () => {
        toast.success('Status klaim dinas berhasil diperbarui!');
        setStatusModal(null);
        if (detailModal && detailModal.id === statusModal.id) {
          setDetailModal(prev => ({
            ...prev,
            status: statusForm.status,
            catatan_hrd: statusForm.catatan_hrd,
            diperiksa_oleh_nama: user.name,
            diperiksa_oleh_jabatan: user.jabatan || 'Head Of HRD'
          }));
        }
      },
      onError: () => {
        toast.error('Gagal memperbarui status!');
      }
    });
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pengajuan claim dinas ini?')) {
      router.delete(route('dinas-luar.claim.destroy', id), {
        onSuccess: () => {
          toast.success('Data klaim dinas berhasil dihapus!');
          if (detailModal && detailModal.id === id) setDetailModal(null);
        },
        onError: () => {
          toast.error('Gagal menghapus klaim dinas!');
        }
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Disetujui':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case 'Diproses':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Diproses
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Diajukan
          </span>
        );
    }
  };

  return (
    <LayoutTemplate>
      <Head title="Claim Dinas - Realisasi Biaya" />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
              <span>Dinas Luar</span> &bull; <span>FORMHR02/OFL/III/2022</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              Claim Dinas
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Pencatatan, verifikasi realisasi biaya perjalanan dinas, serta ekspor file Excel &amp; PDF resmi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={route('dinas-luar.claim.template')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Template Excel
            </a>

            <Link
              href={route('dinas-luar.claim.create')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Buat Pengajuan Claim
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari no klaim, nama, kegiatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Filter Bulan */}
            <div className="flex items-center gap-1.5 bg-slate-50/70 border border-gray-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-xs bg-transparent border-0 p-0 focus:ring-0 text-gray-700 font-medium cursor-pointer"
                title="Filter berdasarkan bulan"
              />
              {filterMonth && (
                <button
                  type="button"
                  onClick={() => setFilterMonth('')}
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200"
                  title="Hapus filter bulan"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                <option value="all">Semua Status</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Diproses">Diproses</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Data Klaim */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">No Klaim</th>
                  <th className="py-3.5 px-4">Pegawai</th>
                  <th className="py-3.5 px-4">Kegiatan Dinas</th>
                  <th className="py-3.5 px-4">Realisasi</th>
                  <th className="py-3.5 px-4">Sisa Kurang</th>
                  <th className="py-3.5 px-4">Bukti Nota</th>
                  <th className="py-3.5 px-4">Status &amp; Pemeriksa</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-400">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                      Belum ada data pengajuan Claim Dinas.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {item.nomor_klaim}
                        {item.nomor_surat_dinas && (
                          <span className="block text-[10px] text-gray-400 font-normal">
                            SPD: {item.nomor_surat_dinas}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.nama_lengkap}</div>
                        <div className="text-[11px] text-gray-400">{item.jabatan || item.divisi || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800 line-clamp-1">{item.kegiatan}</div>
                        <div className="text-[11px] text-gray-400">
                          {formatDate(item.periode_awal)} s/d {formatDate(item.periode_akhir)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-900">
                        {formatRupiah(item.total_realisasi)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-blue-700">
                        {formatRupiah(item.sisa_kurang)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.metode_nota === 'pdf' ? (
                          item.file_nota_pdf ? (
                            <a
                              href={`/storage/${item.file_nota_pdf}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                            >
                              <Paperclip className="w-3 h-3" /> Bukti PDF
                            </a>
                          ) : (
                            <span className="text-[11px] text-amber-600">PDF (Belum ada file)</span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            Nota Offline / Fisik
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>{getStatusBadge(item.status)}</div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          Diperiksa oleh: <strong className="text-gray-800">{item.diperiksa_oleh_nama || (item.status === 'Disetujui' ? 'Jupiter' : '-')}</strong>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailModal(item)}
                            title="Lihat Detail & Rincian"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <a
                            href={route('dinas-luar.claim.excel', item.id)}
                            title="Unduh Excel (Sesuai Template)"
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          </a>

                          {/* PDF Klaim hanya bisa dicetak jika status Diproses / Disetujui atau akun HRD/Admin */}
                          {(isHrdOrAdmin || ['Disetujui', 'Diproses'].includes(item.status)) ? (
                            <a
                              href={route('dinas-luar.claim.pdf', item.id)}
                              target="_blank"
                              rel="noreferrer"
                              title="Cetak Formulir PDF"
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4 text-rose-600" />
                            </a>
                          ) : (
                            <button
                              disabled
                              title="PDF formulir baru dapat dicetak setelah disetujui HRD"
                              className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            >
                              <FileText className="w-4 h-4 text-gray-300" />
                            </button>
                          )}

                          {isHrdOrAdmin && (
                            <button
                              onClick={() => {
                                setStatusModal(item);
                                setStatusForm({ status: item.status, catatan_hrd: item.catatan_hrd || '' });
                              }}
                              title="Verifikasi Status Klaim"
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {(isHrdOrAdmin || item.uid === user.id) && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Hapus Data Klaim"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Detail Klaim */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200 block">Rincian Realisasi Claim Dinas</span>
                <h3 className="text-lg font-bold">{detailModal.nomor_klaim}</h3>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="text-gray-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                <div>
                  <span className="text-[11px] text-gray-400 block">Pegawai:</span>
                  <strong className="text-gray-900">{detailModal.nama_lengkap}</strong>
                  <div className="text-[11px] text-gray-500">{detailModal.jabatan || detailModal.divisi}</div>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block">Status Verifikasi:</span>
                  <div className="mt-0.5">{getStatusBadge(detailModal.status)}</div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Diperiksa oleh: <strong className="text-gray-800">{detailModal.diperiksa_oleh_nama || (detailModal.status === 'Disetujui' ? 'Jupiter' : '-')}</strong>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-400 block">Kegiatan:</span>
                <p className="font-semibold text-gray-800">{detailModal.kegiatan}</p>
                <p className="text-xs text-gray-500">
                  Periode: {formatDate(detailModal.periode_awal)} s/d {formatDate(detailModal.periode_akhir)}
                </p>
              </div>

              {/* Tabel Rincian Biaya */}
              <div>
                <span className="text-xs font-bold text-gray-700 block mb-2">Tabel Rincian Pengeluaran:</span>
                <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50 text-gray-600 font-bold">
                    <tr>
                      <th className="p-2 border">Tanggal</th>
                      <th className="p-2 border">Rincian Biaya</th>
                      <th className="p-2 border text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailModal.items || []).map((it, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 border text-center">{formatDate(it.tanggal)}</td>
                        <td className="p-2 border">{it.rincian_biaya}</td>
                        <td className="p-2 border text-right font-medium">{formatRupiah(it.nominal)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan="2" className="p-2 border text-right">Total Realisasi Biaya:</td>
                      <td className="p-2 border text-right">{formatRupiah(detailModal.total_realisasi)}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan="2" className="p-2 border text-right">Cash Advance:</td>
                      <td className="p-2 border text-right">{formatRupiah(detailModal.cash_advance)}</td>
                    </tr>
                    <tr className="bg-blue-50 font-bold text-blue-900">
                      <td colSpan="2" className="p-2 border text-right">Total Sisa Kurang:</td>
                      <td className="p-2 border text-right text-sm">{formatRupiah(detailModal.sisa_kurang)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rekening & Bukti Nota */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <span className="text-[11px] text-gray-400 block">Transfer Penggantian:</span>
                  <p className="font-semibold text-gray-800">Bank {detailModal.nama_bank || '-'}</p>
                  <p className="text-xs text-gray-600">{detailModal.no_rekening} a/n {detailModal.nama_rekening}</p>
                </div>

                <div>
                  <span className="text-[11px] text-gray-400 block">Metode Bukti Nota:</span>
                  {detailModal.metode_nota === 'pdf' ? (
                    detailModal.file_nota_pdf ? (
                      <a
                        href={route('dinas-luar.claim.nota', detailModal.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-1 text-xs text-blue-700 font-bold hover:underline"
                      >
                        <Paperclip className="w-4 h-4" /> Unduh / Lihat Bukti PDF
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">PDF (Tidak ada berkas)</span>
                    )
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 block mt-1">
                      Diserahkan secara Fisik (Offline) ke HRD
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex items-center justify-end gap-2">
              <a
                href={route('dinas-luar.claim.excel', detailModal.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> Download Excel
              </a>
              {(isHrdOrAdmin || ['Disetujui', 'Diproses'].includes(detailModal.status)) ? (
                <a
                  href={route('dinas-luar.claim.pdf', detailModal.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <FileText className="w-4 h-4" /> Cetak PDF
                </a>
              ) : (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                  PDF dapat dicetak setelah disetujui HRD
                </span>
              )}
              <button
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Verifikasi Status (Khusus HRD/Admin) */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-blue-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Verifikasi Claim Dinas</h3>
                <p className="text-xs text-blue-200 mt-0.5">{statusModal.nomor_klaim} &bull; {statusModal.nama_lengkap}</p>
              </div>
              <button onClick={() => setStatusModal(null)} className="text-gray-300 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                  Pilih Status Persetujuan
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Diajukan">Diajukan (Belum Diproses)</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Disetujui">Disetujui (Diterima)</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  💡 Saat disetujui, nama Anda (<strong>{user.name}</strong>) akan otomatis tercatat sebagai <em>&quot;Diperiksa oleh&quot;</em> pada formulir Excel dan PDF.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                  Catatan HRD (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={statusForm.catatan_hrd}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, catatan_hrd: e.target.value }))}
                  placeholder="Masukkan catatan jika ada..."
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Simpan Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </LayoutTemplate>
  );
}
