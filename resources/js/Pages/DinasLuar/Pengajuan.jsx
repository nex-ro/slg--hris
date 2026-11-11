import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import { 
  MapPin, Plus, Calendar, Clock, CheckCircle, XCircle, Search, Filter,
  FileText, Briefcase, Car, Plane, DollarSign, Eye, X, Upload, ChevronRight,
  AlertCircle, Building2, User
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Pengajuan({ pengajuanList = [] }) {
  const { auth = {} } = usePage().props;
  const user = auth.user || {};

  const [list, setList] = useState(pengajuanList);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    tujuan: '',
    lokasi: '',
    kategori: 'Luar Kota',
    tanggal_mulai: '',
    tanggal_selesai: '',
    keperluan: '',
    transportasi: 'Kereta Api',
    estimasi_biaya: '',
    file_memo: null,
  });
  const [fileName, setFileName] = useState('');

  // Stats calculation
  const totalPengajuan = list.length;
  const pendingCount = list.filter(item => item.status === 'pending').length;
  const approvedCount = list.filter(item => item.status === 'approved').length;
  const totalEstimasi = list.reduce((acc, curr) => acc + (Number(curr.estimasi_biaya) || 0), 0);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setFormData(prev => ({ ...prev, file_memo: file }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tujuan || !formData.tanggal_mulai || !formData.tanggal_selesai || !formData.keperluan) {
      toast.error('Harap lengkapi semua data wajib!');
      return;
    }

    const durasi = calculateDays(formData.tanggal_mulai, formData.tanggal_selesai);
    if (durasi <= 0) {
      toast.error('Tanggal selesai harus sama atau setelah tanggal mulai!');
      return;
    }

    const newItem = {
      id: Date.now(),
      no_surat: `DL/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(list.length + 1).padStart(3, '0')}`,
      nama: user.name || 'User',
      divisi: user.divisi || 'Divisi',
      tujuan: formData.tujuan,
      lokasi: formData.lokasi || '-',
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_selesai: formData.tanggal_selesai,
      durasi: durasi,
      keperluan: formData.keperluan,
      transportasi: formData.transportasi,
      estimasi_biaya: Number(formData.estimasi_biaya) || 0,
      status: 'pending',
      keterangan: 'Menunggu persetujuan atasan',
      created_at: new Date().toISOString().split('T')[0],
    };

    setList([newItem, ...list]);
    toast.success('Pengajuan dinas luar berhasil dibuat!');
    setShowModal(false);
    setFormData({
      tujuan: '',
      lokasi: '',
      kategori: 'Luar Kota',
      tanggal_mulai: '',
      tanggal_selesai: '',
      keperluan: '',
      transportasi: 'Kereta Api',
      estimasi_biaya: '',
      file_memo: null,
    });
    setFileName('');
  };

  const filteredList = list.filter(item => {
    const matchSearch = 
      item.tujuan.toLowerCase().includes(search.toLowerCase()) ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.no_surat.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Menunggu
          </span>
        );
    }
  };

  return (
    <LayoutTemplate>
      <Head title="Pengajuan Dinas Luar" />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm">
                  Modul Dinas Luar
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Pengajuan Dinas Luar</h1>
              <p className="text-blue-100 text-sm mt-1 max-w-xl">
                Ajukan permohonan dinas luar kota/kantor, rencanakan akomodasi, dan ajukan estimasi anggaran perjalanan.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-700 hover:bg-blue-50 font-semibold shadow-md transition-all transform active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Pengajuan</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pengajuan</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalPengajuan}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Menunggu</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Disetujui</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{approvedCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Estimasi</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">{formatRupiah(totalEstimasi)}</h3>
            </div>
          </div>
        </div>

        {/* Filter and Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tujuan, nomor surat, nama..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Disetujui</option>
                <option value="completed">Selesai</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">No. Surat / Pemohon</th>
                  <th className="px-5 py-3.5">Tujuan & Lokasi</th>
                  <th className="px-5 py-3.5">Jadwal Dinas</th>
                  <th className="px-5 py-3.5">Transportasi</th>
                  <th className="px-5 py-3.5 text-right">Estimasi Biaya</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.length > 0 ? (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{item.no_surat}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {item.nama} • <span className="text-blue-600 font-medium">{item.divisi}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{item.tujuan}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-red-500" /> {item.lokasi}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-gray-800 font-medium">
                          {item.tanggal_mulai} s/d {item.tanggal_selesai}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Durasi: <span className="font-semibold text-gray-700">{item.durasi} Hari</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">
                          {item.transportasi}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        {formatRupiah(item.estimasi_biaya)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setDetailModal(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <MapPin className="w-10 h-10 text-gray-300 mb-2" />
                        <p className="font-medium text-gray-600">Belum ada data pengajuan dinas luar</p>
                        <p className="text-xs text-gray-400 mt-1">Klik tombol "Buat Pengajuan" untuk membuat pengajuan baru.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Buat Pengajuan */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Formulir Pengajuan Dinas Luar</h3>
                <p className="text-blue-100 text-xs mt-0.5">Lengkapi informasi permohonan dinas luar kota/kantor</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pemohon</label>
                  <input
                    type="text"
                    disabled
                    value={user.name || 'User Pegawai'}
                    className="w-full text-sm bg-gray-100 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Divisi</label>
                  <input
                    type="text"
                    disabled
                    value={user.divisi || 'Semua Divisi'}
                    className="w-full text-sm bg-gray-100 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Instansi / Perusahaan Tujuan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="tujuan"
                    required
                    value={formData.tujuan}
                    onChange={handleInputChange}
                    placeholder="Contoh: PT Telkom Surabaya"
                    className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kota / Lokasi Tujuan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="lokasi"
                    required
                    value={formData.lokasi}
                    onChange={handleInputChange}
                    placeholder="Contoh: Surabaya, Jawa Timur"
                    className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Mulai <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="tanggal_mulai"
                    required
                    value={formData.tanggal_mulai}
                    onChange={handleInputChange}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Selesai <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="tanggal_selesai"
                    required
                    value={formData.tanggal_selesai}
                    onChange={handleInputChange}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formData.tanggal_mulai && formData.tanggal_selesai && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                  <span>Estimasi Durasi Perjalanan:</span>
                  <span className="font-bold text-sm">
                    {calculateDays(formData.tanggal_mulai, formData.tanggal_selesai)} Hari Kerja
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Moda Transportasi</label>
                  <select
                    name="transportasi"
                    value={formData.transportasi}
                    onChange={handleInputChange}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kereta Api">Kereta Api</option>
                    <option value="Pesawat Terbang">Pesawat Terbang</option>
                    <option value="Kendaraan Dinas Kantor">Kendaraan Dinas Kantor</option>
                    <option value="Kendaraan Pribadi">Kendaraan Pribadi</option>
                    <option value="Travel / Bus">Travel / Bus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estimasi Anggaran (Rp)</label>
                  <input
                    type="number"
                    name="estimasi_biaya"
                    value={formData.estimasi_biaya}
                    onChange={handleInputChange}
                    placeholder="Contoh: 3500000"
                    className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Maksud & Keperluan Dinas <span className="text-red-500">*</span></label>
                <textarea
                  rows="3"
                  name="keperluan"
                  required
                  value={formData.keperluan}
                  onChange={handleInputChange}
                  placeholder="Jelaskan agenda kerja, tujuan kunjungan, hasil yang diharapkan..."
                  className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lampiran Memo / Surat Undangan (Opsional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-600">Klik untuk upload dokumen pendukung (PDF/JPG/PNG)</p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="inline-block mt-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 rounded-lg cursor-pointer">
                    Pilih File
                  </label>
                  {fileName && (
                    <p className="text-xs font-medium text-emerald-600 mt-2">Terpilih: {fileName}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Detail Pengajuan Dinas Luar</h3>
                <p className="text-xs text-gray-500 mt-0.5">{detailModal.no_surat}</p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-500">Status Pengajuan</span>
                <div>{getStatusBadge(detailModal.status)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block">Pemohon</span>
                  <span className="font-semibold text-gray-900">{detailModal.nama}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Divisi</span>
                  <span className="font-semibold text-gray-900">{detailModal.divisi}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Tujuan & Lokasi</span>
                <span className="font-semibold text-gray-900">{detailModal.tujuan}</span>
                <p className="text-xs text-gray-500">{detailModal.lokasi}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block">Tanggal Pelaksanaan</span>
                  <span className="font-semibold text-gray-900">{detailModal.tanggal_mulai} s/d {detailModal.tanggal_selesai}</span>
                  <p className="text-xs text-gray-500">Durasi: {detailModal.durasi} Hari</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Moda Transportasi</span>
                  <span className="font-semibold text-gray-900">{detailModal.transportasi}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Estimasi Anggaran</span>
                <span className="text-lg font-bold text-blue-600">{formatRupiah(detailModal.estimasi_biaya)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Keperluan / Agenda</span>
                <p className="p-3 bg-gray-50 rounded-xl text-gray-700 text-xs mt-1 border border-gray-100 leading-relaxed">
                  {detailModal.keperluan}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
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

