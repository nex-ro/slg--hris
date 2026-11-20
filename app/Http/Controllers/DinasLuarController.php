<?php

namespace App\Http\Controllers;

use App\Models\SuratDinas;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Mail\SuratDinasDiajukan;
use App\Mail\StatusSuratDinasDiupdate;
use App\Models\KlaimDinas;
use App\Models\KlaimDinasItem;
use App\Services\KlaimDinasExcelService;
use App\Services\KlaimDinasExcelParser;
use App\Mail\KlaimDinasDiajukan;
use App\Mail\StatusKlaimDinasDiupdate;
use Illuminate\Support\Str;

class DinasLuarController extends Controller
{
    /**
     * Halaman Pengajuan Dinas Luar (Daftar Riwayat)
     */
    public function pengajuan(Request $request)
    {
        $user = Auth::user();
        $userRole = strtolower($user->role ?? '');

        // Ambil riwayat pengajuan surat dinas dengan relasi user dan approver
        $query = SuratDinas::with(['user', 'approver']);

        // Jika Pegawai: hanya tampilkan pengajuan miliknya sendiri
        if (in_array($userRole, ['pegawai', 'karyawan', 'employee', 'site'])) {
            $query->where('uid', $user->id);
        }
        // Jika Head / Atasan: tampilkan seluruh pengajuan dari divisinya (serta pengajuan miliknya sendiri)
        elseif (in_array($userRole, ['head', 'atasan'])) {
            $divisi = $user->divisi;
            $query->where(function ($q) use ($user, $divisi) {
                // Pengajuan milik user sendiri
                $q->where('uid', $user->id);
                
                // Atau pengajuan yang user pemiliknya berada di divisi yang sama
                if (!empty($divisi)) {
                    $q->orWhereHas('user', function ($sub) use ($divisi) {
                        $sub->where('divisi', $divisi);
                    });
                }
            });
        }
        // Jika HRD / Admin: tampilkan seluruh pengajuan tanpa batasan

        $pengajuanList = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('DinasLuar/Pengajuan', [
            'pengajuanList' => $pengajuanList,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Halaman Tambah Pengajuan Surat Perjalanan Dinas Baru
     */
    public function create()
    {
        $user = Auth::user();

        // Daftar atasan / user aktif untuk pilihan pemberi tugas
        $approvers = User::select('id', 'name', 'jabatan', 'email')
            ->where('active', 1)
            ->whereNull('tanggal_keluar')
            ->orderBy('name')
            ->get();

        return Inertia::render('DinasLuar/Create', [
            'approvers' => $approvers,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Simpan Pengajuan Surat Perjalanan Dinas
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'nama_lengkap' => 'required|string|max:255',
            'nomor_surat' => 'nullable|string|max:255',
            'jabatan' => 'required|string|in:Staff,Manager,Head,staff,manager,head',
            'pemberi_tugas' => 'nullable|string|max:255',
            'tanggal_berangkat' => 'required|date',
            'tanggal_kembali' => 'nullable|date',
            'keterangan_kembali' => 'nullable|string|max:255',
            'tujuan' => 'required|string|max:255',
            'keperluan' => 'required|string|max:1000',
            'transportasi' => 'required|string|max:255',
            'ajukan_advance' => 'boolean',
            'panjar_nominal' => 'nullable|string|max:255',
            'panjar_terbilang' => 'nullable|string|max:255',
            'nama_rekening' => 'nullable|string|max:255',
            'nomor_rekening' => 'nullable|string|max:255',
            'nama_bank' => 'nullable|string|max:255',
        ], [
            'email.required' => 'Email wajib diisi',
            'nama_lengkap.required' => 'Nama lengkap wajib diisi',
            'jabatan.required' => 'Jabatan wajib dipilih (Staff, Manager, atau Head)',
            'jabatan.in' => 'Jabatan harus salah satu dari: Staff, Manager, atau Head',
            'tanggal_berangkat.required' => 'Tanggal berangkat wajib diisi',
            'tujuan.required' => 'Tujuan perjalanan dinas wajib diisi',
            'keperluan.required' => 'Keperluan perjalanan dinas wajib diisi',
            'transportasi.required' => 'Moda transportasi wajib diisi',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        $ajukanAdvance = $request->boolean('ajukan_advance');

        // Jika nomor surat tidak diisi oleh pemohon, berikan nomor sementara (Draft)
        $nomorSurat = !empty(trim($validated['nomor_surat'] ?? '')) ? trim($validated['nomor_surat']) : 'Menunggu Penetapan HRD';

        $suratDinas = SuratDinas::create([
            'uid' => $user ? $user->id : null,
            'email' => $validated['email'],
            'nama_lengkap' => $validated['nama_lengkap'],
            'nomor_surat' => $nomorSurat,
            'jabatan' => ucfirst(strtolower($validated['jabatan'] ?? ($user ? $user->jabatan : 'Staff'))),
            'pemberi_tugas' => $validated['pemberi_tugas'] ?? '-',
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'] ?? null,
            'keterangan_kembali' => $validated['keterangan_kembali'] ?? null,
            'tujuan' => $validated['tujuan'],
            'keperluan' => $validated['keperluan'],
            'transportasi' => $validated['transportasi'],
            'ajukan_advance' => $ajukanAdvance,
            'panjar_nominal' => $ajukanAdvance ? ($validated['panjar_nominal'] ?: '-') : '-',
            'panjar_terbilang' => $ajukanAdvance ? ($validated['panjar_terbilang'] ?: '-') : '-',
            'nama_rekening' => $ajukanAdvance ? ($validated['nama_rekening'] ?: '-') : '-',
            'nomor_rekening' => $ajukanAdvance ? ($validated['nomor_rekening'] ?: '-') : '-',
            'nama_bank' => $ajukanAdvance ? ($validated['nama_bank'] ?: '-') : '-',
            'status' => 'Diajukan',
        ]);

        // Kirim email notifikasi ke seluruh HRD yang aktif
        $this->queueNotificationToAllHrd($suratDinas);

        if (Auth::check()) {
            return redirect()->route('dinas-luar.pengajuan')->with('success', 'Pengajuan Surat Perjalanan Dinas berhasil dikirim!');
        }

        return redirect()->back()->with('success', 'Pengajuan Surat Perjalanan Dinas Anda telah berhasil dikirim! Silakan konfirmasi ke HRD.');
    }

    /**
     * Update status & verifikasi pengajuan oleh HRD / Admin
     */
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hrd'])) {
            return back()->withErrors(['error' => 'Anda tidak memiliki hak untuk mengubah status pengajuan ini']);
        }

        $validated = $request->validate([
            'status' => 'required|in:Diajukan,Diproses,Disetujui,Ditolak',
            'catatan' => 'nullable|string|max:500',
            'nomor_surat' => 'nullable|string|max:255',
        ]);

        if ($validated['status'] === 'Ditolak' && empty(trim($validated['catatan'] ?? ''))) {
            return back()->withErrors(['catatan' => 'Catatan alasan penolakan wajib diisi jika status Ditolak.']);
        }

        $suratDinas = SuratDinas::findOrFail($id);
        $suratDinas->status = $validated['status'];

        if (!empty($validated['nomor_surat'])) {
            $suratDinas->nomor_surat = $validated['nomor_surat'];
        }

        if ($request->has('catatan')) {
            $suratDinas->catatan = $validated['catatan'];
        }

        // Ketika status diterima / diproses / disetujui, catat user HRD pemeriksa
        if (in_array($validated['status'], ['Disetujui', 'Diproses'])) {
            $suratDinas->disetujui_oleh_id = $user->id;
            $suratDinas->disetujui_oleh_nama = $user->name;
            $suratDinas->disetujui_oleh_jabatan = $user->jabatan ?: 'Head Of IAD & HRD';
            $suratDinas->disetujui_pada = now();
        }

        $suratDinas->save();

        // Kirim email notifikasi ke pemohon jika status disetujui atau ditolak
        if (in_array($validated['status'], ['Disetujui', 'Ditolak'])) {
            $this->queueNotificationSuratDinasToApplicant($suratDinas);
        }

        return redirect()->back()->with('success', "Status pengajuan berhasil diperbarui menjadi {$validated['status']}!");
    }

    /**
     * Hapus pengajuan surat dinas
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $suratDinas = SuratDinas::findOrFail($id);

        if ($suratDinas->uid !== $user->id && !in_array($user->role, ['admin', 'hrd'])) {
            return back()->withErrors(['error' => 'Anda tidak memiliki akses untuk menghapus pengajuan ini']);
        }

        $suratDinas->delete();
        return redirect()->back()->with('success', 'Pengajuan Surat Perjalanan Dinas berhasil dihapus!');
    }

    /**
     * Download Formulir PDF Surat Perjalanan Dinas
     */
    public function downloadPdf($id)
    {
        $user = Auth::user();
        $suratDinas = SuratDinas::with('user')->findOrFail($id);

        $isHrdOrAdmin = $user && in_array($user->role, ['admin', 'hrd']);

        // Jika bukan HRD/Admin, dokumen hanya bisa diunduh/dicetak jika status sudah Diproses atau Disetujui
        if (!$isHrdOrAdmin && !in_array($suratDinas->status, ['Diproses', 'Disetujui'])) {
            return back()->withErrors(['error' => 'Dokumen PDF SPD baru dapat diunduh setelah disetujui atau diproses oleh HRD.']);
        }

        $pdf = Pdf::loadView('pdf.surat-dinas', [
            'surat' => $suratDinas,
        ])->setPaper('a4', 'portrait');

        $filename = 'SPD_' . str_replace(['/', '\\'], '_', $suratDinas->nomor_surat) . '.pdf';
        return $pdf->stream($filename);
    }

    /**
     * Halaman Claim Dinas (Daftar Riwayat Realisasi Biaya)
     */
    public function pencatatan(Request $request)
    {
        $user = Auth::user();
        $userRole = strtolower($user->role ?? '');

        $query = KlaimDinas::with(['items', 'user', 'pemeriksa']);

        // Jika Pegawai: hanya tampilkan klaim dinas miliknya sendiri
        if (in_array($userRole, ['pegawai', 'karyawan', 'employee', 'site'])) {
            $query->where('uid', $user->id);
        }
        // Jika Head / Atasan: tampilkan klaim dari divisinya atau miliknya sendiri
        elseif (in_array($userRole, ['head', 'atasan'])) {
            $divisi = $user->divisi;
            $query->where(function ($q) use ($user, $divisi) {
                $q->where('uid', $user->id);
                if (!empty($divisi)) {
                    $q->orWhere('divisi', $divisi)
                      ->orWhereHas('user', function ($sub) use ($divisi) {
                          $sub->where('divisi', $divisi);
                      });
                }
            });
        }
        // Jika HRD / Admin: tampilkan seluruh klaim

        $klaimList = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('DinasLuar/ClaimDinas', [
            'klaimList' => $klaimList,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Halaman Buat Pengajuan Claim Dinas Baru (Bisa Publik / Tanpa Login atau Login)
     */
    public function createKlaim()
    {
        $user = Auth::user();

        // Ambil daftar nomor SPD yang pernah diajukan (jika login)
        $spdList = [];
        if ($user) {
            $spdList = SuratDinas::where('uid', $user->id)
                ->orderBy('created_at', 'desc')
                ->pluck('nomor_surat');
        }

        return Inertia::render('DinasLuar/CreateKlaim', [
            'spdList' => $spdList,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Parse File Excel Realisasi Klaim Dinas dan kembalikan data JSON untuk auto-fill form
     */
    public function parseKlaimExcel(Request $request, KlaimDinasExcelParser $parser)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls|max:10240',
        ], [
            'excel_file.required' => 'Pilih file Excel template klaim terlebih dahulu',
            'excel_file.mimes' => 'File harus berformat Excel (.xlsx atau .xls)',
            'excel_file.max' => 'Ukuran file Excel maksimal 10 MB',
        ]);

        try {
            $file = $request->file('excel_file');
            $data = $parser->parse($file->getRealPath());

            return response()->json([
                'status' => 'success',
                'message' => 'File Excel berhasil dibaca dan dimasukkan ke form!',
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('Gagal membaca file Excel Klaim Dinas: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membaca file Excel. Pastikan format template sesuai dengan Template_Klaim_SDinas.xlsx (' . $e->getMessage() . ')',
            ], 422);
        }
    }

    /**
     * Simpan Pengajuan Claim Dinas Baru (Support PDF upload / Offline)
     */
    public function storeKlaim(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'jabatan' => 'nullable|string|max:255',
            'divisi' => 'nullable|string|max:255',
            'nomor_surat_dinas' => 'nullable|string|max:255',
            'kegiatan' => 'required|string|max:255',
            'periode_awal' => 'nullable|date',
            'periode_akhir' => 'nullable|date',
            'kota_penandatangan' => 'nullable|string|max:255',
            'tanggal_pengajuan' => 'required|date',
            'cash_advance' => 'nullable|numeric|min:0',
            'no_rekening' => 'nullable|string|max:255',
            'nama_bank' => 'nullable|string|max:255',
            'nama_rekening' => 'nullable|string|max:255',
            'metode_nota' => 'required|in:pdf,offline',
            'file_nota' => 'nullable|file|mimes:pdf|max:10240', // max 10MB
            'catatan_pemohon' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.tanggal' => 'nullable|date',
            'items.*.rincian_biaya' => 'required|string|max:255',
            'items.*.nominal' => 'required|numeric|min:0',
        ], [
            'nama_lengkap.required' => 'Nama lengkap wajib diisi',
            'email.required' => 'Email wajib diisi',
            'kegiatan.required' => 'Nama kegiatan perjalanan dinas wajib diisi',
            'tanggal_pengajuan.required' => 'Tanggal pengajuan wajib diisi',
            'items.required' => 'Minimal harus mengisi 1 rincian biaya',
            'items.min' => 'Minimal harus mengisi 1 rincian biaya',
            'file_nota.mimes' => 'File bukti nota harus berupa berkas PDF',
            'file_nota.max' => 'Ukuran file bukti nota maksimal 10 MB',
        ]);

        // Cek jika metode nota PDF tapi belum unggah file
        if ($validated['metode_nota'] === 'pdf' && !$request->hasFile('file_nota')) {
            return back()->withErrors(['file_nota' => 'Anda memilih pengiriman via PDF, harap unggah berkas bukti nota dalam format PDF.'])->withInput();
        }

        // Upload file nota jika ada
        $fileNotaPath = null;
        if ($request->hasFile('file_nota')) {
            $file = $request->file('file_nota');
            $fileName = 'NOTA_' . time() . '_' . Str::slug($validated['nama_lengkap']) . '.pdf';
            $fileNotaPath = $file->storeAs('nota_klaim_dinas', $fileName, 'public');
        }

        // Hitung total realisasi dan sisa kurang
        $totalRealisasi = 0;
        foreach ($validated['items'] as $item) {
            $totalRealisasi += (float)$item['nominal'];
        }
        $cashAdvance = (float)($validated['cash_advance'] ?? 0);
        $sisaKurang = $totalRealisasi - $cashAdvance;

        // Generate Nomor Klaim Otomatis
        $year = date('Y');
        $monthRomawi = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'][(int)date('m')];
        $lastKlaim = KlaimDinas::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNum = $lastKlaim ? ($lastKlaim->id + 1) : 1;
        $nomorKlaim = sprintf('CLM/SLG/%s/%s/%03d', $year, $monthRomawi, $nextNum);

        $klaim = KlaimDinas::create([
            'uid' => $user ? $user->id : null,
            'nomor_klaim' => $nomorKlaim,
            'nomor_surat_dinas' => $validated['nomor_surat_dinas'] ?? null,
            'nama_lengkap' => $validated['nama_lengkap'],
            'email' => $validated['email'],
            'jabatan' => $validated['jabatan'] ?? ($user ? $user->jabatan : '-'),
            'divisi' => $validated['divisi'] ?? ($user ? $user->divisi : '-'),
            'kegiatan' => $validated['kegiatan'],
            'periode_awal' => $validated['periode_awal'] ?? null,
            'periode_akhir' => $validated['periode_akhir'] ?? null,
            'kota_penandatangan' => $validated['kota_penandatangan'] ?: 'Jakarta',
            'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
            'cash_advance' => $cashAdvance,
            'total_realisasi' => $totalRealisasi,
            'sisa_kurang' => $sisaKurang,
            'no_rekening' => $validated['no_rekening'] ?? '-',
            'nama_bank' => $validated['nama_bank'] ?? '-',
            'nama_rekening' => $validated['nama_rekening'] ?? '-',
            'metode_nota' => $validated['metode_nota'],
            'file_nota_pdf' => $fileNotaPath,
            'catatan_pemohon' => $validated['catatan_pemohon'] ?? null,
            'status' => 'Diajukan',
        ]);

        // Simpan baris-baris item rincian biaya
        foreach ($validated['items'] as $item) {
            KlaimDinasItem::create([
                'klaim_dinas_id' => $klaim->id,
                'tanggal' => $item['tanggal'] ?? null,
                'rincian_biaya' => $item['rincian_biaya'],
                'nominal' => (float)$item['nominal'],
                'keterangan' => $item['keterangan'] ?? null,
            ]);
        }

        // Kirim email notifikasi ke semua user HRD
        $this->queueNotificationKlaimToAllHrd($klaim);

        if (Auth::check()) {
            return redirect()->route('dinas-luar.pencatatan')->with('success', "Pengajuan Claim Dinas ({$nomorKlaim}) berhasil dikirim!");
        }

        return redirect()->back()->with('success', "Pengajuan Claim Dinas ({$nomorKlaim}) telah berhasil dikirim! Silakan konfirmasi ke bagian HRD.");
    }

    /**
     * Verifikasi Claim Dinas oleh HRD (Mencatat nama pemeriksa pada 'diperiksa oleh')
     */
    public function updateStatusKlaim(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'hrd'])) {
            return back()->withErrors(['error' => 'Hanya HRD atau Admin yang berhak memverifikasi claim dinas.']);
        }

        $validated = $request->validate([
            'status' => 'required|in:Diajukan,Diproses,Disetujui,Ditolak',
            'catatan_hrd' => 'nullable|string|max:500',
        ]);

        $klaim = KlaimDinas::findOrFail($id);
        $klaim->status = $validated['status'];
        
        // Ketika status diterima / diproses / disetujui, catat user HRD pemeriksa
        if (in_array($validated['status'], ['Disetujui', 'Diproses'])) {
            $klaim->diperiksa_oleh_id = $user->id;
            $klaim->diperiksa_oleh_nama = $user->name;
            $klaim->diperiksa_oleh_jabatan = $user->jabatan ?: 'Head Of HRD';
            $klaim->diperiksa_pada = now();
        }

        if ($request->has('catatan_hrd')) {
            $klaim->catatan_hrd = $validated['catatan_hrd'];
        }

        $klaim->save();

        // Kirim email notifikasi ke pemohon jika status disetujui atau ditolak
        if (in_array($validated['status'], ['Disetujui', 'Ditolak'])) {
            $this->queueNotificationKlaimToApplicant($klaim);
        }

        return redirect()->back()->with('success', "Status Claim Dinas berhasil diperbarui menjadi {$validated['status']}!");
    }

    /**
     * Download Template Excel / Hasil File Excel Claim Dinas sesuai template Template_Klaim_SDinas.xlsx
     */
    public function downloadKlaimExcel($id, KlaimDinasExcelService $excelService)
    {
        $klaim = KlaimDinas::with(['items', 'pemeriksa'])->findOrFail($id);
        $filePath = $excelService->generate($klaim);

        $downloadName = 'Klaim_Dinas_' . str_replace(['/', '\\'], '_', $klaim->nomor_klaim) . '.xlsx';
        return response()->download($filePath, $downloadName)->deleteFileAfterSend(true);
    }

    /**
     * Download Formulir PDF Claim Dinas
     */
    public function downloadKlaimPdf($id)
    {
        $user = Auth::user();
        $klaim = KlaimDinas::with(['items', 'pemeriksa'])->findOrFail($id);

        $isHrdOrAdmin = $user && in_array($user->role, ['admin', 'hrd']);

        // Jika bukan HRD/Admin, dokumen klaim baru bisa dicetak jika status Diproses atau Disetujui
        if (!$isHrdOrAdmin && !in_array($klaim->status, ['Diproses', 'Disetujui'])) {
            return back()->withErrors(['error' => 'Formulir PDF Klaim Dinas baru dapat diunduh setelah disetujui atau diproses oleh HRD.']);
        }

        $pdf = Pdf::loadView('pdf.klaim-dinas', [
            'klaim' => $klaim,
        ])->setPaper('a4', 'portrait');

        $filename = 'Klaim_Dinas_' . str_replace(['/', '\\'], '_', $klaim->nomor_klaim) . '.pdf';
        return $pdf->stream($filename);
    }

    /**
     * Download / Lihat Berkas Bukti Nota PDF Klaim Dinas
     */
    public function downloadNotaPdf($id)
    {
        $user = Auth::user();
        $klaim = KlaimDinas::findOrFail($id);

        // Otorisasi: pemilik klaim atau HRD / Admin
        if ($klaim->uid !== $user->id && !in_array($user->role, ['admin', 'hrd', 'head', 'atasan'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat berkas nota ini.');
        }

        if (empty($klaim->file_nota_pdf) || !Storage::disk('public')->exists($klaim->file_nota_pdf)) {
            abort(404, 'Berkas bukti nota tidak ditemukan.');
        }

        $path = Storage::disk('public')->path($klaim->file_nota_pdf);
        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($klaim->file_nota_pdf) . '"',
        ]);
    }

    /**
     * Download Blank Excel Template Klaim Dinas
     */
    public function downloadBlankTemplate()
    {
        $templatePath = storage_path('app/templates/Template_Klaim_SDinas.xlsx');
        if (file_exists($templatePath)) {
            return response()->download($templatePath, 'Template_Klaim_SDinas.xlsx');
        }
        return back()->withErrors(['error' => 'Template Excel belum tersedia']);
    }

    /**
     * Hapus pengajuan claim dinas
     */
    public function destroyKlaim($id)
    {
        $user = Auth::user();
        $klaim = KlaimDinas::findOrFail($id);

        if ($klaim->uid !== $user->id && !in_array($user->role, ['admin', 'hrd'])) {
            return back()->withErrors(['error' => 'Anda tidak memiliki hak untuk menghapus klaim ini']);
        }

        $klaim->delete();
        return redirect()->back()->with('success', 'Pengajuan Claim Dinas berhasil dihapus!');
    }

    /**
     * Kirim email notifikasi Claim Dinas ke seluruh HRD
     */
    private function queueNotificationKlaimToAllHrd(KlaimDinas $klaim): void
    {
        try {
            $hrdEmails = User::where('role', 'hrd')
                ->where('active', 1)
                ->whereNull('tanggal_keluar')
                ->whereNotNull('email')
                ->where('email', '!=', '')
                ->pluck('email')
                ->filter()
                ->unique()
                ->values();

            if ($hrdEmails->isEmpty()) {
                Log::warning('Tidak ada user HRD aktif untuk notifikasi klaim dinas.', ['klaim_id' => $klaim->id]);
                return;
            }

            foreach ($hrdEmails as $email) {
                Mail::to($email)->queue(
                    (new KlaimDinasDiajukan($klaim))->onConnection('database')
                );
            }
        } catch (\Throwable $e) {
            Log::error('Gagal mengantrekan email notifikasi klaim dinas ke HRD.', [
                'klaim_id' => $klaim->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Kirim email notifikasi ke semua user ber-role HRD yang aktif
     */
    private function queueNotificationToAllHrd(SuratDinas $suratDinas): void
    {
        try {
            $hrdEmails = User::where('role', 'hrd')
                ->where('active', 1)
                ->whereNull('tanggal_keluar')
                ->whereNotNull('email')
                ->where('email', '!=', '')
                ->pluck('email')
                ->filter()
                ->unique()
                ->values();

            if ($hrdEmails->isEmpty()) {
                Log::warning('Tidak ada user HRD aktif dengan email valid untuk pengiriman notifikasi pengajuan surat perjalanan dinas.', [
                    'surat_dinas_id' => $suratDinas->id,
                ]);
                return;
            }

            foreach ($hrdEmails as $email) {
                Mail::to($email)->queue(
                    (new SuratDinasDiajukan($suratDinas))->onConnection('database')
                );
            }
        } catch (\Throwable $e) {
            Log::error('Gagal mengantrekan email notifikasi pengajuan surat dinas ke HRD.', [
                'surat_dinas_id' => $suratDinas->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Kirim email balasan status (Disetujui / Ditolak) ke pemohon Surat Perjalanan Dinas
     */
    private function queueNotificationSuratDinasToApplicant(SuratDinas $suratDinas): void
    {
        try {
            $applicantEmail = $suratDinas->email;
            if (empty($applicantEmail) && $suratDinas->uid) {
                $user = User::find($suratDinas->uid);
                $applicantEmail = $user?->email;
            }

            if (!empty($applicantEmail) && filter_var($applicantEmail, FILTER_VALIDATE_EMAIL)) {
                Mail::to($applicantEmail)->queue(
                    (new StatusSuratDinasDiupdate($suratDinas))->onConnection('database')
                );
            }
        } catch (\Throwable $e) {
            Log::error('Gagal mengantrekan email update status surat dinas ke pemohon.', [
                'surat_dinas_id' => $suratDinas->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Kirim email balasan status (Disetujui / Ditolak) ke pemohon Claim Dinas
     */
    private function queueNotificationKlaimToApplicant(KlaimDinas $klaim): void
    {
        try {
            $applicantEmail = $klaim->email;
            if (empty($applicantEmail) && $klaim->uid) {
                $user = User::find($klaim->uid);
                $applicantEmail = $user?->email;
            }

            if (!empty($applicantEmail) && filter_var($applicantEmail, FILTER_VALIDATE_EMAIL)) {
                Mail::to($applicantEmail)->queue(
                    (new StatusKlaimDinasDiupdate($klaim))->onConnection('database')
                );
            }
        } catch (\Throwable $e) {
            Log::error('Gagal mengantrekan email update status klaim dinas ke pemohon.', [
                'klaim_id' => $klaim->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
