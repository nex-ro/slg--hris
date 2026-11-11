import { useState } from "react";
import { Download, Calendar, FileText } from "lucide-react";
import { Head, usePage } from "@inertiajs/react";
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Dokumen() {
  const [activeTab, setActiveTab] = useState("absensi");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [customDate, setCustomDate] = useState({ start: "", end: "" });
  const [selectedTower, setSelectedTower] = useState("");
const [downloadLoading, setDownloadLoading] = useState(false);
const [loadingOverlay, setLoadingOverlay] = useState(false); 
  const towers = ["Eiffel", "Liberty"];

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 2 }, (_, i) => (currentYear - i).toString());

  // Function untuk download hari ini (khusus katering)
  const handleDownloadToday = (fileType) => {
  };
  // Fungsi untuk mendapatkan CSRF token fresh
const fetchFreshCsrfToken = async () => {
  try {
    const response = await fetch(window.location.href, {
      method: 'GET',
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      if (newToken) {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
          metaTag.setAttribute('content', newToken);
        }
        return newToken;
      }
    }
  } catch (error) {
    console.error('Error fetching fresh CSRF token:', error);
  }
  return null;
};

const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};
const downloadFileWithRetry = async (url) => {
  setDownloadLoading(true);
  setLoadingOverlay(true);
  try {
    let csrfToken = getCsrfToken();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    });

    // Jika error 419, fetch token baru dan retry
    if (response.status === 419) {
      const newToken = await fetchFreshCsrfToken();
      
      if (!newToken) {
        toast.error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.', {
          position: "top-right",
          autoClose: 4000,
        });
        throw new Error('Gagal mendapatkan CSRF token baru. Silakan refresh halaman.');
      }

      // Retry dengan token baru
      const retryResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'X-CSRF-TOKEN': newToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }

      // Redirect ke URL download
      window.location.href = url;
      toast.success('File berhasil diunduh!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Redirect ke URL download
    window.location.href = url;
    toast.success('File berhasil diunduh!', {
      position: "top-right",
      autoClose: 3000,
    });
    
  } catch (error) {
    console.error('Error downloading file:', error);
    if (error.message.includes('419') || error.message.includes('CSRF')) {
      toast.error('Session Anda telah berakhir. Halaman akan di-refresh untuk memperbarui session.', {
        position: "top-right",
        autoClose: 4000,
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      toast.error(`Error: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    }
  } finally {
    setDownloadLoading(false);
    setLoadingOverlay(false);
  }
};

const handleDownloadPerTower = async (fileType) => {
  if (!selectedMonth) {
    toast.error("Mohon pilih bulan terlebih dahulu", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }
  if (!selectedYear) {
    toast.error("Mohon pilih tahun terlebih dahulu", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }

  const bulan = getMonthNumber(selectedMonth);
  const tahun = selectedYear;

  if (fileType === "Absensi") {
    await downloadFileWithRetry(`/absensi/export-tower-divisi?bulan=${bulan}&tahun=${tahun}`);
  }
};


  const getMonthNumber = (monthName) => {
    const monthIndex = months.indexOf(monthName);
    return monthIndex + 1;
  };

const handleDownloadMonthly = async (fileType) => {
  if (!selectedMonth) {
    toast.error("Mohon pilih bulan terlebih dahulu", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }
  if (!selectedYear) {
    toast.error("Mohon pilih tahun terlebih dahulu", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }
  if (!selectedTower) {
    toast.error("Mohon pilih tower terlebih dahulu", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }

  const bulan = getMonthNumber(selectedMonth);
  const tahun = selectedYear;

  if (fileType === "Absensi") {
    await downloadFileWithRetry(`/kehadiran/print-monthly?bulan=${bulan}&tahun=${tahun}&tower=${selectedTower}`);
  }
};


const handleDownloadRekapAll = async (fileType) => {
  if (!selectedMonth) {
    toast.error("Mohon pilih bulan terlebih dahulu", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }
  if (!selectedYear) {
    toast.error("Mohon pilih tahun terlebih dahulu", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }

  if (fileType === "Absensi") {
    const bulan = getMonthNumber(selectedMonth);
    const tahun = selectedYear;
    await downloadFileWithRetry(`/kehadiran/print-rekapall?bulan=${bulan}&tahun=${tahun}`);
  }
};

const handleDownloadCustom = async (fileType) => {
  if (!customDate.start || !customDate.end) {
    toast.error("Mohon isi tanggal mulai dan tanggal akhir", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }
  if (!selectedTower) {
    toast.error("Mohon pilih tower terlebih dahulu", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }
  
  const startDate = new Date(customDate.start);
  const endDate = new Date(customDate.end);
  if (endDate < startDate) {
    toast.error("Tanggal akhir harus setelah atau sama dengan tanggal mulai", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }

  if (fileType === "Absensi") {
    const tanggalMulai = customDate.start;
    const tanggalAkhir = customDate.end;
    await downloadFileWithRetry(`/kehadiran/print-custom?tanggal_mulai=${tanggalMulai}&tanggal_akhir=${tanggalAkhir}&tower=${selectedTower}`);
  } else {
    toast.info("Katering custom belum tersedia", {
      position: "top-right",
      autoClose: 3000,
    });
  }
};


  const handleCustomDateChange = (field, value) => {
    setCustomDate(prev => ({ ...prev, [field]: value }));
  };

  const handleResetCustomDate = () => {
    setCustomDate({ start: "", end: "" });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "katering") {
      setSelectedPeriod("today");
    } else {
      setSelectedPeriod("monthly");
    }
    setSelectedMonth("");
    setSelectedYear(new Date().getFullYear().toString());
    setCustomDate({ start: "", end: "" });
  };

  return (
    <LayoutTemplate>
                    <Head title="Dokumen" />

    <div className="">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dokumen</h1>
          <p className="text-gray-600">Download file absensi dan katering berdasarkan periode</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => handleTabChange("absensi")}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === "absensi"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="inline-block w-5 h-5 mr-2" />
            File Absensi
          </button>
          {/* <button
            onClick={() => handleTabChange("katering")}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === "katering"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="inline-block w-5 h-5 mr-2" />
            File Katering
          </button> */}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Download File {activeTab === "absensi" ? "Absensi" : "Katering"}
          </h2>

          {/* Period Selection for ABSENSI */}
          {activeTab === "absensi" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => {
                  setSelectedPeriod("monthly");
                  setSelectedMonth("");
                  setSelectedYear(new Date().getFullYear().toString());
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === "monthly"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-800">Bulan Ini</p>
                <p className="text-sm text-gray-500 mt-1">Pilih tahun & bulan</p>
              </button>

              <button
                onClick={() => {
                  setSelectedPeriod("pertower");
                  setSelectedMonth("");
                  setSelectedYear(new Date().getFullYear().toString());
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === "pertower"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-800">Per Divisi</p>
                <p className="text-sm text-gray-500 mt-1">Pilih tahun & bulan</p>
              </button>

              <button
                onClick={() => {
                  setSelectedPeriod("rekapall");
                  setSelectedMonth("");
                  setSelectedYear(new Date().getFullYear().toString());
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === "rekapall"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-800">Rekap All</p>
                <p className="text-sm text-gray-500 mt-1">Pilih tahun & bulan</p>
              </button>

              <button
                onClick={() => {
                  setSelectedPeriod("custom");
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === "custom"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-800">Custom</p>
                <p className="text-sm text-gray-500 mt-1">Pilih periode sendiri</p>
              </button>
            </div>
          )}

          {/* Period Selection for KATERING */}
          {activeTab === "katering" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setSelectedPeriod("today")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === "today"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-800">Hari Ini</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString('id-ID')}
                </p>
              </button>

              <button
                onClick={() => {
                  setSelectedPeriod("monthly");
                  setSelectedMonth("");
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === "monthly"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-800">Bulan Ini</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
              </button>

              <button
                onClick={() => setSelectedPeriod("custom")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === "custom"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-800">Custom</p>
                <p className="text-sm text-gray-500 mt-1">Pilih periode sendiri</p>
              </button>
            </div>
          )}

          {/* Year & Month Selection */}
          {activeTab === "absensi" && (selectedPeriod === "monthly" || selectedPeriod === "pertower" || selectedPeriod === "rekapall") && (
            <>
              {/* Year Selection */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-semibold text-gray-700 mb-3">Pilih Tahun</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`py-2 px-4 rounded-lg border-2 transition-all ${
                        selectedYear === year
                          ? "border-blue-500 bg-blue-100 text-blue-700 font-semibold"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                {selectedYear && (
                  <p className="mt-3 text-sm text-gray-600">
                    Tahun terpilih: <strong>{selectedYear}</strong>
                  </p>
                )}
              </div>

              {/* Month Selection */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="font-semibold text-gray-700 mb-3">Pilih Bulan</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {months.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMonth(month)}
                      className={`py-2 px-4 rounded-lg border-2 transition-all ${
                        selectedMonth === month
                          ? "border-blue-500 bg-blue-100 text-blue-700 font-semibold"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
                {selectedMonth && (
                  <p className="mt-3 text-sm text-gray-600">
                    Bulan terpilih: <strong>{selectedMonth} {selectedYear}</strong>
                  </p>
                )}
              </div>
            </>
          )}

          {/* Month Selection for Katering monthly */}
          {activeTab === "katering" && selectedPeriod === "monthly" && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-semibold text-gray-700 mb-3">Pilih Bulan</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {months.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMonth(month)}
                    className={`py-2 px-4 rounded-lg border-2 transition-all ${
                      selectedMonth === month
                        ? "border-blue-500 bg-blue-100 text-blue-700 font-semibold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
              {selectedMonth && (
                <p className="mt-3 text-sm text-gray-600">
                  Bulan terpilih: <strong>{selectedMonth}</strong>
                </p>
              )}
            </div>
          )}
               
          {/* Custom Date Range Picker */}
          {selectedPeriod === "custom" && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-semibold text-gray-700 mb-3">Pilih Rentang Tanggal</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={customDate.start}
                    onChange={(e) => handleCustomDateChange("start", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={customDate.end}
                    onChange={(e) => handleCustomDateChange("end", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleResetCustomDate}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset Tanggal
              </button>
            </div>
          )}
          {activeTab === "absensi" && (selectedPeriod === "custom" || selectedPeriod === "monthly")  && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-semibold text-gray-700 mb-3">Pilih Tower</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {towers.map((tower, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTower(tower)}
                    className={`py-3 px-4 rounded-lg border-2 transition-all text-left ${
                      selectedTower === tower
                        ? "border-blue-500 bg-blue-100 text-blue-700 font-semibold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {tower}
                  </button>
                ))}
              </div>
              {selectedTower && (
                <p className="mt-3 text-sm text-gray-600">
                  Tower terpilih: <strong>{selectedTower}</strong>
                </p>
              )}
            </div>
          )}

          {/* Download Button */}
          <div className="flex justify-center">
            <button
            onClick={() => {
              const fileType = activeTab === "absensi" ? "Absensi" : "Katering";
              if (selectedPeriod === "today") {
                handleDownloadToday(fileType);
              } else if (selectedPeriod === "pertower") {
                handleDownloadPerTower(fileType);
              } else if (selectedPeriod === "monthly") {
                handleDownloadMonthly(fileType);
              } else if (selectedPeriod === "rekapall") {
                handleDownloadRekapAll(fileType);
              } else if (selectedPeriod === "custom") {
                handleDownloadCustom(fileType);
              }
            }}
            disabled={downloadLoading}
            className={`font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg ${
              downloadLoading
                ? 'bg-blue-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {downloadLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download File {activeTab === "absensi" ? "Absensi" : "Katering"}</span>
              </>
            )}
          </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> File akan diunduh dalam format Excel (.xlsx). Pastikan Anda telah memilih periode yang sesuai sebelum mengunduh.
            </p>
          </div>
        </div>
      </div>
    </div>
      {loadingOverlay && (
      <div style={{margin:"0px" ,padding:"0px"}}className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div  className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 mb-1">Loading</p>
            <p className="text-sm text-gray-600">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    )}

    </LayoutTemplate>

  );
}

export default Dokumen;