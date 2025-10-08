import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { Pencil, Trash2, Plus, X, Upload, Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';


function Pegawai({ flash }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [users, setUsers] = useState({ data: [], links: [], total: 0, from: 0, to: 0, last_page: 1 });
const [divisiList, setDivisiList] = useState([]);
const [jabatanList, setJabatanList] = useState([]);
const [loading, setLoading] = useState(false);


  
  // Search & Filter State
const [searchTerm, setSearchTerm] = useState('');
const [selectedDivisi, setSelectedDivisi] = useState('');
const [selectedJabatan, setSelectedJabatan] = useState('');
const [selectedTower, setSelectedTower] = useState('');
const [currentPage, setCurrentPage] = useState(1);
  
useEffect(() => {
  fetchData(currentPage);
  
  const interval = setInterval(() => {
    fetchData(currentPage);
  }, 30000); // Refresh every 30 seconds
  
  return () => clearInterval(interval);
}, []);

  const [formData, setFormData] = useState({
  id: '',  // ✅ TAMBAHKAN INI
  name: '',
  email: '',
  password: '',
  role: 'pegawai',
  active: true,
  tmk: '',
  divisi: '',
  jabatan: '',
  tower: '',
  keterangan: '',
  ttd: null
});
  const [ttdPreview, setTtdPreview] = useState(null);
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchTerm !== '' || selectedDivisi || selectedJabatan || selectedTower) {
      fetchData(1);
    } else {
      fetchData(currentPage);
    }
  }, 500);
  
  return () => clearTimeout(timer);
}, [searchTerm]);

const handleFilter = () => {
  fetchData(1);
};

