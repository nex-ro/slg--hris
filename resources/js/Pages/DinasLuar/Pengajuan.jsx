import React, { useState } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import {
  Plus, CheckCircle, XCircle, Search,
  FileText, Eye, X, Building2, CreditCard, Printer, Trash2
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Pengajuan({ pengajuanList = [] }) {
  const { auth = {} } = usePage().props;
  const currentUser = auth.user || {};
  const isHrdOrAdmin = currentUser.role === 'hrd' || currentUser.role === 'admin';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailModal, setDetailModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'Disetujui', catatan: '' });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      // Ambil bagian tanggal jika ada format ISO timestamp (misal: 2026-11-20T00:00:00.000000Z)
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('id-ID', {
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

  const handleUpdateStatusSubmit = (e) => {
    e.preventDefault();
    if (!statusModal) return;

    router.put(route('dinas-luar.update-status', statusModal.id), statusForm, {
      onSuccess: () => {
        toast.success('Status pengajuan surat dinas berhasil diperbarui!');
        setStatusModal(null);
        if (detailModal && detailModal.id === statusModal.id) {
          setDetailModal(prev => ({ ...prev, status: statusForm.status, catatan: statusForm.catatan }));
        }
      },
      onError: () => {
        toast.error('Gagal memperbarui status!');
      }
    });
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengajuan surat dinas ini?')) {
      router.delete(route('dinas-luar.destroy', id), {
        onSuccess: () => {
          toast.success('Pengajuan berhasil dihapus!');
          if (detailModal && detailModal.id === id) setDetailModal(null);
        },
        onError: () => {
          toast.error('Gagal menghapus pengajuan!');
        }
      });
    }
  };

  const filteredList = pengajuanList.filter(item => {
    const matchSearch =
      (item.tujuan || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nama_lengkap || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nomor_surat || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.keperluan || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
      <Head title="Pengajuan Surat Perjalanan Dinas" />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

        {/* Banner Informasi */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-800/80 rounded-full text-xs font-semibold tracking-wider uppercase border border-blue-400/30">
              <Building2 className="w-3.5 h-3.5" /> Form Khusus Karyawan HO Sawit Lestari Group
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              PENGAJUAN SURAT PERJALANAN DINAS 2025
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Form ini khusus digunakan oleh karyawan HO Sawit Lestari Group untuk keperluan pengajuan Surat Perjalanan Dinas (SPD).
            </p>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-xs text-blue-50 space-y-1.5 mt-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-300">•</span>
                <span>Pengajuan surat perjalanan dinas <strong>selambat-lambatnya diajukan 3 (tiga) hari</strong> sebelum tanggal perjalanan dinas.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-300">•</span>
                <span>
                  Karyawan yang hendak mengajukan dinas, segera menghubungi HRD atau melalui WhatsApp{' '}
                  <strong className="text-white bg-blue-950/60 px-2 py-0.5 rounded border border-blue-400/40">
                    0858-9185-1186
                  </strong>{' '}
                  untuk mendapatkan <strong>Nomor Surat</strong> sebelum formulir ini diajukan.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan nomor surat, nama, tujuan, keperluan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full text-xs sm:text-sm py-2.5 px-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Semua Status</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Diproses">Diproses</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          <Link
            href={route('dinas-luar.create')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Buat Pengajuan SPD
          </Link>
        </div>

        {/* Tabel Riwayat Pengajuan */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Riwayat Pengajuan Surat Perjalanan Dinas</h2>
              <p className="text-xs text-gray-500 mt-0.5">Daftar dokumen perjalanan dinas yang telah didaftarkan</p>
            </div>
            <span className="text-xs text-gray-500 font-semibold bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              Total: {filteredList.length} Pengajuan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-600 border-b border-gray-200 uppercase text-[11px] tracking-wider font-semibold">
                  <th className="py-3.5 px-4">No. Surat</th>
                  <th className="py-3.5 px-4">Pegawai</th>
                  <th className="py-3.5 px-4">Tujuan</th>
                  <th className="py-3.5 px-4">Tgl Berangkat - Kembali</th>
                  <th className="py-3.5 px-4">Transportasi</th>
                  <th className="py-3.5 px-4">Cash Advance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                      Belum ada data pengajuan surat perjalanan dinas.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {item.nomor_surat}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.nama_lengkap}</div>
                        <div className="text-[11px] text-gray-500">{item.jabatan || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {item.tujuan}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <div className="font-medium text-gray-800">{formatDate(item.tanggal_berangkat)}</div>
                        <div className="text-gray-400 text-[11px]">
                          s/d {item.tanggal_kembali ? formatDate(item.tanggal_kembali) : (item.keterangan_kembali || 'Selesai')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                          {item.transportasi}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.ajukan_advance ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Rp {item.panjar_nominal}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailModal(item)}
                            title="Lihat Detail"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <a
                            href={route('dinas-luar.pdf', item.id)}
                            target="_blank"
                            rel="noreferrer"
                            title="Cetak PDF Formulir SPD"
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </a>

                          {isHrdOrAdmin && (
                            <button
                              onClick={() => {
                                setStatusModal(item);
                                setStatusForm({ status: item.status, catatan: item.catatan || '' });
                              }}
                              title="Ubah Status (HRD)"
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {(isHrdOrAdmin || item.uid === currentUser.id) && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Hapus Pengajuan"
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

      {/* DETAIL MODAL */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-gray-400">Rincian Dokumen</span>
                <h3 className="font-bold text-base sm:text-lg">{detailModal.nomor_surat}</h3>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-500">Status Otorisasi</span>
                <div>{getStatusBadge(detailModal.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-gray-500 block">Nama Pegawai</span>
                  <span className="font-semibold text-gray-900">{detailModal.nama_lengkap}</span>
                  <div className="text-[11px] text-gray-500">{detailModal.email}</div>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Jabatan</span>
                  <span className="font-semibold text-gray-900">{detailModal.jabatan || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-gray-500 block">Pemberi Tugas (Atasan)</span>
                  <span className="font-semibold text-gray-900">{detailModal.pemberi_tugas || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Moda Transportasi</span>
                  <span className="font-semibold text-gray-900">{detailModal.transportasi}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-gray-500 block">Tujuan</span>
                  <span className="font-semibold text-blue-900">{detailModal.tujuan}</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Waktu Penugasan</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(detailModal.tanggal_berangkat)} s/d {detailModal.tanggal_kembali ? formatDate(detailModal.tanggal_kembali) : (detailModal.keterangan_kembali || 'Selesai')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 block">Keperluan / Maksud Tugas</span>
                <p className="mt-1 p-3 bg-gray-50 rounded-xl text-gray-700 text-xs border border-gray-200/80 leading-relaxed">
                  {detailModal.keperluan}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" /> Advance Perjalanan Dinas (Cash Advance)
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Nominal Panjar</span>
                    <span className="font-semibold text-gray-900">Rp {detailModal.panjar_nominal}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Terbilang</span>
                    <span className="italic text-gray-700">{detailModal.panjar_terbilang}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Bank & No Rekening</span>
                    <span className="font-semibold text-gray-900">{detailModal.nama_bank} - {detailModal.nomor_rekening}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Atas Nama Rekening</span>
                    <span className="font-semibold text-gray-900">{detailModal.nama_rekening}</span>
                  </div>
                </div>
              </div>

              {detailModal.catatan && (
                <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
                  <span className="font-bold block mb-0.5">Catatan Persetujuan:</span>
                  {detailModal.catatan}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <a
                href={route('dinas-luar.pdf', detailModal.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak PDF
              </a>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HRD UPDATE STATUS */}
      {statusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-indigo-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-indigo-300">Otorisasi HRD / Admin</span>
                <h3 className="font-bold text-base">Ubah Status Pengajuan SPD</h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="text-indigo-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Status Pengajuan</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Diajukan">Diajukan</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Catatan Persetujuan (Opsional)</label>
                <textarea
                  rows="3"
                  value={statusForm.catatan}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, catatan: e.target.value }))}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
                >
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </LayoutTemplate>
  );
}
