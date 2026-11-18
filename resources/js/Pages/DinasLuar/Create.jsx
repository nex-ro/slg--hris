import React, { useState } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import { 
  Check, ArrowLeft, LogIn, PhoneCall, HelpCircle,
  AlertCircle, ChevronDown, CheckCircle2, RotateCcw
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CreatePengajuan({ approvers = [] }) {
  const { auth = {} } = usePage().props;
  const currentUser = auth.user || null;
  const isLoggedIn = !!currentUser;

  const defaultJabatan = currentUser?.jabatan && ['Staff', 'Manager', 'Head'].includes(currentUser.jabatan)
    ? currentUser.jabatan
    : 'Staff';

  const [formData, setFormData] = useState({
    email: currentUser?.email || '',
    nama_lengkap: currentUser?.name || '',
    nomor_surat: '',
    jabatan: defaultJabatan,
    pemberi_tugas: '',
    tanggal_berangkat: '',
    tanggal_kembali: '',
    is_selesai_kembali: false,
    tujuan: '',
    keperluan: '',
    transportasi: '',
    // Cash Advance
    ajukan_advance: false,
    panjar_nominal: '-',
    panjar_terbilang: '-',
    nama_rekening: '-',
    nomor_rekening: '-',
    nama_bank: '-',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdvanceOptionChange = (value) => {
    if (value === 'ya') {
      setFormData(prev => ({
        ...prev,
        ajukan_advance: true,
        panjar_nominal: prev.panjar_nominal === '-' ? '' : prev.panjar_nominal,
        panjar_terbilang: prev.panjar_terbilang === '-' ? '' : prev.panjar_terbilang,
        nama_rekening: prev.nama_rekening === '-' ? '' : prev.nama_rekening,
        nomor_rekening: prev.nomor_rekening === '-' ? '' : prev.nomor_rekening,
        nama_bank: prev.nama_bank === '-' ? '' : prev.nama_bank,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        ajukan_advance: false,
        panjar_nominal: '-',
        panjar_terbilang: '-',
        nama_rekening: '-',
        nomor_rekening: '-',
        nama_bank: '-',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nomor_surat.trim()) {
      toast.warning('Nomor surat wajib diisi! Harap hubungi HRD terlebih dahulu untuk mendapatkan nomor surat.');
      return;
    }
    if (!formData.tanggal_berangkat) {
      toast.warning('Tanggal berangkat wajib diisi!');
      return;
    }
    if (!formData.tujuan.trim()) {
      toast.warning('Tujuan perjalanan dinas wajib diisi!');
      return;
    }
    if (!formData.keperluan.trim()) {
      toast.warning('Keperluan perjalanan dinas wajib diisi!');
      return;
    }
    if (!formData.transportasi.trim()) {
      toast.warning('Transportasi perjalanan dinas wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    router.post(route('dinas-luar.store'), {
      ...formData,
      tanggal_kembali: formData.is_selesai_kembali ? null : (formData.tanggal_kembali || null),
      keterangan_kembali: formData.is_selesai_kembali ? 'Selesai' : null,
    }, {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsSuccess(true);
        toast.success('Pengajuan Surat Perjalanan Dinas berhasil dikirim!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (errs) => {
        setIsSubmitting(false);
        console.error(errs);
        const msg = Object.values(errs)[0] || 'Gagal menyimpan pengajuan surat dinas.';
        toast.error(msg);
      }
    });
  };

  const handleReset = () => {
    setFormData({
      email: currentUser?.email || '',
      nama_lengkap: currentUser?.name || '',
      nomor_surat: '',
      jabatan: defaultJabatan,
      pemberi_tugas: '',
      tanggal_berangkat: '',
      tanggal_kembali: '',
      is_selesai_kembali: false,
      tujuan: '',
      keperluan: '',
      transportasi: '',
      ajukan_advance: false,
      panjar_nominal: '-',
      panjar_terbilang: '-',
      nama_rekening: '-',
      nomor_rekening: '-',
      nama_bank: '-',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const FormContent = (
    <div className="max-w-[640px] mx-auto space-y-3 sm:space-y-4 font-sans text-[#202124]">
      
      {/* Top Header Card (Google Forms Style) */}
      <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden shadow-sm">
        {/* Google Form Accent Header Bar */}
        <div className="h-2.5 bg-[#673ab7] w-full" />
        
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-[30px] font-normal text-[#202124] tracking-tight leading-tight">
                PENGAJUAN SURAT PERJALANAN DINAS 2025
              </h1>
              <p className="text-xs text-[#5f6368] mt-1 font-medium">
                Sawit Lestari Group &bull; Head Office
              </p>
            </div>
            {isLoggedIn ? (
              <Link
                href={route('dinas-luar.pengajuan')}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Riwayat
              </Link>
            ) : (
              <Link
                href="/login"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1a73e8] hover:bg-[#e8f0fe] rounded transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" /> Masuk Akun
              </Link>
            )}
          </div>

          <div className="text-xs sm:text-[13px] text-[#202124] leading-relaxed space-y-2 border-t border-[#e0e0e0] pt-4">
            <p>
              Form ini khusus digunakan oleh karyawan HO Sawit Lestari Group, untuk keperluan pengajuan surat perjalanan dinas.
            </p>
            <p>
              Karyawan yang hendak melakukan perjalanan dinas, wajib mengisi form pada link <strong className="text-[#1a73e8]">https://bit.ly/SPD-2025</strong>
            </p>
            <p>
              Isi form sesuai pertanyaan atau sesuai contoh pengisian.
            </p>
            <p className="text-[#d93025] font-medium">
              Pengajuan surat perjalanan dinas selambatnya diajukan 3 (tiga) hari sebelum tanggal perjalanan dinas.
            </p>
            <p className="bg-[#f8f9fa] p-3 rounded border border-[#e0e0e0] text-[#3c4043]">
              Karyawan yang telah mengisi surat perjalanan dinas, segera menghubungi HRD atau melalui WhatsApp{' '}
              <a 
                href="https://wa.me/6285773331335?text=Halo%20HRD%20Sawit%20Lestari%20Group,%20saya%20ingin%20meminta%20nomor%20Surat%20Perjalanan%20Dinas%20(SPD)%202025" 
                target="_blank" 
                rel="noreferrer"
                className="font-bold text-[#1a73e8] hover:underline inline-flex items-center gap-1"
              >
                <PhoneCall className="w-3 h-3 text-[#1e8e3e]" /> (0857-7333-1335)
              </a>{' '}
              untuk mendapatkan nomor surat dan selanjutnya dapat diajukan otorisasi ke pihak terkait.
            </p>
          </div>

          {/* User Account Bar */}
          <div className="border-t border-[#e0e0e0] pt-3 flex flex-wrap items-center justify-between text-xs text-[#5f6368] gap-2">
            <div>
              {formData.email ? (
                <span>
                  <strong className="text-[#202124]">{formData.email}</strong>
                </span>
              ) : (
                <span>Belum login (Pengisian Terbuka / Publik)</span>
              )}
            </div>
            {isLoggedIn && (
              <span className="text-[#1a73e8] hover:underline cursor-pointer">
                {currentUser?.name}
              </span>
            )}
          </div>

          <div className="text-xs text-[#d93025] pt-1">
            * Menunjukkan pertanyaan yang wajib diisi
          </div>
        </div>
      </div>

      {isSuccess ? (
        /* Success Card (Google Form Submission Style) */
        <div className="bg-white rounded-lg border border-[#dadce0] p-7 shadow-sm space-y-4">
          <div className="h-2.5 bg-[#188038] -mt-7 -mx-7 mb-4 rounded-t-lg" />
          <h2 className="text-2xl font-normal text-[#202124]">
            PENGAJUAN SURAT PERJALANAN DINAS 2025
          </h2>
          <p className="text-sm text-[#202124] leading-relaxed">
            Tanggapan Anda telah berhasil direkam. Segera hubungi HRD atau konfirmasi via WhatsApp untuk otorisasi nomor surat dan pemrosesan selanjutnya.
          </p>

          <div className="pt-4 border-t border-[#e0e0e0] space-y-2 text-xs text-[#5f6368]">
            <p><strong>Nama:</strong> {formData.nama_lengkap}</p>
            <p><strong>Nomor Surat:</strong> {formData.nomor_surat}</p>
            <p><strong>Tujuan:</strong> {formData.tujuan}</p>
            <p><strong>Tanggal Berangkat:</strong> {formData.tanggal_berangkat}</p>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={() => {
                setIsSuccess(false);
                handleReset();
              }}
              className="text-xs sm:text-sm font-medium text-[#1a73e8] hover:underline"
            >
              Kirim tanggapan lain
            </button>
            {isLoggedIn && (
              <Link
                href={route('dinas-luar.pengajuan')}
                className="text-xs sm:text-sm font-medium text-[#1a73e8] hover:underline"
              >
                Lihat daftar riwayat saya
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Form Utama */
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          
          {/* Card: Email */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <label className="block text-sm sm:text-base font-normal text-[#202124]">
              Email <span className="text-[#d93025]">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Nama Lengkap */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <label className="block text-sm sm:text-base font-normal text-[#202124]">
              Nama Lengkap ( Name ) <span className="text-[#d93025]">*</span>
            </label>
            <input
              type="text"
              name="nama_lengkap"
              required
              value={formData.nama_lengkap}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Nomor Surat */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Nomor Surat (harap hubungin HRD) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Contoh Pengisian : 015/SLG-HO/SPD/XI/2025 &bull; Hubungi WA HRD (0857-7333-1335)
              </p>
            </div>
            <input
              type="text"
              name="nomor_surat"
              required
              value={formData.nomor_surat}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] font-medium placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Jabatan (Pilihan: Staff, Manager, Head) */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Jabatan ( Position ) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Pilih salah satu jabatan:
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {['Staff', 'Manager', 'Head'].map((opt) => (
                <label 
                  key={opt}
                  className="flex items-center gap-3 cursor-pointer group select-none"
                >
                  <input
                    type="radio"
                    name="jabatan"
                    value={opt}
                    checked={formData.jabatan === opt}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#673ab7] focus:ring-[#673ab7] border-[#70757a] cursor-pointer"
                  />
                  <span className="text-sm text-[#202124] group-hover:text-[#673ab7] transition-colors">
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Card: Pemberi Tugas */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Pemberi Tugas
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Nama Lengkap Atasan Langsung yang Menugaskan
              </p>
            </div>
            <input
              type="text"
              name="pemberi_tugas"
              value={formData.pemberi_tugas}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Tanggal Berangkat */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Tanggal Berangkat ( Departure Date ) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Contoh Pengisian : 02 Januari 2025
              </p>
            </div>
            <div className="sm:max-w-xs">
              <input
                type="date"
                name="tanggal_berangkat"
                required
                value={formData.tanggal_berangkat}
                onChange={handleInputChange}
                className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
              />
            </div>
          </div>

          {/* Card: Tanggal Kembali */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Tanggal Kembali ( Return Date ) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Contoh Pengisian : 05 Januari 2025 / Selesai
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_selesai_kembali}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      is_selesai_kembali: checked,
                      tanggal_kembali: checked ? '' : prev.tanggal_kembali
                    }));
                  }}
                  className="rounded text-[#673ab7] focus:ring-[#673ab7] border-[#70757a]"
                />
                <span className="text-xs text-[#5f6368]">
                  Kembali ketika tugas <strong>Selesai</strong> (tanpa tanggal pasti)
                </span>
              </label>

              {!formData.is_selesai_kembali && (
                <div className="sm:max-w-xs">
                  <input
                    type="date"
                    name="tanggal_kembali"
                    required={!formData.is_selesai_kembali}
                    value={formData.tanggal_kembali}
                    onChange={handleInputChange}
                    className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card: Tujuan */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Tujuan ( Destination ) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Contoh Pengisian : BSL1 dan BSL2
              </p>
            </div>
            <input
              type="text"
              name="tujuan"
              required
              value={formData.tujuan}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Keperluan */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Keperluan ( Duty Purposes ) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Contoh Pengisian : Internal Audit
              </p>
            </div>
            <textarea
              name="keperluan"
              required
              rows={2}
              value={formData.keperluan}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent resize-y"
            />
          </div>

          {/* Card: Transportasi */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Transportasi ( Transportation ) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Contoh Pengisian : Pesawat
              </p>
            </div>
            <input
              type="text"
              name="transportasi"
              required
              value={formData.transportasi}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Section Banner: Cash Advance */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-2">
            <h2 className="text-base sm:text-lg font-medium text-[#202124]">
              Pengajuan Advance Perjalanan Dinas ( Cash Advance )
            </h2>
            <p className="text-xs sm:text-[13px] text-[#5f6368] leading-relaxed">
              Karyawan yang mengajukan Cash Advance, untuk perjalanan dinas dapat mengisi form berikut sesuai contoh pengisian.<br />
              Karyawan yang tidak mengajukan Cash Advance, isi jawaban dengan tanda ( <strong>-</strong> ).
            </p>

            <div className="pt-3 border-t border-[#e0e0e0] flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-[#202124]">
                <input
                  type="radio"
                  name="advance_option"
                  value="tidak"
                  checked={!formData.ajukan_advance}
                  onChange={() => handleAdvanceOptionChange('tidak')}
                  className="w-4 h-4 text-[#673ab7] focus:ring-[#673ab7] border-[#70757a]"
                />
                Tidak Mengajukan Cash Advance (Otomatis tanda &quot;-&quot;)
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-[#202124]">
                <input
                  type="radio"
                  name="advance_option"
                  value="ya"
                  checked={formData.ajukan_advance}
                  onChange={() => handleAdvanceOptionChange('ya')}
                  className="w-4 h-4 text-[#673ab7] focus:ring-[#673ab7] border-[#70757a]"
                />
                Ya, Mengajukan Cash Advance
              </label>
            </div>
          </div>

          {/* Card: Panjar Dinas (Nominal) */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Panjar Dinas (Nominal) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Contoh Pengisian : 1.000.000 * (jika tidak mengajukan Cash Advance, isi jawaban dengan tanda - )
              </p>
            </div>
            <input
              type="text"
              name="panjar_nominal"
              required
              value={formData.panjar_nominal}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Panjar Dinas (Terbilang) */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Panjar Dinas (Terbilang) <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                Contoh Pengisian : Satu Juta Rupiah * (jika tidak mengajukan Cash Advance, isi jawaban dengan tanda - )
              </p>
            </div>
            <input
              type="text"
              name="panjar_terbilang"
              required
              value={formData.panjar_terbilang}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Nama Rekening */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Nama Rekening <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                *isi kan Nama Lengkap penerima Cash Advance, sesuai rekening penerima
              </p>
            </div>
            <input
              type="text"
              name="nama_rekening"
              required
              value={formData.nama_rekening}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Nomor Rekening */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Nomor Rekening <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                *isi kan Nomor Rekening penerima Cash Advance, sesuai rekening penerima
              </p>
            </div>
            <input
              type="text"
              name="nomor_rekening"
              required
              value={formData.nomor_rekening}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Card: Nama Bank */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm space-y-3 transition-colors focus-within:border-[#673ab7]">
            <div>
              <label className="block text-sm sm:text-base font-normal text-[#202124]">
                Nama Bank <span className="text-[#d93025]">*</span>
              </label>
              <p className="text-xs text-[#5f6368] mt-1">
                *isi kan Bank penerima Cash Advance, sesuai rekening penerima
              </p>
            </div>
            <input
              type="text"
              name="nama_bank"
              required
              value={formData.nama_bank}
              onChange={handleInputChange}
              placeholder="Jawaban Anda"
              className="w-full text-sm border-0 border-b border-[#dadce0] pb-2 px-0 text-[#202124] placeholder-[#70757a] focus:ring-0 focus:border-[#673ab7] transition-all bg-transparent"
            />
          </div>

          {/* Action Buttons (Google Form Style) */}
          <div className="flex items-center justify-between pt-2 pb-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#673ab7] hover:bg-[#5b32a3] text-white text-sm font-medium rounded shadow hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs sm:text-sm text-[#1a73e8] hover:underline font-medium px-2 py-1"
            >
              Kosongkan formulir
            </button>
          </div>

        </form>
      )}

      {/* Footer Hak Cipta */}
      <div className="text-center text-xs text-[#70757a] py-6 space-y-1">
        <p>Formulir ini dibuat di dalam Sistem HRIS Sawit Lestari Group.</p>
        <p className="text-[11px] text-[#9aa0a6]">&copy; {new Date().getFullYear()} Sawit Lestari Group</p>
      </div>
    </div>
  );

  // Jika sedang login, gunakan wrapper dashboard HRIS
  if (isLoggedIn) {
    return (
      <LayoutTemplate>
        <Head title="Pengajuan Surat Perjalanan Dinas 2025" />
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="p-3 sm:p-6 lg:p-8 bg-[#f0ebf8]/40 min-h-screen">
          {FormContent}
        </div>
      </LayoutTemplate>
    );
  }

  // Tampilan Publik
  return (
    <div className="min-h-screen bg-[#ede7f6]/40 py-6 sm:py-10 px-3 sm:px-4">
      <Head title="PENGAJUAN SURAT PERJALANAN DINAS 2025" />
      <ToastContainer position="top-right" autoClose={3000} />
      {FormContent}
    </div>
  );
}
