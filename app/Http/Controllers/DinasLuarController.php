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

class DinasLuarController extends Controller
{
    /**
     * Halaman Pengajuan Dinas Luar (Daftar Riwayat)
     */
    public function pengajuan(Request $request)
    {
        $user = Auth::user();

        // Ambil riwayat pengajuan surat dinas
        $query = SuratDinas::with('user');

        // Jika bukan admin / hrd, hanya tampilkan milik sendiri
        if (!in_array($user->role, ['admin', 'hrd'])) {
            $query->where('uid', $user->id);
        }

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
            'nomor_surat' => 'required|string|max:255',
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
            'nomor_surat.required' => 'Nomor surat wajib diisi (harap hubungi HRD)',
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

        $suratDinas = SuratDinas::create([
            'uid' => $user ? $user->id : null,
            'email' => $validated['email'],
            'nama_lengkap' => $validated['nama_lengkap'],
            'nomor_surat' => $validated['nomor_surat'],
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
     * Update status pengajuan oleh HRD / Admin
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
        ]);

        $suratDinas = SuratDinas::findOrFail($id);
        $suratDinas->status = $validated['status'];
        if ($request->has('catatan')) {
            $suratDinas->catatan = $validated['catatan'];
        }
        $suratDinas->save();

        return redirect()->back()->with('success', 'Status pengajuan berhasil diperbarui!');
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
        $suratDinas = SuratDinas::with('user')->findOrFail($id);

        $pdf = Pdf::loadView('pdf.surat-dinas', [
            'surat' => $suratDinas,
        ])->setPaper('a4', 'portrait');

        $filename = 'SPD_' . str_replace(['/', '\\'], '_', $suratDinas->nomor_surat) . '.pdf';
        return $pdf->stream($filename);
    }

    /**
     * Halaman Pencatatan Dinas Luar & Upload Excel Biaya Realisasi
     */
    public function pencatatan(Request $request)
    {
        $user = Auth::user();

        // Sample initial data for realization cost recordings
        $pencatatanList = [
            [
                'id' => 1,
                'no_sppd' => 'DL/2026/01/014',
                'nama_pegawai' => $user ? $user->name : 'Ahmad Fauzi',
                'divisi' => $user ? ($user->divisi ?? 'Marketing') : 'Marketing',
                'tujuan' => 'Jakarta Convention Center (JCC)',
                'tanggal_dinas' => '2026-01-20 s/d 2026-01-21',
                'estimasi_biaya' => 1200000,
                'realisasi_biaya' => 1150000,
                'selisih' => -50000,
                'status_verifikasi' => 'verified',
                'file_excel' => 'realisasi_biaya_DL_2026_01_014.xlsx',
                'tanggal_upload' => '2026-01-23',
                'rincian' => [
                    ['kategori' => 'Transportasi / Bensin & Tol', 'nominal' => 450000, 'bukti' => 'struk_tol_bensin.pdf'],
                    ['kategori' => 'Akomodasi / Penginapan', 'nominal' => 400000, 'bukti' => 'invoice_hotel.pdf'],
                    ['kategori' => 'Konsumsi & Uang Saku', 'nominal' => 300000, 'bukti' => 'nota_makan.pdf'],
                ],
            ],
            [
                'id' => 2,
                'no_sppd' => 'DL/2026/02/001',
                'nama_pegawai' => $user ? $user->name : 'Budi Santoso',
                'divisi' => $user ? ($user->divisi ?? 'IT Support') : 'IT Support',
                'tujuan' => 'PT Mitra Solusi Surabaya',
                'tanggal_dinas' => '2026-02-15 s/d 2026-02-17',
                'estimasi_biaya' => 4500000,
                'realisasi_biaya' => 4620000,
                'selisih' => 120000,
                'status_verifikasi' => 'pending',
                'file_excel' => 'realisasi_biaya_DL_2026_02_001.xlsx',
                'tanggal_upload' => '2026-02-18',
                'rincian' => [
                    ['kategori' => 'Tiket Pesawat PP', 'nominal' => 2600000, 'bukti' => 'tiket_pesawat.pdf'],
                    ['kategori' => 'Hotel (2 Malam)', 'nominal' => 1200000, 'bukti' => 'invoice_hotel.pdf'],
                    ['kategori' => 'Transport Lokal (Grab/Taxi)', 'nominal' => 370000, 'bukti' => 'e_receipt_grab.pdf'],
                    ['kategori' => 'Uang Harian / Saku', 'nominal' => 450000, 'bukti' => 'lembar_penerimaan.pdf'],
                ],
            ],
        ];

        return Inertia::render('DinasLuar/Pencatatan', [
            'pencatatanList' => $pencatatanList,
            'auth' => [
                'user' => $user,
            ],
        ]);
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
}