const handleFilterChange = (filterFn) => {
  filterFn();
  setTimeout(() => fetchData(1), 100);
};
const fetchData = async (page = 1) => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedDivisi) params.append('divisi', selectedDivisi);
    if (selectedJabatan) params.append('jabatan', selectedJabatan);
    if (selectedTower) params.append('tower', selectedTower);
    params.append('page', page);

    const response = await fetch(`/api/pegawai?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const data = await response.json();
    setUsers(data.users);
    setDivisiList(data.divisiList || []);
    setJabatanList(data.jabatanList || []);
    setCurrentPage(page);
  } catch (error) {
    console.error('Error fetching data:', error);
    alert('Gagal memuat data. Silakan refresh halaman.');
  } finally {
    setLoading(false);
  }
};

  const resetFilters = () => {
  setSearchTerm('');
  setSelectedDivisi('');
  setSelectedJabatan('');
  setSelectedTower('');
  setTimeout(() => fetchData(1), 100);
};

  const resetForm = () => {
    setFormData({
      id: '',  
      name: '',
      email: '',
      password: '',
      role: 'pegawai',
      active: true,
      tmk: '',
      divisi: '',
      jabatan: '',
      tower: '',
      keterangan: '',
      ttd: null
    });
    setTtdPreview(null);
    setIsEditing(false);
    setCurrentUser(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      active: user.active,
      tmk: user.tmk || '',
      divisi: user.divisi || '',
      jabatan: user.jabatan || '',
      tower: user.tower || '',
      keterangan: user.keterangan || '',
      ttd: null
    });
    setTtdPreview(user.ttd ? `/storage/ttd/${user.ttd}` : null);
    setCurrentUser(user);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  const submitData = new FormData();
  Object.keys(formData).forEach(key => {
    if (key === 'ttd' && formData[key]) {
      submitData.append('ttd', formData[key]);
    } else if (key === 'active') {
      submitData.append('active', formData[key] ? '1' : '0');
    } else if (formData[key] !== null && formData[key] !== '') {
      submitData.append(key, formData[key]);
    }
  });

  if (isEditing) {
    submitData.append('_method', 'PUT');
    router.post(`/pegawai/${currentUser.id}`, submitData, {
      onSuccess: () => {
        closeModal();
        fetchData(currentPage); 
      },
      onError: (errors) => {
        const errorMessages = Object.values(errors).flat().join('\n');
        alert('Validasi Gagal:\n\n' + errorMessages);
      },
      forceFormData: true
    });
  } else {
    router.post('/pegawai', submitData, {
      onSuccess: () => {
        closeModal();
        fetchData(1); // ✅ TAMBAHKAN INI
      },
      onError: (errors) => {
        const errorMessages = Object.values(errors).flat().join('\n');
        alert('Validasi Gagal:\n\n' + errorMessages);
      },
      forceFormData: true
    });
  }
};

  const handleDelete = (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
    router.delete(`/pegawai/${id}`, {
      onSuccess: () => {
        fetchData(currentPage); 
      }
    });
  }
};

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2048000) {
        alert('Ukuran file maksimal 2MB');
        e.target.value = '';
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar');
        e.target.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, ttd: file }));
      setTtdPreview(URL.createObjectURL(file));
    }
  };

  const handlePageChange = (page) => {
  fetchData(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
  const removeTtd = () => {
    setFormData(prev => ({ ...prev, ttd: null }));
    setTtdPreview(null);
  };

  const userData = users.data || [];
  const activeFilters = [searchTerm, selectedDivisi, selectedJabatan, selectedTower].filter(Boolean).length;

  return (
    <LayoutTemplate>
        <Head title="Pegawai" />
      
      <div className="">
       <div className="mb-6 flex justify-between items-center">
  <div className="flex items-center gap-4">
    <h1 className="text-2xl font-bold text-gray-800">Data Pegawai</h1>
    {/* ✅ TAMBAHKAN INI */}
    <button
      onClick={() => fetchData(currentPage)}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
      title="Refresh data"
    >
      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
      Refresh
    </button>
  </div>
  <button
    onClick={openAddModal}
    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
  >
    <Plus size={20} />
    Tambah Pegawai
  </button>
</div>

        {flash?.success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {flash.success}
          </div>
        )}

        {flash?.error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {flash.error}
          </div>
        )}

        {/* Search & Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition relative"
            >
              <Filter size={20} />
              Filter
              {activeFilters > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Filter Dropdown */}
          {isFilterOpen && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
<select
  value={selectedDivisi}
  onChange={(e) => handleFilterChange(() => setSelectedDivisi(e.target.value))}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="">Semua Divisi</option>
  {divisiList.map((divisi, idx) => (
    <option key={idx} value={divisi}>{divisi}</option>
  ))}
</select>

<select
  value={selectedJabatan}
  onChange={(e) => handleFilterChange(() => setSelectedJabatan(e.target.value))}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="">Semua Jabatan</option>
  {jabatanList.map((jabatan, idx) => (
    <option key={idx} value={jabatan}>{jabatan}</option>
  ))}
</select>
<select
  value={selectedTower}
  onChange={(e) => handleFilterChange(() => setSelectedTower(e.target.value))}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="">Semua Tower</option>
  <option value="Eiffel">Eiffel</option>
  <option value="Liberty">Liberty</option>
</select>

              {activeFilters > 0 && (
                <div className="md:col-span-3 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading && (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
      <RefreshCw className="animate-spin text-blue-600" size={32} />
    </div>
  )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TMK</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divisi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tower</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userData.length > 0 ? userData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.tmk || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.divisi || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.jabatan || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.tower === 'Eiffel' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {user.tower || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      {activeFilters > 0 ? 'Tidak ada data sesuai filter' : 'Belum ada data pegawai'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {/* Pagination */}
{users.last_page > 1 && (
  <div className="px-6 py-4 border-t flex items-center justify-between">
    <div className="text-sm text-gray-700">
      Menampilkan {users.from || 0} - {users.to || 0} dari {users.total} data
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ChevronLeft size={16} />
      </button>
      
      {Array.from({ length: users.last_page }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            currentPage === page
              ? 'bg-blue-600 text-white cursor-default'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === users.last_page}
        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
          currentPage === users.last_page
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
)}
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditing ? 'Edit Pegawai' : 'Tambah Pegawai'}
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Pegawai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 101, 102, 103..."
                      disabled={isEditing} // <-- Tambahkan ini
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isEditing ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Masukkan ID unik untuk pegawai (angka)
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {isEditing ? '(Kosongkan jika tidak ingin mengubah)' : <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pegawai">Pegawai</option>
                      <option value="hrd">HRD</option>
                      <option value="head">Head</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TMK(Tanggal Mulai Kerja)
                    </label>
                    <input
                      type="date"
                      name="tmk"
                      value={formData.tmk}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Divisi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="divisi"
                      value={formData.divisi}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jabatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="jabatan"
                      value={formData.jabatan}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tower <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tower"
                      value={formData.tower}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Tower --</option>
                      <option value="Eiffel">Eiffel</option>
                      <option value="Liberty">Liberty</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                    <textarea
                      name="keterangan"
                      value={formData.keterangan}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanda Tangan Digital
                    </label>
                    
                    {ttdPreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={ttdPreview} 
                          alt="TTD Preview" 
                          className="w-48 h-32 object-contain border-2 border-gray-300 rounded-lg bg-gray-50 p-2"
                        />
                        <button
                          type="button"
                          onClick={removeTtd}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                          <Upload size={18} />
                          <span className="text-sm">Upload TTD</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs text-gray-500">Max 2MB (JPG, PNG)</span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Status Aktif</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {isEditing ? 'Update' : 'Simpan'}
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

export default Pegawai;