import React, { useState } from 'react';
import { X, FileText, ChevronDown ,AlertCircle } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';
import ModalResign from './Modal/ModalResign';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { router } from '@inertiajs/react';
const ModalSuratKelakuanBaik = ({ onClose, onSubmit }) => {
  return (
    
    <div className="p-6">

      <h3 className="text-lg font-semibold mb-4">Ini Modal Custom untuk Surat Kelakuan Baik</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
          <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
          <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">Surat kelakuan baik memerlukan persetujuan dari bagian kemahasiswaan</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Batal
        </button>
        <button onClick={onSubmit} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Submit
        </button>
      </div>
    </div>
  );
};

const ModalSuratBeasiswa = ({ onClose, onSubmit }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Modal Custom - Surat Keterangan Tidak Menerima Beasiswa</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NIM</label>
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program Studi</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>Pilih Program Studi</option>
              <option>Teknik Informatika</option>
              <option>Sistem Informasi</option>
            </select>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">⚠️ Pastikan data yang Anda masukkan benar</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Batal
        </button>
        <button onClick={onSubmit} className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
          Submit
        </button>
      </div>
    </div>
  );
};

// Modal Default untuk surat lainnya
const ModalDefault = ({ modalContent, onClose, onSubmit }) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {modalContent.content.fields.map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={`Masukkan ${field.toLowerCase()}`}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan Tambahan
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Masukkan catatan tambahan (opsional)"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ajukan Permohonan
        </button>
      </div>
    </div>
  );
};

