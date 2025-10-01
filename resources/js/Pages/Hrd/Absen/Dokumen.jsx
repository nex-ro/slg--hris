import { useState } from "react";
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { Download, Calendar, FileText } from "lucide-react";

function Dokumen() {
  const [activeTab, setActiveTab] = useState("absensi");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [customDate, setCustomDate] = useState({
    start: "",
    end: ""
  });

  // Function untuk download file hari ini
  const handleDownloadToday = (fileType) => {
    console.log(`Download ${fileType} - Hari Ini`);
    console.log("Tanggal:", new Date().toLocaleDateString('id-ID'));
  };

  // Function untuk download file bulanan
  const handleDownloadMonthly = (fileType) => {
    console.log(`Download ${fileType} - Bulanan`);
    console.log("Bulan:", new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
  };

  // Function untuk download file custom
  const handleDownloadCustom = (fileType) => {
    if (!customDate.start || !customDate.end) {
      console.log("Error: Tanggal mulai dan tanggal akhir harus diisi");
      alert("Mohon isi tanggal mulai dan tanggal akhir");
      return;
    }
    console.log(`Download ${fileType} - Custom Period`);
    console.log("Dari:", customDate.start);
    console.log("Sampai:", customDate.end);
  };

  // Function untuk handle perubahan tanggal custom
  const handleCustomDateChange = (field, value) => {
    setCustomDate(prev => ({
      ...prev,
      [field]: value
    }));
    console.log(`Custom Date ${field} changed:`, value);
  };

  // Function untuk reset custom date
  const handleResetCustomDate = () => {
    setCustomDate({
      start: "",
      end: ""
    });
    console.log("Custom date reset");
  };

  return (
    <LayoutTemplate>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dokumen</h1>
          <p className="text-gray-600">Download file absensi dan katering berdasarkan periode</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("absensi")}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === "absensi"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="inline-block w-5 h-5 mr-2" />
            File Absensi
          </button>
          <button
            onClick={() => setActiveTab("katering")}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === "katering"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="inline-block w-5 h-5 mr-2" />
            File Katering
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Download File {activeTab === "absensi" ? "Absensi" : "Katering"}
          </h2>

          {/* Period Selection */}
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
              onClick={() => setSelectedPeriod("monthly")}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedPeriod === "monthly"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold text-gray-800">Bulanan</p>
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

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const fileType = activeTab === "absensi" ? "Absensi" : "Katering";
                if (selectedPeriod === "today") {
                  handleDownloadToday(fileType);
                } else if (selectedPeriod === "monthly") {
                  handleDownloadMonthly(fileType);
                } else if (selectedPeriod === "custom") {
                  handleDownloadCustom(fileType);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download File {activeTab === "absensi" ? "Absensi" : "Katering"}
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
    </LayoutTemplate>
  );
}

export default Dokumen;