import React, { useState, useRef } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import { 
  Plus, Trash2, ArrowLeft, LogIn, Upload, FileText, CheckCircle2,
  Calendar, CreditCard, DollarSign, Building2, User, PhoneCall,
  AlertCircle, ChevronDown, Check, Download, Paperclip, FileSpreadsheet, Loader2, Sparkles
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CreateKlaim({ spdList = [] }) {
  const { auth = {} } = usePage().props;
  const currentUser = auth.user || null;
  const isLoggedIn = !!currentUser;

  const [formData, setFormData] = useState({
    nama_lengkap: currentUser?.name || '',
    email: currentUser?.email || '',
    jabatan: currentUser?.jabatan || '',
    divisi: currentUser?.divisi || '',
    nomor_surat_dinas: spdList.length > 0 ? spdList[0] : '',
    kegiatan: '',
    periode_awal: '',
    periode_akhir: '',
    kota_penandatangan: 'Jakarta',
    tanggal_pengajuan: new Date().toISOString().split('T')[0],
    cash_advance: 0,
    no_rekening: '',
    nama_bank: 'BCA',
    nama_rekening: currentUser?.name || '',
    metode_nota: 'pdf', // 'pdf' or 'offline'
    catatan_pemohon: '',
  });

  const [fileNota, setFileNota] = useState(null);
  const [items, setItems] = useState([
    { tanggal: '', rincian_biaya: '', nominal: '' }
  ]);

  // Mode Pengisian: 'manual' atau 'excel'
  const [inputMode, setInputMode] = useState('manual');
  const [excelFile, setExcelFile] = useState(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const excelInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedKlaim, setSubmittedKlaim] = useState(null);

  // Perhitungan Realtime
  const totalRealisasi = items.reduce((acc, curr) => acc + (parseFloat(curr.nominal) || 0), 0);
  const cashAdvanceVal = parseFloat(formData.cash_advance) || 0;
  const totalSisaKurang = totalRealisasi - cashAdvanceVal;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { tanggal: '', rincian_biaya: '', nominal: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      toast.warning('Minimal harus mengisi 1 rincian biaya!');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handler Upload dan Parsing File Excel Template Klaim
  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('File harus berformat Excel (.xlsx atau .xls)');
      if (excelInputRef.current) excelInputRef.current.value = '';
      return;
    }

    setExcelFile(file);
    setIsParsingExcel(true);

    const formDataUpload = new FormData();
    formDataUpload.append('excel_file', file);

    try {
      // Ambil CSRF token dari cookie/meta
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      const res = await fetch(route('dinas-luar.claim.parse-excel'), {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
          'Accept': 'application/json',
        },
        body: formDataUpload,
      });

      const result = await res.json();

      if (res.ok && result.status === 'success' && result.data) {
        const d = result.data;

        // Auto-fill form data
        setFormData(prev => ({
          ...prev,
          nama_lengkap: d.nama_lengkap || prev.nama_lengkap,
          jabatan: d.jabatan || prev.jabatan,
          kegiatan: d.kegiatan || prev.kegiatan,
          periode_awal: d.periode_awal || prev.periode_awal,
          periode_akhir: d.periode_akhir || prev.periode_akhir,
          kota_penandatangan: d.kota_penandatangan || prev.kota_penandatangan,
          tanggal_pengajuan: d.tanggal_pengajuan || prev.tanggal_pengajuan,
          cash_advance: d.cash_advance !== undefined ? d.cash_advance : prev.cash_advance,
          no_rekening: d.no_rekening || prev.no_rekening,
          nama_bank: d.nama_bank || prev.nama_bank,
          nama_rekening: d.nama_rekening || prev.nama_rekening,
        }));

        // Auto-fill items rincian biaya
        if (d.items && d.items.length > 0) {
          setItems(d.items.map(it => ({
            tanggal: it.tanggal || '',
            rincian_biaya: it.rincian_biaya || '',
            nominal: it.nominal !== undefined ? it.nominal : '',
          })));
        }

        toast.success(`Berhasil mengimpor ${d.items?.length || 0} rincian biaya dari file Excel! Anda masih dapat meninjau atau menyesuaikan data di bawah.`);
      } else {
        toast.error(result.message || 'Gagal membaca format file Excel template.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat memproses file Excel.');
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nama_lengkap.trim()) {
      toast.warning('Nama lengkap wajib diisi!');
      return;
    }
    if (!formData.email.trim()) {
      toast.warning('Email wajib diisi!');
      return;
    }
    if (!formData.kegiatan.trim()) {
      toast.warning('Nama kegiatan perjalanan dinas wajib diisi!');
      return;
    }

    // Validasi items
    const validItems = items.filter(it => it.rincian_biaya.trim() !== '' && parseFloat(it.nominal) > 0);
    if (validItems.length === 0) {
      if (inputMode === 'excel') {
        toast.warning('File Excel belum diunggah atau tidak ditemukan rincian biaya di dalam file Excel!');
      } else {
        toast.warning('Harap isi minimal 1 rincian biaya dengan nominal valid!');
      }
      return;
    }

    if (formData.metode_nota === 'pdf' && !fileNota) {
      toast.warning('Anda memilih pengiriman bukti nota via PDF. Harap lampirkan berkas PDF bukti nota!');
      return;
    }

    setIsSubmitting(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key] ?? '');
    });

    if (formData.metode_nota === 'pdf' && fileNota) {
      submitData.append('file_nota', fileNota);
    }

    validItems.forEach((it, idx) => {
      submitData.append(`items[${idx}][tanggal]`, it.tanggal || '');
      submitData.append(`items[${idx}][rincian_biaya]`, it.rincian_biaya);
      submitData.append(`items[${idx}][nominal]`, it.nominal);
    });

    router.post(route('dinas-luar.claim.store'), submitData, {
      forceFormData: true,
      onSuccess: () => {
        setIsSubmitting(false);
        setIsSuccess(true);
        setSubmittedKlaim({
          ...formData,
          totalRealisasi,
          cashAdvanceVal,
          totalSisaKurang,
          itemCount: validItems.length
        });
        toast.success('Pengajuan Claim Dinas berhasil dikirim!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (errs) => {
        setIsSubmitting(false);
        console.error(errs);
        const msg = Object.values(errs)[0] || 'Gagal menyimpan pengajuan claim dinas.';
        toast.error(msg);
      }
    });
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  const FormContent = (
    <div className="max-w-[760px] mx-auto space-y-4 font-sans text-[#202124]">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#dadce0] overflow-hidden shadow-sm">
        <div className="h-3 bg-[#1e3a8a] w-full" />
        
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-blue-700 uppercase block mb-1">
                FORMHR02/OFL/III/2022 &bull; Sawit Lestari Group
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">
                Realisasi Klaim Dinas (Claim Dinas)
              </h1>
              <p className="text-xs text-[#5f6368] mt-1 font-medium">
                Formulir pengajuan penggantian dan pertanggungjawaban biaya perjalanan dinas
              </p>
            </div>

            {isLoggedIn ? (
              <Link
                href={route('dinas-luar.pencatatan')}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Riwayat Klaim
              </Link>
            ) : (
              <Link
                href="/login"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <LogIn className="w-3.5 h-3.5" /> Masuk Akun
              </Link>
            )}
          </div>

          <div className="text-xs text-[#3c4043] bg-slate-50 p-4 rounded-xl border border-slate-200/80 leading-relaxed space-y-1.5">
            <p>
              💡 <strong>Petunjuk Pengisian:</strong> Masukkan rincian pengeluaran perjalanan dinas Anda beserta nominalnya. Sistem otomatis menghitung total realisasi biaya dan sisa lebih/kurang dari panjar (Cash Advance).
            </p>
            <p>
              📎 <strong>Bukti Nota:</strong> Pilih apakah bukti nota diserahkan secara <strong>Fisik / Offline</strong> ke HRD, atau diunggah langsung dalam format <strong>PDF</strong>.
            </p>
          </div>

          <div className="text-xs text-[#d93025]">
            * Menunjukkan pertanyaan yang wajib diisi
          </div>
        </div>
      </div>

      {isSuccess ? (
        /* Halaman Sukses */
        <div className="bg-white rounded-2xl border border-[#dadce0] p-7 shadow-sm space-y-5">
          <div className="h-3 bg-emerald-600 -mt-7 -mx-7 mb-4 rounded-t-2xl" />
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#202124]">Pengajuan Claim Dinas Berhasil Terkirim!</h2>
              <p className="text-xs text-gray-500">Notifikasi email telah diteruskan ke bagian HRD untuk diverifikasi.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Nama Pemohon:</span>
              <strong className="text-gray-800">{submittedKlaim?.nama_lengkap}</strong>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Kegiatan Dinas:</span>
              <strong className="text-gray-800">{submittedKlaim?.kegiatan}</strong>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Total Realisasi ({submittedKlaim?.itemCount} item):</span>
              <strong className="text-gray-800">{formatRupiah(submittedKlaim?.totalRealisasi)}</strong>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Cash Advance:</span>
              <strong className="text-gray-800">{formatRupiah(submittedKlaim?.cashAdvanceVal)}</strong>
            </div>
            <div className="flex justify-between pt-1 text-sm">
              <span className="font-bold text-gray-700">Total Sisa Kurang:</span>
              <strong className="font-bold text-blue-700">{formatRupiah(submittedKlaim?.totalSisaKurang)}</strong>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={() => {
                setIsSuccess(false);
                setItems([{ tanggal: '', rincian_biaya: '', nominal: '' }]);
                setFileNota(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Isi Form Claim Lain
            </button>
            {isLoggedIn && (
              <Link
                href={route('dinas-luar.pencatatan')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Lihat Daftar Riwayat Klaim
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Form Utama */
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section 1: Identitas Pemohon */}
          <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">
              1. Identitas Pemohon &amp; Kegiatan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama_lengkap"
                  required
                  value={formData.nama_lengkap}
                  onChange={handleInputChange}
                  placeholder="Contoh: Melissa"
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="nama@sawitlestarigroup.co.id"
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Jabatan (Position)
                </label>
                <input
                  type="text"
                  name="jabatan"
                  value={formData.jabatan}
                  onChange={handleInputChange}
                  placeholder="Contoh: Admin Penjualan / Staff"
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor SPD Terkait (Opsional)
                </label>
                <input
                  type="text"
                  name="nomor_surat_dinas"
                  value={formData.nomor_surat_dinas}
                  onChange={handleInputChange}
                  placeholder="Contoh: 015/SLG-HO/SPD/XI/2025"
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Kegiatan Perjalanan Dinas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="kegiatan"
                required
                value={formData.kegiatan}
                onChange={handleInputChange}
                placeholder="Contoh: Kegiatan Audit Lapangan Kebun BSL1"
                className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Periode Dinas Mulai
                </label>
                <input
                  type="date"
                  name="periode_awal"
                  value={formData.periode_awal}
                  onChange={handleInputChange}
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Periode Dinas Selesai
                </label>
                <input
                  type="date"
                  name="periode_akhir"
                  value={formData.periode_akhir}
                  onChange={handleInputChange}
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Rincian Pengeluaran Biaya (Gabungan Pilihan Manual vs Upload Excel) */}
          <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm space-y-5">
            {/* Header Section 2 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  2. Rincian Pengeluaran Biaya
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Pilih metode pengisian: upload file Excel atau mengisi rincian baris demi baris secara langsung.
                </p>
              </div>

              <a
                href={route('dinas-luar.claim.template')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors border border-emerald-200 self-start sm:self-auto shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Template Excel (.xlsx)
              </a>
            </div>

            {/* Tab / Radio Switch: Manual vs Upload Excel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                inputMode === 'manual' ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="input_mode"
                  value="manual"
                  checked={inputMode === 'manual'}
                  onChange={() => setInputMode('manual')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <strong className="block text-xs sm:text-sm text-gray-900">Isi Rincian Biaya Manual</strong>
                  <span className="text-[11px] text-gray-500 leading-relaxed block mt-0.5">
                    Ketik tanggal, rincian biaya, dan nominal satu per satu langsung di formulir ini.
                  </span>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                inputMode === 'excel' ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="input_mode"
                  value="excel"
                  checked={inputMode === 'excel'}
                  onChange={() => setInputMode('excel')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <strong className="block text-xs sm:text-sm text-gray-900 flex items-center gap-1.5">
                    Upload Berkas Excel <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-md font-bold">Praktis</span>
                  </strong>
                  <span className="text-[11px] text-gray-500 leading-relaxed block mt-0.5">
                    Cukup upload file Excel template, sistem otomatis membaca dan menghitung rincian biaya.
                  </span>
                </div>
              </label>
            </div>

            {/* KONTEN JIKA MEMILIH MODE MANUAL */}
            {inputMode === 'manual' && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Daftar Pengeluaran:</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="w-full sm:w-36 shrink-0">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1 sm:hidden">Tanggal</label>
                        <input
                          type="date"
                          value={item.tanggal}
                          onChange={(e) => handleItemChange(idx, 'tanggal', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white"
                        />
                      </div>

                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1 sm:hidden">Rincian Biaya</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Biaya GrabCar dari Jl Rosela ke Hotel"
                          value={item.rincian_biaya}
                          onChange={(e) => handleItemChange(idx, 'rincian_biaya', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white"
                        />
                      </div>

                      <div className="w-full sm:w-40 shrink-0">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1 sm:hidden">Nominal (Rp)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="100"
                          placeholder="Rp Nominal"
                          value={item.nominal}
                          onChange={(e) => handleItemChange(idx, 'nominal', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-right font-medium"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Hapus Baris"
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors shrink-0 self-end sm:self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total Ringkasan Biaya Manual */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="font-semibold text-gray-700">Total Realisasi Biaya:</span>
                    <span className="font-bold text-gray-900 text-base">{formatRupiah(totalRealisasi)}</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="font-semibold text-gray-700">Cash Advance (Panjar Diterima):</span>
                    <div className="w-40">
                      <input
                        type="number"
                        min="0"
                        name="cash_advance"
                        value={formData.cash_advance}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-1.5 text-right font-semibold text-emerald-800 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                    <div>
                      <span className="font-bold text-gray-800 text-sm">Total Sisa Kurang:</span>
                      <p className="text-[11px] text-gray-400">Total Realisasi dikurangi Cash Advance</p>
                    </div>
                    <span className={`font-black text-lg ${totalSisaKurang >= 0 ? 'text-blue-700' : 'text-amber-600'}`}>
                      {formatRupiah(totalSisaKurang)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN JIKA MEMILIH MODE UPLOAD EXCEL */}
            {inputMode === 'excel' && (
              <div className="space-y-4 pt-1">
                {/* Upload File Input */}
                <div className="p-4 bg-gradient-to-br from-emerald-50/70 to-blue-50/70 rounded-xl border border-emerald-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Pilih File Excel Template Klaim (.xlsx / .xls)
                    </div>
                    {isParsingExcel && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-semibold animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca data Excel...
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="file"
                      ref={excelInputRef}
                      accept=".xlsx, .xls"
                      disabled={isParsingExcel}
                      onChange={handleExcelUpload}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer bg-white p-2 rounded-xl border border-gray-200"
                    />
                    {excelFile && (
                      <span className="text-[11px] text-emerald-700 font-medium whitespace-nowrap shrink-0">
                        ✓ {excelFile.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Belum Upload vs Sudah Terbaca */}
                {!excelFile ? (
                  <div className="p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-300 text-center space-y-1.5">
                    <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      Belum ada file Excel yang diunggah
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Silakan pilih file Excel pada kotak di atas. Data rincian biaya tidak perlu diketik manual.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        Pratinjau Rincian Biaya dari Excel:
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                        {items.filter(it => it.rincian_biaya.trim() !== '').length} Item Terbaca
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2.5 w-12 text-center">No</th>
                            <th className="px-3 py-2.5 w-28">Tanggal</th>
                            <th className="px-3 py-2.5">Rincian Pengeluaran Biaya</th>
                            <th className="px-3 py-2.5 text-right w-36">Nominal (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.filter(it => it.rincian_biaya.trim() !== '').map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="px-3 py-2 text-center text-gray-400 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{it.tanggal || '-'}</td>
                              <td className="px-3 py-2 text-gray-800 font-medium">{it.rincian_biaya}</td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
                                {formatRupiah(it.nominal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Ringkasan Total Realisasi & Panjar */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-600 font-medium">Total Realisasi Biaya:</span>
                        <strong className="text-gray-900 text-base">{formatRupiah(totalRealisasi)}</strong>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-600 font-medium">Cash Advance (Panjar):</span>
                        <strong className="text-emerald-700">{formatRupiah(cashAdvanceVal)}</strong>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
                        <div>
                          <span className="font-bold text-gray-800">Total Sisa Kurang:</span>
                          <p className="text-[10px] text-gray-400">Total Realisasi dikurangi Cash Advance</p>
                        </div>
                        <span className={`font-black text-lg ${totalSisaKurang >= 0 ? 'text-blue-700' : 'text-amber-600'}`}>
                          {formatRupiah(totalSisaKurang)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Rekening Penerima Transfer */}
          <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">
              3. Rekening Penerima Penggantian Biaya
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  name="nama_bank"
                  value={formData.nama_bank}
                  onChange={handleInputChange}
                  placeholder="Contoh: BCA / Mandiri / BRI"
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  name="no_rekening"
                  value={formData.no_rekening}
                  onChange={handleInputChange}
                  placeholder="Contoh: 5380.139.776"
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  name="nama_rekening"
                  value={formData.nama_rekening}
                  onChange={handleInputChange}
                  placeholder="Contoh: Melissa"
                  className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Metode Pengiriman Nota (PDF / Offline) */}
          <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">
              4. Bukti Nota &amp; Lampiran <span className="text-red-500">*</span>
            </h2>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                Pilih Metode Penyerahan Bukti Nota:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  formData.metode_nota === 'pdf' ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="metode_nota"
                    value="pdf"
                    checked={formData.metode_nota === 'pdf'}
                    onChange={handleInputChange}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <strong className="block text-xs sm:text-sm text-gray-900">Kirim Bukti Nota (PDF)</strong>
                    <span className="text-[11px] text-gray-500 leading-relaxed block mt-0.5">
                      Unggah berkas scan/foto nota dalam format file PDF secara online.
                    </span>
                  </div>
                </label>

                <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  formData.metode_nota === 'offline' ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="metode_nota"
                    value="offline"
                    checked={formData.metode_nota === 'offline'}
                    onChange={handleInputChange}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <strong className="block text-xs sm:text-sm text-gray-900">Serahkan Bukti Fisik (Offline)</strong>
                    <span className="text-[11px] text-gray-500 leading-relaxed block mt-0.5">
                      Nota fisik asli akan diserahkan langsung ke tim HRD untuk diverifikasi.
                    </span>
                  </div>
                </label>
              </div>

              {/* Upload Input Jika Memilih PDF */}
              {formData.metode_nota === 'pdf' && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-dashed border-blue-300 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    Lampirkan Berkas Bukti Nota (Wajib PDF, Maks. 10 MB)
                  </div>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    required={formData.metode_nota === 'pdf'}
                    onChange={(e) => setFileNota(e.target.files[0] || null)}
                    className="w-full text-xs text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {fileNota && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ File terpilih: {fileNota.name} ({(fileNota.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                name="catatan_pemohon"
                rows={2}
                value={formData.catatan_pemohon}
                onChange={handleInputChange}
                placeholder="Tambahkan catatan jika diperlukan..."
                className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all resize-y"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 pb-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#1e3a8a] hover:bg-blue-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Claim Dinas'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Kosongkan semua data isian?')) {
                  setItems([{ tanggal: '', rincian_biaya: '', nominal: '' }]);
                  setFileNota(null);
                }
              }}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium"
            >
              Reset Isian
            </button>
          </div>

        </form>
      )}

      <div className="text-center text-xs text-[#70757a] py-6 space-y-1">
        <p>Formulir Klaim Realisasi Biaya Perjalanan Dinas &bull; Sistem HRIS</p>
        <p className="text-[11px] text-[#9aa0a6]">&copy; {new Date().getFullYear()} Sawit Lestari Group</p>
      </div>

    </div>
  );

  if (isLoggedIn) {
    return (
      <LayoutTemplate>
        <Head title="Form Pengajuan Claim Dinas" />
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="p-3 sm:p-6 lg:p-8 bg-slate-100/50 min-h-screen">
          {FormContent}
        </div>
      </LayoutTemplate>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 py-6 sm:py-10 px-3 sm:px-4">
      <Head title="Realisasi Klaim Dinas - Sawit Lestari Group" />
      <ToastContainer position="top-right" autoClose={3000} />
      {FormContent}
    </div>
  );
}