const Dokumen = () => {
  const { riwayatResign } = usePage().props;
  const [activeTab, setActiveTab] = useState('layanan');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [pendingForm, setPendingForm] = useState(null);

    useEffect(() => {
      const needsForm = riwayatResign.find(
        resign =>
          (resign.isDokument === "1" || resign.isDokument === 1) &&
          !resign.dokument &&
          resign.status !== "Diajukan"
      );

      if (needsForm) {
        setPendingForm(needsForm);
      } else {
        setPendingForm(null);
      }
    }, [riwayatResign]);

    const handleIsiForm = () => {
      if (pendingForm) {
        router.visit(`/dokumen/file/resign/${pendingForm.id}`);
      }
    };
  const suratLayanan = [
    {
      id: 1,
      title: 'Pengajuan Resign',
      type: 'surat',
      modalComponent: 'ModalResign',
      content: {
        title: 'Form Surat Keterangan Aktif Kuliah',
        fields: ['Nama Lengkap', 'NIM', 'Program Studi', 'Semester', 'Keperluan']
      }
    },
    // {
    //   id: 2,
    //   title: 'Surat Kelakuan Baik',
    //   type: 'surat',
    //   modalComponent: 'ModalSuratKelakuanBaik', // Komponen modal custom
    //   content: {
    //     title: 'Form Surat Kelakuan Baik',
    //     fields: ['Nama Lengkap', 'NIM', 'Program Studi', 'Alamat', 'Keperluan']
    //   }
    // },
    // {
    //   id: 3,
    //   title: 'Surat Ket. Tidak Menerima Beasiswa',
    //   type: 'surat',
    //   modalComponent: 'ModalSuratBeasiswa', // Komponen modal custom
    //   content: {
    //     title: 'Form Surat Keterangan Tidak Menerima Beasiswa',
    //     fields: ['Nama Lengkap', 'NIM', 'Program Studi', 'Tahun Akademik', 'Keperluan']
    //   }
    // },
    // {
    //   id: 4,
    //   title: 'Surat Ket. Lulus Sidang TA',
    //   type: 'surat',
    //   modalComponent: 'default', // Menggunakan modal default
    //   content: {
    //     title: 'Form Surat Keterangan Lulus Sidang TA',
    //     fields: ['Nama Lengkap', 'NIM', 'Program Studi', 'Judul TA', 'Tanggal Sidang']
    //   }
    // },
    // {
    //   id: 5,
    //   title: 'Surat Sedang TA',
    //   type: 'surat',
    //   modalComponent: 'default',
    //   content: {
    //     title: 'Form Surat Sedang Tugas Akhir',
    //     fields: ['Nama Lengkap', 'NIM', 'Program Studi', 'Judul TA', 'Dosen Pembimbing']
    //   }
    // },
    // {
    //   id: 6,
    //   title: 'Surat Permohonan Izin Survey',
    //   type: 'surat',
    //   modalComponent: 'default',
    //   content: {
    //     title: 'Form Surat Permohonan Izin Survey',
    //     fields: ['Nama Lengkap', 'NIM', 'Program Studi', 'Lokasi Survey', 'Tujuan Survey', 'Waktu Pelaksanaan']
    //   }
    // }
  ];

    const riwayatData = [
    ...riwayatResign.map(resign => ({
      ...resign,
      type: 'resign'
    })),
    
  ];


  const openModal = (item) => {
    setModalContent(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  const handleSubmit = () => {
    alert('Permohonan berhasil diajukan!');
    closeModal();
  };

    const handleDetailClick = (item) => {
    if (item.type === 'resign') {
      // Ambil data langsung dari item yang diklik
      setDetailData({
        id: item.id,
        tanggal_keluar: item.tanggal_keluar,
        alasan: item.alasan,
        dokument: item.dokument,
        isDokument: item.isDokument,
        status: item.status,
        tanggal_pengajuan: item.tanggal,
        dokument_url: item.dokument ? `/storage/${item.dokument}` : null
      });
      setShowDetailModal(true);
    } else {
      alert('Detail untuk jenis surat ini belum tersedia');
    }
  };


  // Fungsi untuk render modal yang sesuai
  const renderModalContent = () => {
    if (!modalContent) return null;

    switch (modalContent.modalComponent) {
        case 'ModalResign':
        return <ModalResign onClose={closeModal} onSubmit={handleSubmit} />;
      case 'ModalSuratAktif':
        return <ModalSuratAktif onClose={closeModal} onSubmit={handleSubmit} />;
      case 'ModalSuratKelakuanBaik':
        return <ModalSuratKelakuanBaik onClose={closeModal} onSubmit={handleSubmit} />;
      case 'ModalSuratBeasiswa':
        return <ModalSuratBeasiswa onClose={closeModal} onSubmit={handleSubmit} />;
      default:
        return <ModalDefault modalContent={modalContent} onClose={closeModal} onSubmit={handleSubmit} />;
    }
  };

  return (
        <LayoutTemplate>
                 <Head title="Dokumen" />

    <div className="">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daftar Layanan Akademik</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('layanan')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'layanan'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Layanan
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'riwayat'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Riwayat Permohonan
        </button>
      </div>

        {pendingForm && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  Anda punya form Exit Interview yang harus diisi
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Pengajuan resign Anda memerlukan pengisian form Exit Interview. Silakan lengkapi form untuk melanjutkan proses.
                </p>
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  Tanggal pengajuan: {pendingForm.tanggal}
                </p>
              </div>
              <button
                onClick={handleIsiForm}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0"
              >
                Isi Form
              </button>
            </div>
          </div>
        )}

      {/* Content Based on Active Tab */}
      {activeTab === 'layanan' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            {suratLayanan.map((surat) => (
              <div
                key={surat.id}
                onClick={() => openModal(surat)}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="text-gray-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{surat.title}</h3>
                    <p className="text-sm text-blue-500">{surat.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Riwayat Permohonan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Surat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pengajuan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {riwayatData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.jenisSurat}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.tanggal}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
    <button 
      onClick={() => handleDetailClick(item)}
      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
    >
      Detail
    </button>
    {/* Tombol Isi Form untuk data yang belum diisi */}
{item.type === 'resign' &&
  (item.isDokument === "1" || item.isDokument === 1) &&
  !item.dokument &&
  item.status !== "Diajukan" && (
    <button
      onClick={() => router.visit(`/dokumen/file/resign/${item.id}`)}
      className="text-amber-600 hover:text-amber-800 text-sm font-medium"
    >
      Isi Form
    </button>
  )}
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

      )}

      {/* Modal */}
      {showModal && modalContent && (
        <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{modalContent.content.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Render Modal Content berdasarkan modalComponent */}
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
            {showDetailModal && detailData && (
          <div style={{padding:"0px",margin:'0px'}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Detail Pengajuan Resign</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pengajuan</label>
                    <p className="text-gray-900">{detailData.tanggal_pengajuan}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      detailData.status === 'Disetujui' ? 'bg-green-100 text-green-800' :
                      detailData.status === 'Proses' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {detailData.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Keluar</label>
                  <p className="text-gray-900">{detailData.tanggal_keluar}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alasan</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{detailData.alasan}</p>
                  </div>
                </div>
                
                {detailData.isDokument === 1 && detailData.dokument_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dokumen Pendukung</label>
                    <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg">
                      <FileText className="text-blue-600" size={24} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">File Dokumen</p>
                        <p className="text-xs text-gray-600">{detailData.dokument}</p>
                      </div>
                      <a 
                        href={detailData.dokument_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Lihat File
                      </a>
                    </div>
                  </div>
                )}

                {detailData.isDokument === 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">Tidak ada dokumen pendukung yang dilampirkan</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

    </LayoutTemplate>
  );
};

export default Dokumen;