import { useState ,useEffect} from "react";
import { useForm, router } from "@inertiajs/react";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { usePage } from '@inertiajs/react';

function Izin({ heads, perizinans }) {
  const [activeTab, setActiveTab] = useState('pengajuan');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIzin, setEditingIzin] = useState(null);
const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
const [printingIzin, setPrintingIzin] = useState(null);
  const { flash } = usePage().props;

  const { data, setData, post, processing, errors, reset } = useForm({
    type_perizinan: 'p1',
    tanggal: '',
    jam_keluar: '',
    jam_kembali: '',
    uid_diketahui: '',
    keperluan: ''
  });
    useEffect(() => {
    if (flash?.success) {
      // Tampilkan toast success (bisa pakai library seperti react-hot-toast)
      alert(flash.success); // Atau ganti dengan toast library
    }
    if (flash?.error) {
      alert(flash.error);
    }
  }, [flash]);

  

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('izin.store'), {
      onSuccess: () => {
        reset();
        setActiveTab('tracking');
      }
    });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Diajukan':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Disetujui':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Ditolak':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Diajukan': 'bg-yellow-100 text-yellow-800',
      'Disetujui': 'bg-green-100 text-green-800',
      'Ditolak': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'p1': 'Full Day',
      'p2': 'Setengah Hari',
      'p3': 'Keluar Kantor'
    };
    return labels[type] || type;
  };

  const handleEdit = (izin) => {
  setEditingIzin(izin);
  setEditData({
    type_perizinan: izin.type_perizinan,
    tanggal: izin.tanggal,
    jam_keluar: (izin.jam_keluar && izin.jam_keluar !== '00:00') ? izin.jam_keluar : '',
    jam_kembali: (izin.jam_kembali && izin.jam_kembali !== '00:00') ? izin.jam_kembali : '',
    uid_diketahui: izin.uid_diketahui,
    keperluan: izin.keperluan
  });
  setIsEditModalOpen(true);
};

const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors } = useForm({
  type_perizinan: '',
  tanggal: '',
  jam_keluar: '',
  jam_kembali: '',
  uid_diketahui: '',
  keperluan: ''
});


// Fungsi untuk submit edit
const handleEditSubmit = (e) => {
  e.preventDefault();
  
  // Prepare data - filter out empty time fields
  const submitData = {
    type_perizinan: editData.type_perizinan,
    tanggal: editData.tanggal,
    uid_diketahui: editData.uid_diketahui,
    keperluan: editData.keperluan,
  };

  // Hanya tambahkan jam jika bukan P1 DAN field tidak kosong
  if (editData.type_perizinan !== 'p1') {
    if (editData.jam_keluar && editData.jam_keluar.trim() !== '') {
      submitData.jam_keluar = editData.jam_keluar;
    }
    if (editData.jam_kembali && editData.jam_kembali.trim() !== '') {
      submitData.jam_kembali = editData.jam_kembali;
    }
  }

  // Gunakan put dengan data yang sudah difilter
  put(route('izin.update', editingIzin.id), {
    data: submitData,
    preserveScroll: true,
    onSuccess: () => {
      setIsEditModalOpen(false);
      setEditingIzin(null);
      router.reload({ only: ['perizinans'] });
    },
    onError: (errors) => {
      console.error('Error updating:', errors);
    }
  });
};
// Fungsi untuk membuka modal print
const handlePrint = (izin) => {
  // Langsung download PDF tanpa modal
  window.location.href = route('izin.pdf', izin.id);
};


// Fungsi untuk print dokumen
const handlePrintDocument = () => {
  window.print();
};

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

