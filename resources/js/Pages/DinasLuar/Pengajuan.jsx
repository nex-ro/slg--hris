import React, { useState, useMemo } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import {
  Plus, CheckCircle, XCircle, Search,
  FileText, Eye, X, Building2, CreditCard, Printer, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  UserCheck, AlertTriangle
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Pengajuan({ pengajuanList = [] }) {
  const { auth = {} } = usePage().props;
  const currentUser = auth.user || {};
  const isHrdOrAdmin = currentUser.role === 'hrd' || currentUser.role === 'admin';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State Sortir Kolom (Default berdasarkan Nomor Surat secara menurun / terbaru)
  const [sortField, setSortField] = useState('nomor_surat');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' atau 'desc'

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10, 25, 50, 100

  const [detailModal, setDetailModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'Disetujui', nomor_surat: '', catatan: '' });
  const [statusError, setStatusError] = useState('');

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

    if (statusForm.status === 'Ditolak' && !statusForm.catatan.trim()) {
      setStatusError('Catatan alasan penolakan wajib diisi jika status Ditolak.');
      return;
    }
    setStatusError('');

    router.put(route('dinas-luar.update-status', statusModal.id), statusForm, {
      onSuccess: () => {
        toast.success(`Pengajuan SPD berhasil ${statusForm.status === 'Disetujui' ? 'disetujui' : statusForm.status === 'Ditolak' ? 'ditolak' : 'diperbarui'}!`);
        setStatusModal(null);
        if (detailModal && detailModal.id === statusModal.id) {
          setDetailModal(prev => ({
            ...prev,
            status: statusForm.status,
            catatan: statusForm.catatan,
            nomor_surat: statusForm.nomor_surat || prev.nomor_surat,
            disetujui_oleh_nama: currentUser.name || prev.disetujui_oleh_nama,
            disetujui_oleh_jabatan: currentUser.jabatan || 'Head Of IAD & HRD',
            disetujui_pada: new Date().toISOString()
          }));
        }
      },
      onError: (err) => {
        const msg = err?.catatan || err?.error || 'Gagal memperbarui status!';
        setStatusError(msg);
        toast.error(msg);
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

  const filteredList = useMemo(() => {
    return pengajuanList.filter(item => {
      const matchSearch =
        (item.tujuan || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.nama_lengkap || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.nomor_surat || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.keperluan || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [pengajuanList, search, filterStatus]);

  // Fungsi Toggle Sortir
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset ke halaman 1 saat ubah sortir
  };

  // List yang sudah disortir
  const sortedList = useMemo(() => {
    const list = [...filteredList];
    if (!sortField) return list;

    return list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Penanganan nilai null/undefined
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Sortir numerik untuk panjar_nominal
      if (sortField === 'panjar_nominal') {
        const aNum = parseFloat(String(aVal).replace(/[^0-9.-]+/g, '')) || 0;
        const bNum = parseFloat(String(bVal).replace(/[^0-9.-]+/g, '')) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Sortir tanggal
      if (sortField === 'tanggal_berangkat' || sortField === 'created_at') {
        const aTime = new Date(aVal).getTime() || 0;
        const bTime = new Date(bVal).getTime() || 0;
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }

      // Sortir string umum
      const comparison = String(aVal).localeCompare(String(bVal), 'id', { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredList, sortField, sortDirection]);

  // Pagination logic
  const totalItems = sortedList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedList = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedList.slice(startIndex, startIndex + pageSize);
  }, [sortedList, safeCurrentPage, pageSize]);

  // Helper Ikon Sortir di Header Tabel
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-60 inline-block ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline-block ml-1" />
    );
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
                <tr className="bg-gray-50/80 text-gray-600 border-b border-gray-200 uppercase text-[11px] tracking-wider font-semibold select-none">
                  <th 
                    onClick={() => handleSort('nomor_surat')} 
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>No. Surat</span>
                      {renderSortIcon('nomor_surat')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('nama_lengkap')} 
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Pegawai</span>
                      {renderSortIcon('nama_lengkap')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('tujuan')} 
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Tujuan</span>
                      {renderSortIcon('tujuan')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('tanggal_berangkat')} 
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Tgl Berangkat - Kembali</span>
                      {renderSortIcon('tanggal_berangkat')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('transportasi')} 
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Transportasi</span>
                      {renderSortIcon('transportasi')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('panjar_nominal')} 
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Cash Advance</span>
                      {renderSortIcon('panjar_nominal')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')} 
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                      Belum ada data pengajuan surat perjalanan dinas.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        {item.nomor_surat && item.nomor_surat !== 'Menunggu Penetapan HRD' ? (
                          <span className="text-blue-900">{item.nomor_surat}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Menunggu HRD
                          </span>
                        )}
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

                          {/* Cetak PDF hanya jika disetujui / diproses, atau user HRD/Admin */}
                          {(isHrdOrAdmin || ['Disetujui', 'Diproses'].includes(item.status)) ? (
                            <a
                              href={route('dinas-luar.pdf', item.id)}
                              target="_blank"
                              rel="noreferrer"
                              title="Cetak PDF Formulir SPD"
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </a>
                          ) : (
                            <button
                              disabled
                              title="PDF baru dapat dicetak setelah disetujui HRD"
                              className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {isHrdOrAdmin && (
                            <button
                              onClick={() => {
                                setStatusModal(item);
                                setStatusForm({
                                  status: item.status === 'Diajukan' ? 'Disetujui' : item.status,
                                  nomor_surat: item.nomor_surat || '',
                                  catatan: item.catatan || ''
                                });
                                setStatusError('');
                              }}
                              title="Pemeriksaan & Persetujuan HRD"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approval</span>
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

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>Menampilkan</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>dari <strong>{totalItems}</strong> data (Halaman {safeCurrentPage} dari {totalPages})</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  title="Halaman Pertama"
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  title="Halaman Sebelumnya"
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Nomor-nomor halaman terdekat */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg transition-colors ${
                            safeCurrentPage === page
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  title="Halaman Selanjutnya"
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Halaman Terakhir"
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
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

              {detailModal.disetujui_oleh_nama && (
                <div className="p-3 bg-blue-50/70 rounded-xl text-xs text-blue-900 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-600 font-semibold block uppercase">Diperiksa / Disetujui Oleh:</span>
                    <span className="font-bold text-gray-900">{detailModal.disetujui_oleh_nama}</span>
                    <span className="text-[11px] text-gray-600 block">{detailModal.disetujui_oleh_jabatan || 'Head Of IAD & HRD'}</span>
                  </div>
                  {detailModal.disetujui_pada && (
                    <div className="text-right">
                      <span className="text-[10px] text-blue-600 font-semibold block uppercase">Tanggal Approval:</span>
                      <span className="font-medium text-gray-700">{formatDate(detailModal.disetujui_pada)}</span>
                    </div>
                  )}
                </div>
              )}

              {detailModal.catatan && (
                <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
                  <span className="font-bold block mb-0.5">Catatan Persetujuan:</span>
                  {detailModal.catatan}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              {(isHrdOrAdmin || ['Disetujui', 'Diproses'].includes(detailModal.status)) ? (
                <a
                  href={route('dinas-luar.pdf', detailModal.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak PDF
                </a>
              ) : (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                  PDF baru dapat dicetak setelah disetujui / diproses HRD
                </span>
              )}
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

      {/* MODAL HRD VERIFIKASI / APPROVAL */}
      {statusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-blue-200 tracking-wider">Verifikasi & Approval HRD</span>
                <h3 className="font-bold text-base mt-0.5">Persetujuan Surat Perjalanan Dinas</h3>
                <p className="text-xs text-blue-200/80 mt-0.5">{statusModal.nama_lengkap} — {statusModal.nomor_surat}</p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              {statusError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{statusError}</span>
                </div>
              )}

              {/* Pilihan Keputusan Approval */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Keputusan HRD / Approval</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStatusForm(prev => ({ ...prev, status: 'Disetujui' }))}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-semibold text-xs transition-all ${
                      statusForm.status === 'Disetujui'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <CheckCircle className={`w-5 h-5 ${statusForm.status === 'Disetujui' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span>Setujui</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusForm(prev => ({ ...prev, status: 'Diproses' }))}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-semibold text-xs transition-all ${
                      statusForm.status === 'Diproses'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <FileText className={`w-5 h-5 ${statusForm.status === 'Diproses' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>Diproses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusForm(prev => ({ ...prev, status: 'Ditolak' }))}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-semibold text-xs transition-all ${
                      statusForm.status === 'Ditolak'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <XCircle className={`w-5 h-5 ${statusForm.status === 'Ditolak' ? 'text-rose-600' : 'text-gray-400'}`} />
                    <span>Tolak</span>
                  </button>
                </div>
              </div>

              {/* Koreksi Nomor Surat Resmi */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Nomor Surat Dinas Resmi
                </label>
                <input
                  type="text"
                  value={statusForm.nomor_surat}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, nomor_surat: e.target.value }))}
                  placeholder="Contoh: 001/SPD-HRD/HO/XI/2026"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">HRD dapat memperbarui nomor surat resmi sebelum dokumen dicetak pemohon.</p>
              </div>

              {/* Catatan / Alasan */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Catatan HRD {statusForm.status === 'Ditolak' ? <span className="text-rose-600">* (Wajib diisi jika ditolak)</span> : <span className="text-gray-400 font-normal">(Opsional)</span>}
                </label>
                <textarea
                  rows="3"
                  value={statusForm.catatan}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, catatan: e.target.value }))}
                  placeholder={statusForm.status === 'Ditolak' ? 'Tuliskan alasan penolakan agar pemohon mengetahuinya...' : 'Catatan persetujuan atau arahan khusus untuk penugasan ini...'}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Info Approval By */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Pemeriksa: <strong>{currentUser.name || 'HRD Admin'}</strong>
                </span>
                <span className="text-[11px] text-gray-500">Jabatan: {currentUser.jabatan || 'Head Of IAD & HRD'}</span>
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
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all ${
                    statusForm.status === 'Ditolak'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : statusForm.status === 'Disetujui'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Konfirmasi {statusForm.status}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </LayoutTemplate>
  );
}
