import { useState } from 'react';
import { router } from '@inertiajs/react';

const ModalResign = ({ onClose }) => {
  const [formData, setFormData] = useState({
    tanggal_keluar: '',
    alasan: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = () => {
    // Validation
    const newErrors = {};
    if (!formData.tanggal_keluar) {
      newErrors.tanggal_keluar = 'Tanggal keluar harus diisi';
    }
    if (!formData.alasan) {
      newErrors.alasan = 'Alasan keluar harus diisi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // Langsung POST ke server
    router.post('/dokumen/resign', formData, {
      onSuccess: () => {
        alert('Pengajuan resign berhasil diajukan!');
        onClose();
      },
      onError: (errors) => {
        setIsSubmitting(false);
        // Set errors dari server jika ada
        if (errors) {
          setErrors(errors);
        } else {
          alert('Terjadi kesalahan saat mengajukan resign');
        }
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="px-6 py-2">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Keluar <span className="text-red-500">*</span>
          </label>
          <input 
            type="date" 
            name="tanggal_keluar"
            value={formData.tanggal_keluar}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full px-4 py-2 border ${errors.tanggal_keluar ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {errors.tanggal_keluar && (
            <p className="text-red-500 text-sm mt-1">{errors.tanggal_keluar}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alasan Keluar <span className="text-red-500">*</span>
          </label>
          <textarea 
            name="alasan"
            value={formData.alasan}
            onChange={handleChange}
            disabled={isSubmitting}
            rows="4"
            placeholder="Tuliskan alasan resign Anda..."
            className={`w-full px-4 py-2 border ${errors.alasan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {errors.alasan && (
            <p className="text-red-500 text-sm mt-1">{errors.alasan}</p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Catatan:</strong> Pengajuan resign akan diproses dalam 3 hari kerja setelah diajukan.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
        <button 
          onClick={onClose} 
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Mengirim...
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </div>
  );
};

export default ModalResign;