const handleDelete = (id) => {
  if (confirm('Yakin ingin membatalkan pengajuan ini?')) {
    router.delete(route('izin.destroy', id), {
      onSuccess: () => {
        // Reload data setelah delete berhasil
        router.reload({ only: ['perizinans'] });
      }
    });
  }
};

  // Show time fields only for P2 and P3
  const showTimeFields = data.type_perizinan === 'p2' || data.type_perizinan === 'p3';

  return (
    <LayoutTemplate>
      {/* Modal Edit */}
{isEditModalOpen && editingIzin && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Pengajuan Izin</h2>
          <button
            onClick={() => setIsEditModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleEditSubmit}>
          {/* Type Perizinan */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Perizinan <span className="text-red-500">*</span>
            </label>
            <select
              value={editData.type_perizinan}
              onChange={(e) => {
                const newType = e.target.value;
                setEditData({
                  ...editData,
                  type_perizinan: newType,
                  // Reset jam jika pindah ke P1
                  jam_keluar: newType === 'p1' ? '' : editData.jam_keluar,
                  jam_kembali: newType === 'p1' ? '' : editData.jam_kembali
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="p1">Izin Full Day (P1)</option>
              <option value="p2">Izin Setengah Hari (P2)</option>
              <option value="p3">Izin Keluar Kantor Sementara (P3)</option>
            </select>
            {editErrors.type_perizinan && (
              <p className="text-red-500 text-xs mt-1">{editErrors.type_perizinan}</p>
            )}
          </div>

          {/* Tanggal */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={editData.tanggal}
              onChange={(e) => setEditData('tanggal', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            {editErrors.tanggal && (
              <p className="text-red-500 text-xs mt-1">{editErrors.tanggal}</p>
            )}
          </div>

          {/* Jam Keluar & Kembali - Show for P2 and P3 only */}
          {(editData.type_perizinan === 'p2' || editData.type_perizinan === 'p3') && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Keluar <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={editData.jam_keluar}
                  onChange={(e) => setEditData('jam_keluar', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Kembali <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={editData.jam_kembali}
                  onChange={(e) => setEditData('jam_kembali', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Diketahui Oleh */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diketahui Oleh (Head) <span className="text-red-500">*</span>
            </label>
            <select
              value={editData.uid_diketahui}
              onChange={(e) => setEditData('uid_diketahui', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih Head</option>
              {heads && heads.map((head) => (
                <option key={head.id} value={head.id}>
                  {head.name} - {head.jabatan || 'Head'}
                </option>
              ))}
            </select>
            {editErrors.uid_diketahui && (
              <p className="text-red-500 text-xs mt-1">{editErrors.uid_diketahui}</p>
            )}
          </div>

          {/* Keperluan */}
          <div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Keperluan <span className="text-red-500">*</span>
  </label>
  <textarea
    value={editData.keperluan}
    onChange={(e) => setEditData('keperluan', e.target.value)}
    rows="4"
    placeholder="Jelaskan keperluan izin Anda..."
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
    required
  />
  {editErrors.keperluan && (
    <p className="text-red-500 text-xs mt-1">{editErrors.keperluan}</p>
  )}
</div>


          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {editProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
 <div className="">
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pengajuan')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pengajuan'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5 inline-block mr-2" />
              Pengajuan Izin
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tracking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-5 h-5 inline-block mr-2" />
              Tracking Pengajuan
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pengajuan' ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* Type Perizinan */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Perizinan <span className="text-red-500">*</span>
              </label>
              <select
                value={data.type_perizinan}
                onChange={(e) => setData('type_perizinan', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="p1">Izin Full Day (P1)</option>
                <option value="p2">Izin Setengah Hari (P2)</option>
                <option value="p3">Izin Keluar Kantor Sementara (P3)</option>
              </select>
              {errors.type_perizinan && (
                <p className="text-red-500 text-xs mt-1">{errors.type_perizinan}</p>
              )}
            </div>

            {/* Tanggal */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={data.tanggal}
                onChange={(e) => setData('tanggal', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {errors.tanggal && (
                <p className="text-red-500 text-xs mt-1">{errors.tanggal}</p>
              )}
            </div>

            {/* Info for P1 */}
            {data.type_perizinan === 'p1' && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Info:</span> Untuk izin Full Day, Anda akan tidak masuk kerja seharian.
                </p>
              </div>
            )}

            {/* Jam Keluar & Kembali - Show for P2 and P3 only */}
            {showTimeFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Keluar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={data.jam_keluar}
                    onChange={(e) => setData('jam_keluar', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.jam_keluar && (
                    <p className="text-red-500 text-xs mt-1">{errors.jam_keluar}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Kembali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={data.jam_kembali}
                    onChange={(e) => setData('jam_kembali', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.jam_kembali && (
                    <p className="text-red-500 text-xs mt-1">{errors.jam_kembali}</p>
                  )}
                </div>
              </div>
            )}

            {/* Diketahui Oleh */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diketahui Oleh (Head) <span className="text-red-500">*</span>
              </label>
              <select
                value={data.uid_diketahui}
                onChange={(e) => setData('uid_diketahui', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Pilih Head</option>
                {heads && heads.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.name} - {head.jabatan || 'Head'}
                  </option>
                ))}
              </select>
              {errors.uid_diketahui && (
                <p className="text-red-500 text-xs mt-1">{errors.uid_diketahui}</p>
              )}
            </div>

            {/* Keperluan */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keperluan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={data.keperluan}
                onChange={(e) => setData('keperluan', e.target.value)}
                rows="4"
                placeholder="Jelaskan keperluan izin Anda..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
              {errors.keperluan && (
                <p className="text-red-500 text-xs mt-1">{errors.keperluan}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Mengajukan...' : 'Ajukan Izin'}
              </button>
            </div>
          </form>
        </div>
      ) : (
          <div className="bg-white rounded-lg shadow-md">
    {perizinans && perizinans.data && perizinans.data.length > 0 ? (
      <div className="divide-y divide-gray-200">
        {perizinans.data.map((izin) => (
          <div key={izin.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(izin.status)}
                  <h3 className="text-xl font-bold text-gray-800">
                    {getTypeLabel(izin.type_perizinan)}
                  </h3>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusBadge(izin.status)}`}>
                    {izin.status}
                  </span>
                </div>
                
                {/* Info Dasar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Tanggal:</span>
                      <span className="text-gray-600">{formatDate(izin.tanggal)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Diketahui:</span>
                      <span className="text-gray-600">{izin.diketahui_oleh?.name || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Diketahui:</span>
                      <span className="text-gray-600">{izin.diketahui_oleh?.name || '-'}</span>
                    </div>

                    
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-700 min-w-[120px]">Keperluan:</span>
                      <span className="text-gray-600">{izin.keperluan}</span>
                    </div>
                   
                  </div>

                  <div className="space-y-3">
                    {izin.jam_keluar !== '00:00' && izin.jam_kembali !== '00:00' && (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-700 min-w-[120px]">Waktu:</span>
                        <span className="text-gray-600">{izin.jam_keluar} - {izin.jam_kembali}</span>
                      </div>
                    )}
                    
                    
                    {izin.disetujui_oleh && (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-700 min-w-[120px]">Disetujui:</span>
                        <span className="text-gray-600">{izin.disetujui_oleh.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Detail Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Status Diketahui */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-700">Status Diketahui (Head):</span>
                    </div>
                    {izin.status_diketahui ? (
                      <div className="flex items-center gap-2">
                        {izin.status_diketahui === 'Disetujui' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          izin.status_diketahui === 'Disetujui' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {izin.status_diketahui}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Menunggu Persetujuan
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Disetujui */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-700">Status Disetujui (HRD):</span>
                    </div>
                    {izin.status_disetujui ? (
                      <div className="flex items-center gap-2">
                        {izin.status_disetujui === 'Disetujui' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          izin.status_disetujui === 'Disetujui' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {izin.status_disetujui}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Menunggu Persetujuan
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Catatan (jika ada) */}
                {izin.catatan && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold text-amber-800 block mb-1">Catatan:</span>
                        <p className="text-amber-700">{izin.catatan}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons - Dipindah ke bawah */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
              {izin.status === 'Diajukan' && (
                <>
                  <button
                    onClick={() => handleEdit(izin)}
                    className="flex-1 min-w-[140px] px-6 py-3 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(izin.id)}
                    className="flex-1 min-w-[140px] px-6 py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Batalkan
                    </span>
                  </button>
                </>
              )}
              <button
                onClick={() => handlePrint(izin)}
                className="flex-1 min-w-[140px] px-6 py-3 text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Dokumen
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-12 text-center">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Pengajuan</h3>
        <p className="text-gray-500">Anda belum memiliki pengajuan izin</p>
      </div>
    )}
  </div>

      )}
    </div>
    </LayoutTemplate>
   
  );
}

export default Izin;