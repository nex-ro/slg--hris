import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, X, Calculator } from 'lucide-react';
import LayoutTemplate from '@/Layouts/LayoutTemplate';

function Cuti({ jatahCuti, users, tahunList, filters = {} }) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedData, setSelectedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [selectedTahun, setSelectedTahun] = useState(filters?.tahun || '');
  
  const [formData, setFormData] = useState({
    uid: '',
    tahun_ke: '',
    tahun: new Date().getFullYear(),
    jumlah_cuti: '',
    keterangan: '',
    sisa_cuti: '',
    cuti_dipakai: ''
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    router.get(route('hrd.cuti.index'), { 
      search: value, 
      tahun: selectedTahun 
    }, { 
      preserveState: true 
    });
  };

  const handleTahunFilter = (value) => {
    setSelectedTahun(value);
    router.get(route('hrd.cuti.index'), { 
      search: searchTerm, 
      tahun: value 
    }, { 
      preserveState: true 
    });
  };

  const openModal = (type, data = null) => {
    setModalType(type);
    if (type === 'edit' && data) {
      setSelectedData(data);
      setFormData({
        uid: data.uid,
        tahun_ke: data.tahun_ke,
        tahun: data.tahun,
        jumlah_cuti: data.jumlah_cuti,
        keterangan: data.keterangan || '',
        sisa_cuti: data.sisa_cuti,
        cuti_dipakai: data.cuti_dipakai
      });
    } else {
      setFormData({
        uid: '',
        tahun_ke: '',
        tahun: new Date().getFullYear(),
        jumlah_cuti: '',
        keterangan: '',
        sisa_cuti: '',
        cuti_dipakai: '0'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedData(null);
  };

  const calculateCuti = async () => {
    if (!formData.uid || !formData.tahun) {
      alert('Pilih user dan tahun terlebih dahulu');
      return;
    }

    try {
      const response = await fetch(route('hrd.cuti.calculate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          uid: formData.uid,
          tahun: formData.tahun
        })
      });

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        tahun_ke: data.tahun_ke,
        jumlah_cuti: data.jumlah_cuti,
        sisa_cuti: data.jumlah_cuti,
        cuti_dipakai: 0
      }));
    } catch (error) {
      console.error('Error calculating cuti:', error);
    }
  };

  const handleSubmit = () => {
    if (modalType === 'create') {
      router.post(route('hrd.cuti.store'), formData, {
        onSuccess: () => closeModal()
      });
    } else {
      router.put(route('hrd.cuti.update', selectedData.id), formData, {
        onSuccess: () => closeModal()
      });
    }
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      router.delete(route('hrd.cuti.destroy', id));
    }
  };

  return (
    <LayoutTemplate>
        <div className="">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Manajemen Jatah Cuti</h1>
        <p className="text-gray-600">Kelola jatah cuti karyawan</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama karyawan..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedTahun}
            onChange={(e) => handleTahunFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Tahun</option>
            {tahunList.map((tahun) => (
              <option key={tahun} value={tahun}>{tahun}</option>
            ))}
          </select>

          <button
            onClick={() => openModal('create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Jatah Cuti
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Karyawan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun Ke</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jatah Cuti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuti Dipakai</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sisa Cuti</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jatahCuti.data.length > 0 ? (
                jatahCuti.data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {jatahCuti.from + index}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.user?.name}</div>
                      <div className="text-sm text-gray-500">{item.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tahun}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tahun_ke}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.jumlah_cuti} hari</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{item.cuti_dipakai} hari</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{item.sisa_cuti} hari</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.keterangan || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal('edit', item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data jatah cuti
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {jatahCuti.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan {jatahCuti.from} - {jatahCuti.to} dari {jatahCuti.total} data
            </div>
            <div className="flex gap-2">
              {jatahCuti.links.map((link, index) => (
                <button
                  key={index}
                  onClick={() => link.url && router.visit(link.url)}
                  disabled={!link.url}
                  className={`px-3 py-1 text-sm rounded ${
                    link.active
                      ? 'bg-blue-600 text-white'
                      : link.url
                      ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {modalType === 'create' ? 'Tambah Jatah Cuti' : 'Edit Jatah Cuti'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan</label>
                <select
                  value={formData.uid}
                  onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={modalType === 'edit'}
                >
                  <option value="">Pilih Karyawan</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - TMK: {user.tmk}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <input
                  type="number"
                  value={formData.tahun}
                  onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="2020"
                />
              </div>

              {modalType === 'create' && (
                <button
                  type="button"
                  onClick={calculateCuti}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  Hitung Otomatis
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ke</label>
                <input
                  type="number"
                  value={formData.tahun_ke}
                  onChange={(e) => setFormData({ ...formData, tahun_ke: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Cuti (hari)</label>
                <input
                  type="number"
                  value={formData.jumlah_cuti}
                  onChange={(e) => setFormData({ ...formData, jumlah_cuti: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              {modalType === 'edit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuti Dipakai (hari)</label>
                    <input
                      type="number"
                      value={formData.cuti_dipakai}
                      onChange={(e) => setFormData({ ...formData, cuti_dipakai: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sisa Cuti (hari)</label>
                    <input
                      type="number"
                      value={formData.sisa_cuti}
                      onChange={(e) => setFormData({ ...formData, sisa_cuti: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'create' ? 'Tambah' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </LayoutTemplate>
  );
}

export default Cuti;