import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import { 
  Package, Plus, Search, Filter, Laptop, Monitor, Server, 
  Printer, CheckCircle2, AlertTriangle, Eye, ShieldCheck, 
  MapPin, DollarSign, Pencil, Trash2, X, RefreshCw
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function InventarisIndex({ inventarisList = [], flash = {} }) {
  const [items, setItems] = useState(inventarisList);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    kode_barang: '',
    nama_barang: '',
    kategori: 'Laptop / Komputer',
    lokasi: '',
    pengguna: '',
    kondisi: 'Baik',
    tanggal_perolehan: '',
    nilai_aset: '',
    status: 'Tersedia',
    serial_number: '',
    keterangan: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Sync data ketika props dari Inertia berubah
  useEffect(() => {
    setItems(inventarisList);
  }, [inventarisList]);

  // Flash messages
  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  // Statistik
  const stats = useMemo(() => {
    const total = items.length;
    const digunakan = items.filter(i => i.status === 'Digunakan').length;
    const tersedia = items.filter(i => i.status === 'Tersedia').length;
    const perbaikan = items.filter(i => i.status === 'Dalam Perbaikan').length;
    const totalNilai = items.reduce((acc, curr) => acc + (Number(curr.nilai_aset) || 0), 0);
    return { total, digunakan, tersedia, perbaikan, totalNilai };
  }, [items]);

  // Filter list
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = search.trim() === '' ||
        (item.nama_barang && item.nama_barang.toLowerCase().includes(search.toLowerCase())) ||
        (item.kode_barang && item.kode_barang.toLowerCase().includes(search.toLowerCase())) ||
        (item.pengguna && item.pengguna.toLowerCase().includes(search.toLowerCase())) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(search.toLowerCase()));

      const matchKategori = filterKategori === 'all' || item.kategori === filterKategori;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchSearch && matchKategori && matchStatus;
    });
  }, [items, search, filterKategori, filterStatus]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const getKategoriIcon = (kategori) => {
    switch (kategori) {
      case 'Laptop / Komputer': return <Laptop className="w-4 h-4 text-blue-600" />;
      case 'Perangkat IT / Aksesoris': return <Monitor className="w-4 h-4 text-indigo-600" />;
      case 'Jaringan / Server': return <Server className="w-4 h-4 text-purple-600" />;
      case 'Perangkat Kantor': return <Printer className="w-4 h-4 text-teal-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Digunakan':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><CheckCircle2 className="w-3 h-3" /> Digunakan</span>;
      case 'Tersedia':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3" /> Tersedia</span>;
      case 'Dalam Perbaikan':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3" /> Perbaikan</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialForm);
    setShowFormModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      kode_barang: item.kode_barang || '',
      nama_barang: item.nama_barang || '',
      kategori: item.kategori || 'Laptop / Komputer',
      lokasi: item.lokasi || '',
      pengguna: item.pengguna || '',
      kondisi: item.kondisi || 'Baik',
      tanggal_perolehan: item.tanggal_perolehan ? item.tanggal_perolehan.substring(0, 10) : '',
      nilai_aset: item.nilai_aset || '',
      status: item.status || 'Tersedia',
      serial_number: item.serial_number || '',
      keterangan: item.keterangan || '',
    });
    setShowFormModal(true);
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.kode_barang || !formData.nama_barang) {
      toast.error('Kode barang dan nama barang wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    if (isEditing) {
      router.put(`/inventaris/${editId}`, formData, {
        onSuccess: () => {
          setShowFormModal(false);
          setIsSubmitting(false);
        },
        onError: (errors) => {
          setIsSubmitting(false);
          const firstError = Object.values(errors)[0];
          toast.error(firstError || 'Gagal memperbarui aset.');
        }
      });
    } else {
      router.post('/inventaris', formData, {
        onSuccess: () => {
          setShowFormModal(false);
          setFormData(initialForm);
          setIsSubmitting(false);
        },
        onError: (errors) => {
          setIsSubmitting(false);
          const firstError = Object.values(errors)[0];
          toast.error(firstError || 'Gagal menambahkan aset.');
        }
      });
    }
  };

  const handleDelete = (item) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus aset "${item.nama_barang}" (${item.kode_barang})?`)) {
      router.delete(`/inventaris/${item.id}`, {
        onSuccess: () => {
          if (showDetailModal) setShowDetailModal(false);
        },
        onError: () => {
          toast.error('Gagal menghapus aset inventaris.');
        }
      });
    }
  };

  return (
    <LayoutTemplate>
      <Head title="Inventaris Aset - IT & Eksekutif" />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  Inventaris & Aset Kantor
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                    Akses Khusus Eksekutif & IT
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Pengelolaan aset perangkat, perlengkapan IT, status inventaris, dan penugasan karyawan
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Aset Baru
            </button>
          </div>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Aset</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total} <span className="text-sm font-normal text-gray-500">Unit</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sedang Digunakan</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.digunakan} <span className="text-sm font-normal text-gray-500">Unit</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tersedia di Gudang</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.tersedia} <span className="text-sm font-normal text-gray-500">Unit</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estimasi Nilai Total</p>
              <h3 className="text-lg font-bold text-gray-900 mt-1 truncate" title={formatRupiah(stats.totalNilai)}>
                {formatRupiah(stats.totalNilai)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama aset, serial number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="Laptop / Komputer">Laptop / Komputer</option>
                <option value="Perangkat IT / Aksesoris">Perangkat IT / Aksesoris</option>
                <option value="Jaringan / Server">Jaringan / Server</option>
                <option value="Perangkat Kantor">Perangkat Kantor</option>
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="Digunakan">Digunakan</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Dalam Perbaikan">Dalam Perbaikan</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Kode & Nama Aset</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Pengguna / Penanggung Jawab</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Nilai Aset</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      Tidak ada data inventaris. Klik tombol "Tambah Aset Baru" di atas untuk menambahkan data.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{item.nama_barang}</div>
                        <div className="text-xs font-mono text-indigo-600 mt-0.5">{item.kode_barang}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                          {getKategoriIcon(item.kategori)}
                          <span>{item.kategori}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                            {item.pengguna && item.pengguna !== '-' ? item.pengguna.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 text-xs">{item.pengguna || '-'}</div>
                            <div className="text-[11px] text-gray-400">Kondisi: {item.kondisi}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{item.lokasi || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-xs text-gray-900">
                        {formatRupiah(item.nilai_aset)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Aset"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Aset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Detail */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-snug">Rincian Aset</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedItem.kode_barang}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Nama Aset:</span>
                <span className="col-span-2 font-semibold text-gray-800">{selectedItem.nama_barang}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Kategori:</span>
                <span className="col-span-2 text-gray-800">{selectedItem.kategori}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Serial Number:</span>
                <span className="col-span-2 font-mono text-gray-800">{selectedItem.serial_number || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Pengguna:</span>
                <span className="col-span-2 text-gray-800">{selectedItem.pengguna || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Lokasi:</span>
                <span className="col-span-2 text-gray-800">{selectedItem.lokasi || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Kondisi:</span>
                <span className="col-span-2 text-gray-800">{selectedItem.kondisi}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="col-span-2">{getStatusBadge(selectedItem.status)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Nilai Aset:</span>
                <span className="col-span-2 font-semibold text-indigo-600">{formatRupiah(selectedItem.nilai_aset)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Tgl Perolehan:</span>
                <span className="col-span-2 text-gray-800">{selectedItem.tanggal_perolehan ? String(selectedItem.tanggal_perolehan).substring(0, 10) : '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Keterangan:</span>
                <span className="col-span-2 text-gray-600 text-xs">{selectedItem.keterangan || '-'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedItem)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Aset
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEdit(selectedItem);
                  }}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                {isEditing ? 'Edit Data Aset Inventaris' : 'Tambah Aset Inventaris Baru'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kode Barang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kode_barang}
                    onChange={(e) => setFormData({ ...formData, kode_barang: e.target.value })}
                    placeholder="Contoh: INV-IT-2026-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Laptop / Komputer">Laptop / Komputer</option>
                    <option value="Perangkat IT / Aksesoris">Perangkat IT / Aksesoris</option>
                    <option value="Jaringan / Server">Jaringan / Server</option>
                    <option value="Perangkat Kantor">Perangkat Kantor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Barang / Tipe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_barang}
                  onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                  placeholder="Contoh: MacBook Pro M3 Pro 16 Inch"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Serial Number / SN
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="Contoh: C02G1234MD6R"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Lokasi Penempatan
                  </label>
                  <input
                    type="text"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    placeholder="Contoh: Head Office - Lantai 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pengguna / PIC
                  </label>
                  <input
                    type="text"
                    value={formData.pengguna}
                    onChange={(e) => setFormData({ ...formData, pengguna: e.target.value })}
                    placeholder="Nama Karyawan / -"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kondisi
                  </label>
                  <select
                    value={formData.kondisi}
                    onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Digunakan">Digunakan</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nilai Aset (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.nilai_aset}
                    onChange={(e) => setFormData({ ...formData, nilai_aset: e.target.value })}
                    placeholder="Contoh: 15000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal Perolehan
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_perolehan}
                    onChange={(e) => setFormData({ ...formData, tanggal_perolehan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows="2"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Tambahkan informasi tambahan bila ada..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isEditing ? 'Perbarui Aset' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutTemplate>
  );
}
