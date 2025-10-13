import React, { useState } from 'react';
import { FileText, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import { router } from '@inertiajs/react';

export default function Tes() {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    evaluasi: {
      penghargaan: '',
      kompensasi: '',
      pengembangan: '',
      peranTanggungJawab: '',
      kinerja: '',
      ruangLingkup: '',
      kondisiKerja: '',
      hubunganAtasan: '',
      hubunganRekan: '',
      gaji: '',
      tunjangan: ''
    },
    saranPerbaikan: {
      penghargaan: '',
      kompensasi: '',
      pengembangan: '',
      peranTanggungJawab: '',
      kinerja: '',
      ruangLingkup: '',
      kondisiKerja: '',
      hubunganAtasan: '',
      hubunganRekan: '',
      gaji: '',
      tunjangan: ''
    },
    informasiTambahan: '',
    untukMempertahankan: '',
    bersediaDipekerjakan: '',
    perusahaanBaru: '',
    jabatanBaru: '',
    gajiBaru: ''
  });

  const evaluasiItems = [
    { key: 'penghargaan', label: 'Penghargaan perusahaan terhadap prestasi kerja karyawan' },
    { key: 'kompensasi', label: 'Kompensasi yang diberikan seimbang dengan pekerjaan' },
    { key: 'pengembangan', label: 'Kesempatan untuk pengembangan karir' },
    { key: 'peranTanggungJawab', label: 'Peran dan tanggung jawab yang diberikan' },
    { key: 'kinerja', label: 'Kinerja dalam posisi sekarang' },
    { key: 'ruangLingkup', label: 'Kejelasan ruang lingkup pekerjaan' },
    { key: 'kondisiKerja', label: 'Kondisi dan prasarana kerja' },
    { key: 'hubunganAtasan', label: 'Hubungan dengan atasan' },
    { key: 'hubunganRekan', label: 'Hubungan dengan rekan kerja, divisi, atau departemen lain' },
    { key: 'gaji', label: 'Gaji dibandingkan dengan perusahaan lain' },
    { key: 'tunjangan', label: 'Tunjangan dan fasilitas dibandingkan perusaan lain' }
  ];

  const handleEvaluasiChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      evaluasi: { ...prev.evaluasi, [key]: value }
    }));
  };

  const handleSaranChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      saranPerbaikan: { ...prev.saranPerbaikan, [key]: value }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setCurrentPage(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  
  const handleSubmit = () => {
    setLoading(true);
    
    router.post('/dokumen/file-resign', formData, {
      onSuccess: () => {
        alert('Form berhasil disubmit! Klik Export PDF untuk download.');
        setLoading(false);
      },
      onError: (errors) => {
        console.error('Error:', errors);
        alert('Terjadi kesalahan saat submit form');
        setLoading(false);
      }
    });
  };

  const generatePDF = () => {
    setLoading(true);
    
    // Submit data dulu
    router.post('/dokumen/file-resign', formData, {
      onSuccess: () => {
        // Setelah berhasil submit, redirect ke route PDF
        window.location.href = '/exit-interview/generate-pdf';
        setTimeout(() => setLoading(false), 2000);
      },
      onError: (errors) => {
        console.error('Error:', errors);
        alert('Terjadi kesalahan saat submit form');
        setLoading(false);
      }
    });
  };

  return (
    <LayoutTemplate>
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Exit Interview</h1>
                    <p className="text-sm text-gray-500">FM-HRD-00-R00</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded">
                  {currentPage === 1 ? 'Form A' : 'Form B'}
                </span>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${currentPage === 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${currentPage === 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            </div>
            <p className="text-xs text-gray-500">Halaman {currentPage} dari 2</p>
          </div>

          {/* Intro */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              Tujuan dari pengisian form ini adalah untuk mendapatkan masukan dari karyawan. Masukan tersebut selanjutnya akan menjadi bahan yang sangat bermanfaat untuk perbaikan di dalam perusahaan. Informasi ini akan diberlakukan secara rahasia oleh Departemen HRD. Ijin dari karyawan akan diminta apabila informasi ini perlu untuk disampaikan ke atasan yang bersangkutan.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            {currentPage === 1 && (
              <div>
                {/* Evaluasi */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Pendapat Tentang Berbagai Hal</h2>
                  <p className="text-sm text-gray-600 mb-4">Beri tanda (✓) pada kolom yang dipilih</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700">Pendapat Karyawan</th>
                          <th className="border border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700">Kurang</th>
                            <th className="border border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700">Cukup</th>
                            <th className="border border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700">Baik</th>
                            <th className="border border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700">Baik Sekali</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700">Saran Perbaikan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluasiItems.map((item) => (
                          <tr key={item.key} className="hover:bg-gray-50 transition-colors">
                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{item.label}</td>
                            {[ 'Kurang', 'Cukup', 'Baik','Baik Sekali'].map((nilai) => (
                              <td key={nilai} className="border border-gray-200 px-3 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`eval_${item.key}`}
                                  value={nilai}
                                  checked={formData.evaluasi[item.key] === nilai}
                                  onChange={(e) => handleEvaluasiChange(item.key, e.target.value)}
                                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                                />
                              </td>
                            ))}
                            <td className="border border-gray-200 px-4 py-3">
                              <input
                                type="text"
                                value={formData.saranPerbaikan[item.key]}
                                onChange={(e) => handleSaranChange(item.key, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                placeholder="Tulis saran..."
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Informasi Tambahan */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Informasi Tambahan</h2>
                  <p className="text-sm text-gray-600 mb-3">Sekiranya terdapat hal-hal yang belum tercantum dalam pertanyaan-pertanyaan di atas</p>
                  <textarea
                    name="informasiTambahan"
                    value={formData.informasiTambahan}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm"
                    placeholder="Tuliskan informasi tambahan..."
                  />
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PAGE 2 - FORM B */}
            {currentPage === 2 && (
              <div>
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Form B - Pertanyaan Lanjutan</h2>
                  
                  {/* Pertanyaan 1 */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      1. Apa yang harus perusahaan berikan untuk dapat mempertahankan saudara pada saat ini?
                    </label>
                    <textarea
                      name="untukMempertahankan"
                      value={formData.untukMempertahankan}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm"
                      placeholder="Jelaskan apa yang diharapkan..."
                    />
                  </div>

                  {/* Pertanyaan 2 */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      2. Bersediakah saudara dipekerjakan kembali oleh perusahaan pada suatu waktu nanti, apabila kondisi yang menyebabkan saudara pindah telah diubah?
                    </label>
                    <textarea
                      name="bersediaDipekerjakan"
                      value={formData.bersediaDipekerjakan}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm"
                      placeholder="Ya/Tidak dan penjelasan..."
                    />
                  </div>

                  {/* Pertanyaan 3 */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      3. Pada kelompok industry mana saudara akan bekerja?
                    </label>
                    <p className="text-xs text-gray-600 mb-4">
                      (Jika tidak keberatan, tolong berikan nama perusahaan, jabatan, dan besarnya gaji serta fasilitas yang ditawarkan)
                    </p>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="perusahaanBaru"
                        value={formData.perusahaanBaru}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm"
                        placeholder="Nama perusahaan baru..."
                      />
                      <input
                        type="text"
                        name="jabatanBaru"
                        value={formData.jabatanBaru}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm"
                        placeholder="Jabatan baru..."
                      />
                      <input
                        type="text"
                        name="gajiBaru"
                        value={formData.gajiBaru}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm"
                        placeholder="Gaji dan fasilitas yang ditawarkan..."
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePrevious}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </button>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={generatePDF}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {loading ? 'Generating...' : 'Export PDF'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Form'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutTemplate>
  );
}