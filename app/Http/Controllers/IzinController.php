<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Mail\PerizinanDiajukan;
use App\Mail\PerizinanDiketahuiHrd;
use App\Mail\StatusPerizinanDiupdate;
use App\Models\Perizinan;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Kehadiran;


class IzinController extends Controller
{
public function index()
{
    $heads = User::select('id', 'name', 'jabatan', 'email', 'role')
        ->where('id', '!=', Auth::id())
        ->where('active', true)
        ->whereNull('tanggal_keluar')
        ->orderBy('name')
        ->get();
        
    $perizinans = Perizinan::where('uid', Auth::id())
        ->with([
            'user:id,name,email,jabatan',
            'diketahuiOleh:id,name,email,jabatan,role',
            'disetujuiOleh:id,name,email,jabatan,role'
        ])
        ->latest()
        ->paginate(10);

    // TAMBAHAN BARU: Get perizinan yang perlu disetujui oleh user ini
    $pendingApprovals = Perizinan::where('uid_diketahui', Auth::id())
        ->where('status_diketahui', null)
        ->with([
            'user:id,name,email,jabatan,divisi',
            'diketahuiOleh:id,name,email,jabatan,role',
            'disetujuiOleh:id,name,email,jabatan,role'
        ])
        ->latest()
        ->get();

    return Inertia::render('User/Izin', [
        'heads' => $heads,
        'perizinans' => $perizinans,
        'pendingApprovals' => $pendingApprovals,
        'auth' => [
            'user' => Auth::user()
        ]
    ]);
}

public function getHeads()
{
    $heads = User::select('id', 'name', 'email', 'jabatan', 'role')
        ->where('active', 1)
        ->whereNull('tanggal_keluar')
        ->orderBy('name')
        ->get();
    
    return response()->json([
        'success' => true,
        'data' => $heads
    ]);
}




    public function hrd(Request $request)
{
    $query = Perizinan::with([
        'user:id,name,email,jabatan',
        'diketahuiOleh:id,name,email,jabatan',
        'disetujuiOleh:id,name,email,jabatan'
    ]);

    // Filter by status
    if ($request->has('status') && $request->status != '') {
        $query->where('status', $request->status);
    }

    // Filter by type
    if ($request->has('type') && $request->type != '') {
        $query->where('type_perizinan', $request->type);
    }

    // Search by name or keperluan
    if ($request->has('search') && $request->search != '') {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhere('keperluan', 'like', "%{$search}%");
        });
    }

    $perizinans = $query->latest()->get();

    // Get statistics
    $stats = [
        'total' => Perizinan::count(),
        'diajukan' => Perizinan::where('status', 'Diajukan')->count(),
        'disetujui' => Perizinan::where('status', 'Disetujui')->count(),
        'ditolak' => Perizinan::where('status', 'Ditolak')->count(),
    ];

    // Check if request wants JSON (for API calls)
    if ($request->expectsJson() || $request->wantsJson()) {
        return response()->json([
            'success' => true,
            'perizinans' => $perizinans,
            'stats' => $stats
        ]);
    }

    // Return Inertia view for regular page load
    return Inertia::render('Hrd/Perizinan/KeluarKantor', [
        'perizinans' => $perizinans,
        'stats' => $stats,
        'filters' => $request->only(['status', 'type', 'search']),
        'auth' => [
            'user' => Auth::user()
        ]
    ]);
}

private function updateKehadiranIzin($perizinan)
{
    $tanggal = $perizinan->tanggal;
    $typePerizinan = $perizinan->type_perizinan;
    
    // Tentukan status kehadiran berdasarkan tipe perizinan
    $statusKehadiran = match($typePerizinan) {
        'p1' => 'P1',  // Izin Full Day
        'p2' => 'P2',  // Izin Datang Terlambat
        'p3' => 'P3',  // Izin Pulang Cepat
        default => 'Izin'
    };
    
    Kehadiran::updateOrCreate(
        [
            'uid' => $perizinan->uid,
            'tanggal' => $tanggal,
        ],
        [
            'status' => $statusKehadiran,
            'keterangan' => $perizinan->keperluan,
            'jam_kedatangan' => $typePerizinan === 'p1' ? null : $perizinan->jam_keluar,
            'jam_pulang' => $typePerizinan === 'p1' ? null : $perizinan->jam_kembali,
        ]
    );
}



    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'type_perizinan' => 'required|in:p1,p2,p3',
            'tanggal' => 'required|date|after_or_equal:today',
            'jam_keluar' => 'nullable|date_format:H:i',
            'jam_kembali' => 'nullable|date_format:H:i',
            'uid_diketahui' => 'required|exists:users,id',
            'keperluan' => 'required|string|max:1000'
        ], [
            'type_perizinan.required' => 'Tipe perizinan harus dipilih',
            'type_perizinan.in' => 'Tipe perizinan tidak valid',
            'tanggal.required' => 'Tanggal harus diisi',
            'tanggal.date' => 'Format tanggal tidak valid',
            'tanggal.after_or_equal' => 'Tanggal tidak boleh kurang dari hari ini',
            'jam_keluar.date_format' => 'Format jam keluar tidak valid (HH:MM)',
            'jam_kembali.date_format' => 'Format jam kembali tidak valid (HH:MM)',
            'uid_diketahui.required' => 'Head yang mengetahui harus dipilih',
            'uid_diketahui.exists' => 'Head yang dipilih tidak valid',
            'keperluan.required' => 'Keperluan harus diisi',
            'keperluan.max' => 'Keperluan maksimal 1000 karakter'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $typePerizinan = $request->type_perizinan;
        $jamKeluar = $request->jam_keluar;
        $jamKembali = $request->jam_kembali;

        // For P1 (Full Day), set jam to 00:00
        if ($typePerizinan === 'p1') {
            $jamKeluar = '00:00';
            $jamKembali = '00:00';
        } else {
            // For P2 and P3, jam is required
            if (!$jamKeluar || !$jamKembali) {
                return redirect()->back()
                    ->withErrors(['jam_keluar' => 'Jam keluar dan jam kembali harus diisi untuk tipe perizinan ini'])
                    ->withInput();
            }

            // Validate that jam_kembali is after jam_keluar
            if ($jamKeluar >= $jamKembali) {
                return redirect()->back()
                    ->withErrors(['jam_kembali' => 'Jam kembali harus lebih dari jam keluar'])
                    ->withInput();
            }
        }

        // Check for overlapping izin for the same user on the same date
        $overlapping = Perizinan::where('uid', Auth::id())
            ->where('status', '!=', 'Ditolak')
            ->where('tanggal', $request->tanggal)
            ->exists();

        if ($overlapping) {
            return redirect()->back()
                ->withErrors(['tanggal' => 'Anda sudah memiliki pengajuan izin pada tanggal tersebut'])
                ->withInput();
        }

        try {
            $perizinan = Perizinan::create([
                'uid' => Auth::id(),
                'uid_diketahui' => $request->uid_diketahui,
                'type_perizinan' => $request->type_perizinan,
                'tanggal' => $request->tanggal,
                'jam_keluar' => $jamKeluar,
                'jam_kembali' => $jamKembali,
                'keperluan' => $request->keperluan,
                'status' => 'Diajukan'
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menyimpan data: ' . $e->getMessage()])
                ->withInput();
        }

        try {
            $this->queuePerizinanNotification($perizinan);
        } catch (\Throwable $e) {
            Log::error('Gagal mengantrekan email pengajuan perizinan.', [
                'perizinan_id' => $perizinan->id,
                'exception' => $e->getMessage(),
            ]);

            return redirect()->back()->with(
                'error',
                'Pengajuan izin berhasil disimpan, tetapi email notifikasi gagal dijadwalkan. Silakan hubungi HRD.'
            );
        }

        return redirect()->back()->with(
            'success',
            'Pengajuan izin berhasil diajukan. Email notifikasi sedang diproses.'
        );
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $perizinan = Perizinan::with([
                'user:id,name,email,jabatan',
                'diketahuiOleh:id,name,email,jabatan',
                'disetujuiOleh:id,name,email,jabatan'
            ])->findOrFail($id);

            // Check authorization for user role
            if (Auth::user()->role !== 'hrd' && Auth::user()->role !== 'admin') {
                if ($perizinan->uid !== Auth::id()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $perizinan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
{
    try {
        // Log untuk debugging
        \Log::info('Update request data:', $request->all());
        \Log::info('Update perizinan ID:', ['id' => $id]);
        
        $perizinan = Perizinan::where('uid', Auth::id())
            ->where('id', $id)
            ->where('status', 'Diajukan')
            ->firstOrFail();

        $typePerizinan = $request->type_perizinan;
        
        // Build validation rules dynamically
        $rules = [
            'type_perizinan' => 'required|in:p1,p2,p3',
            'tanggal' => 'required|date',
            'uid_diketahui' => 'required|exists:users,id',
            'keperluan' => 'required|string|max:1000'
        ];

        // Add time validation only for P2 and P3
        if (in_array($typePerizinan, ['p2', 'p3'])) {
            $rules['jam_keluar'] = 'required|date_format:H:i';
            $rules['jam_kembali'] = 'required|date_format:H:i';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            \Log::warning('Validation failed:', $validator->errors()->toArray());
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        // Set time based on type
        if ($typePerizinan === 'p1') {
            $jamKeluar = '00:00';
            $jamKembali = '00:00';
        } else {
            $jamKeluar = $request->jam_keluar;
            $jamKembali = $request->jam_kembali;
            
            // Additional validation for time
            if ($jamKeluar >= $jamKembali) {
                return redirect()->back()
                    ->withErrors(['jam_kembali' => 'Jam kembali harus lebih dari jam keluar'])
                    ->withInput();
            }
        }

        // Update perizinan
        $perizinan->update([
            'uid_diketahui' => $request->uid_diketahui,
            'type_perizinan' => $request->type_perizinan,
            'tanggal' => $request->tanggal,
            'jam_keluar' => $jamKeluar,
            'jam_kembali' => $jamKembali,
            'keperluan' => $request->keperluan,
        ]);

        \Log::info('Perizinan updated successfully:', ['id' => $id]);

        return redirect()->route('pegawai.izin')
            ->with('success', 'Pengajuan izin berhasil diperbarui!');
            
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        \Log::error('Perizinan not found:', [
            'id' => $id,
            'user_id' => Auth::id(),
            'error' => $e->getMessage()
        ]);
        
        return redirect()->back()
            ->withErrors(['error' => 'Pengajuan tidak ditemukan atau tidak dapat diubah. Pastikan status masih "Diajukan"'])
            ->withInput();
            
    } catch (\Exception $e) {
        \Log::error('Error updating perizinan:', [
            'id' => $id,
            'user_id' => Auth::id(),
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return redirect()->back()
            ->withErrors(['error' => 'Gagal memperbarui pengajuan izin: ' . $e->getMessage()])
            ->withInput();
    }
}
    /**
     * Remove the specified resource from storage.
     */
  public function destroy($id)
{
    try {
        $perizinan = Perizinan::findOrFail($id);

        if (Auth::user()->role === 'hrd' || Auth::user()->role === 'admin') {
            $perizinan->delete();
            return redirect()->route('')
                ->with('success', 'Data perizinan berhasil dihapus!');
        } else {
            if ($perizinan->uid !== Auth::id() || $perizinan->status !== 'Diajukan') {
                return redirect()->back()
                    ->with('error', 'Gagal membatalkan pengajuan izin. Pastikan status masih "Diajukan"');
            }
            
            $perizinan->delete();
            return redirect()->route('pegawai.izin')
                ->with('success', 'Pengajuan izin berhasil dibatalkan!');
        }
    } catch (\Exception $e) {
        \Log::error('Error deleting perizinan: ' . $e->getMessage());
        return redirect()->back()
            ->with('error', 'Gagal menghapus data perizinan');
    }
}

public function approve(Request $request, $id)
{
    try {
        $perizinan = Perizinan::with(['user', 'diketahuiOleh', 'disetujuiOleh'])->findOrFail($id);
        $currentUser = Auth::user();
        $oldStatus = $perizinan->status;

        $isHRD = $currentUser->role === 'hrd';
        $isTargetUser = $perizinan->uid_diketahui == $currentUser->id;

        if (!$isHRD && !$isTargetUser) {
            return back()->with('error', 'Anda tidak memiliki akses untuk menyetujui perizinan ini');
        }

        // ✅ PERBAIKAN: Gunakan if-else untuk mencegah eksekusi ganda
        // PRIORITAS 1: Jika user adalah target (uid_diketahui) DAN status_diketahui masih null
        if ($isTargetUser && $perizinan->status_diketahui === null) {
            $perizinan->status_diketahui = 'Disetujui';
            if ($request->catatan) {
                $perizinan->catatan = $request->catatan;
            }
            $perizinan->save();
            
            // Kirim notifikasi async ke seluruh HRD bahwa atasan telah menyetujui izin keluar kantor
            $this->queueNotificationToAllHrd($perizinan);
        }
        // PRIORITAS 2: Jika user adalah HRD DAN bukan sedang approve sebagai target
        // DAN status_disetujui masih null DAN status_diketahui sudah disetujui
        else if ($isHRD && 
                 $perizinan->status_disetujui === null && 
                 $perizinan->status_diketahui === 'Disetujui') {
            $perizinan->status_disetujui = 'Disetujui';
            $perizinan->uid_disetujui = $currentUser->id;
            if ($request->catatan) {
                $perizinan->catatan = ($perizinan->catatan ? $perizinan->catatan . "\n" : "") . $request->catatan;
            }
            $perizinan->save();
            
        }
        // ✅ TAMBAHAN: Handle kasus dimana HRD mencoba approve tapi status_diketahui belum disetujui
        else if ($isHRD && 
                 $perizinan->status_disetujui === null && 
                 $perizinan->status_diketahui !== 'Disetujui') {
            return back()->with('warning', 'Perizinan harus disetujui oleh ' . ($perizinan->diketahuiOleh->name ?? 'atasan') . ' terlebih dahulu');
        }

        // Refresh data sebelum update overall status
        $perizinan->refresh();
        $this->updateOverallStatus($perizinan);
        
        // Refresh lagi setelah update status untuk mendapatkan data terbaru
        $perizinan->refresh();
        
        // Jika status berubah menjadi Disetujui, update kehadiran & kirim email notifikasi ke pemohon
        if ($perizinan->status === 'Disetujui' && $oldStatus !== 'Disetujui') {
            $this->updateKehadiranIzin($perizinan);
            $this->queueStatusNotificationToPegawai($perizinan);
        }

        return back()->with('success', "Perizinan berhasil disetujui!");
        
    } catch (\Exception $e) {
        \Log::error('Error approving perizinan: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        return back()->with('error', 'Gagal menyetujui perizinan: ' . $e->getMessage());
    }
}


public function generatePdf($id)
{
    try {
        $perizinan = Perizinan::with([
            'user:id,name,email,jabatan,divisi,ttd,tmk',
            'diketahuiOleh:id,name,email,jabatan,ttd',
            'disetujuiOleh:id,name,email,jabatan,ttd'
        ])->findOrFail($id);

        // ✅ PERBAIKAN: Gunakan helper function Laravel untuk path yang benar
        $getTtdPath = function($ttdFilename) {
            if (!$ttdFilename) return null;
            
            // Path untuk storage (file system)
            $storagePath = storage_path('app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'ttd' . DIRECTORY_SEPARATOR . $ttdFilename);
            
            // Path untuk public (URL)
            $publicPath = public_path('storage' . DIRECTORY_SEPARATOR . 'ttd' . DIRECTORY_SEPARATOR . $ttdFilename);
            
            // Cek mana yang ada
            if (file_exists($storagePath)) {
                return $storagePath;
            } elseif (file_exists($publicPath)) {
                return $publicPath;
            }
            
            return null;
        };

        // Get TTD paths
        $userTtdPath = $getTtdPath($perizinan->user->ttd);
        $diketahuiTtdPath = $getTtdPath($perizinan->diketahuiOleh->ttd ?? null);
        $disetujuiTtdPath = $getTtdPath($perizinan->disetujuiOleh->ttd ?? null);

        // ✅ LOG TTD dengan path yang sudah diperbaiki
        \Log::info('TTD Data for PDF Generation', [
            'perizinan_id' => $id,
            'user_ttd' => $perizinan->user->ttd ?? 'NULL',
            'user_ttd_path' => $userTtdPath ?? 'N/A',
            'user_ttd_exists' => $userTtdPath ? file_exists($userTtdPath) : false,
            
            'diketahui_ttd' => $perizinan->diketahuiOleh->ttd ?? 'NULL',
            'diketahui_ttd_path' => $diketahuiTtdPath ?? 'N/A',
            'diketahui_ttd_exists' => $diketahuiTtdPath ? file_exists($diketahuiTtdPath) : false,
            
            'disetujui_ttd' => $perizinan->disetujuiOleh->ttd ?? 'NULL',
            'disetujui_ttd_path' => $disetujuiTtdPath ?? 'N/A',
            'disetujui_ttd_exists' => $disetujuiTtdPath ? file_exists($disetujuiTtdPath) : false,
            
            'directory_separator' => DIRECTORY_SEPARATOR,
            'storage_base' => storage_path('app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'ttd'),
            'public_base' => public_path('storage' . DIRECTORY_SEPARATOR . 'ttd')
        ]);

        // Format data untuk PDF
        $data = [
            'perizinan' => $perizinan,
            'tanggal_print' => Carbon::now()->format('d/m/Y H:i'),
            // ✅ Kirim path TTD yang sudah benar ke view
            'user_ttd_path' => $userTtdPath,
            'diketahui_ttd_path' => $diketahuiTtdPath,
            'disetujui_ttd_path' => $disetujuiTtdPath
        ];
        
        // Generate PDF
        $pdf = Pdf::loadView('pdf.surat-izin', $data)
            ->setPaper('a5', 'portrait');

        // Download PDF
        $filename = 'Surat_Izin_' . str_replace(' ', '_', $perizinan->user->name) . '_' . date('Ymd') . '.pdf';
        
        \Log::info('PDF Generated Successfully', [
            'perizinan_id' => $id,
            'filename' => $filename,
            'user' => Auth::user()->name ?? 'Unknown'
        ]);
        
        return $pdf->download($filename);

    } catch (\Exception $e) {
        \Log::error('Error generating PDF', [
            'perizinan_id' => $id,
            'error_message' => $e->getMessage(),
            'error_file' => $e->getFile(),
            'error_line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
            'user' => Auth::user()->name ?? 'Unknown'
        ]);
        
        return back()->with('error', 'Gagal generate PDF: ' . $e->getMessage());
    }
}

public function reject(Request $request, $id)
{
    $validator = Validator::make($request->all(), [
        'catatan' => 'required|string|max:500'
    ], [
        'catatan.required' => 'Catatan penolakan harus diisi',
        'catatan.max' => 'Catatan penolakan maksimal 500 karakter'
    ]);

    if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
    }

    try {
        $perizinan = Perizinan::with(['user', 'diketahuiOleh', 'disetujuiOleh'])->findOrFail($id);
        $currentUser = Auth::user();

        // Check authorization
        $isHRD = $currentUser->role === 'hrd';
        $isTargetUser = $perizinan->uid_diketahui == $currentUser->id;

        if (!$isHRD && !$isTargetUser) {
            return back()->with('error', 'Anda tidak memiliki akses untuk menolak perizinan ini');
        }

        $oldStatus = $perizinan->status;

        // Target user menolak
        if ($isTargetUser && $perizinan->status_diketahui === null) {
            $perizinan->status_diketahui = 'Ditolak';
            $perizinan->catatan = $request->catatan;
            $perizinan->save();
        }

        // HRD menolak
        if ($isHRD && $perizinan->status_disetujui === null) {
            $perizinan->status_disetujui = 'Ditolak';
            $perizinan->uid_disetujui = Auth::id();
            $perizinan->catatan = ($perizinan->catatan ? $perizinan->catatan . "\n" : "") . $request->catatan;
            $perizinan->save();
        }

        $perizinan->refresh();
        $this->updateOverallStatus($perizinan);

        $perizinan->refresh();

        // Jika status berubah menjadi Ditolak, kirim email notifikasi ke pemohon
        if ($perizinan->status === 'Ditolak' && $oldStatus !== 'Ditolak') {
            $this->queueStatusNotificationToPegawai($perizinan);
        }

        return back()->with('success', "Perizinan berhasil ditolak");
        
    } catch (\Exception $e) {
        \Log::error('Error rejecting perizinan: ' . $e->getMessage());
        return back()->with('error', 'Gagal menolak perizinan');
    }
}



/**
 * Update overall status berdasarkan status_diketahui dan status_disetujui
 */
private function updateOverallStatus($perizinan)
{
    try {
        $statusDiketahui = $perizinan->status_diketahui;
        $statusDisetujui = $perizinan->status_disetujui;
        $oldStatus = $perizinan->status;

        // Jika salah satu ditolak, maka status keseluruhan = Ditolak
        if ($statusDiketahui === 'Ditolak' || $statusDisetujui === 'Ditolak') {
            $perizinan->status = 'Ditolak';
        }
        // Jika KEDUANYA disetujui, maka status keseluruhan = Disetujui
        elseif ($statusDiketahui === 'Disetujui' && $statusDisetujui === 'Disetujui') {
            $perizinan->status = 'Disetujui';
            
            // Auto create kehadiran ketika fully approved
            if ($oldStatus !== 'Disetujui') {
                $this->updateKehadiranIzin($perizinan);
            }
        }
        // Jika masih ada yang null atau belum diproses, tetap Diajukan
        else {
            $perizinan->status = 'Diajukan';
        }
        
        $perizinan->save();
        
    } catch (\Exception $e) {
        \Log::error('Error updating overall status: ' . $e->getMessage());
        throw $e;
    }
}

/**
 * Kirim email notifikasi status perizinan ke pegawai pemohon secara async via Queue
 */
private function queueStatusNotificationToPegawai(Perizinan $perizinan): void
{
    try {
        $perizinan->loadMissing('user');

        if (!empty($perizinan->user?->email)) {
            Mail::to($perizinan->user->email)->queue(
                (new StatusPerizinanDiupdate($perizinan))->onConnection('database')
            );
        }
    } catch (\Exception $e) {
        Log::error('Gagal mengirim queue email status perizinan ke pemohon: ' . $e->getMessage());
    }
}

/**
 * Kirim email pemberitahuan ke semua HRD ketika izin telah disetujui oleh atasan (diketahui)
 */
private function queueNotificationToAllHrd(Perizinan $perizinan): void
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
            Log::warning('Tidak ada user HRD aktif dengan email valid untuk pengiriman notifikasi izin keluar kantor.', [
                'perizinan_id' => $perizinan->id,
            ]);
            return;
        }

        foreach ($hrdEmails as $email) {
            Mail::to($email)->queue(
                (new PerizinanDiketahuiHrd($perizinan))->onConnection('database')
            );
        }
    } catch (\Throwable $e) {
        Log::error('Gagal mengantrekan email notifikasi izin keluar kantor ke HRD.', [
            'perizinan_id' => $perizinan->id,
            'exception' => $e->getMessage(),
        ]);
    }
}


    /**
     * Get izin history for current user
     */
    public function history(Request $request)
    {
        $query = Perizinan::where('uid', Auth::id())
            ->with([
                'user:id,name,email,jabatan',
                'diketahuiOleh:id,name,email,jabatan',
                'disetujuiOleh:id,name,email,jabatan'
            ]);

        // Filter by status if provided
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        // Filter by type if provided
        if ($request->has('type') && $request->type != '') {
            $query->where('type_perizinan', $request->type);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date != '') {
            $query->where('tanggal', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date != '') {
            $query->where('tanggal', '<=', $request->end_date);
        }

        $perizinans = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $perizinans
        ]);
    }
    public function storeByHrd(Request $request)
{
    $validator = Validator::make($request->all(), [
        'uid' => 'required|exists:users,id',
        'type_perizinan' => 'required|in:p1,p2,p3',
        'tanggal' => 'required|date',
        'jam_keluar' => 'nullable|date_format:H:i',
        'jam_kembali' => 'nullable|date_format:H:i',
        'uid_diketahui' => 'required|exists:users,id',
        'keperluan' => 'required|string|max:1000'
    ]);
    

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validasi gagal',
            'errors' => $validator->errors()
        ], 422);
    }

    $typePerizinan = $request->type_perizinan;
    $jamKeluar = $request->jam_keluar;
    $jamKembali = $request->jam_kembali;

    if ($typePerizinan === 'p1') {
        $jamKeluar = '00:00';
        $jamKembali = '00:00';
    } else {
        if (!$jamKeluar || !$jamKembali) {
            return response()->json([
                'success' => false,
                'message' => 'Jam keluar dan jam kembali harus diisi'
            ], 422);
        }

        if ($jamKeluar >= $jamKembali) {
            return response()->json([
                'success' => false,
                'message' => 'Jam kembali harus lebih dari jam keluar'
            ], 422);
        }
    }

    try {
        $perizinan = Perizinan::create([
            'uid' => $request->uid,
            'uid_diketahui' => $request->uid_diketahui,
            'type_perizinan' => $request->type_perizinan,
            'tanggal' => $request->tanggal,
            'jam_keluar' => $jamKeluar,
            'jam_kembali' => $jamKembali,
            'keperluan' => $request->keperluan,
            'status' => 'Diajukan'
        ]);
        $perizinan->load('user');
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal menambahkan perizinan: ' . $e->getMessage()
        ], 500);
    }

    try {
        $this->queuePerizinanNotification($perizinan);
    } catch (\Throwable $e) {
        Log::error('Gagal mengantrekan email pengajuan perizinan HRD.', [
            'perizinan_id' => $perizinan->id,
            'exception' => $e->getMessage(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Perizinan berhasil ditambahkan, tetapi email notifikasi gagal dijadwalkan.',
            'data' => $perizinan
        ]);
    }

    return response()->json([
        'success' => true,
        'message' => 'Perizinan berhasil ditambahkan. Email notifikasi sedang diproses.',
        'data' => $perizinan
    ]);
}

private function queuePerizinanNotification(Perizinan $perizinan): void
{
    $perizinan->loadMissing(['user', 'diketahuiOleh']);

    if (!$perizinan->diketahuiOleh || !$perizinan->diketahuiOleh->email) {
        throw new \RuntimeException('Penerima email perizinan tidak ditemukan.');
    }

    Mail::to($perizinan->diketahuiOleh->email)->queue(
        (new PerizinanDiajukan($perizinan))->onConnection('database')
    );
}

    /**
     * Get all users (for dropdown)
     */
    public function getUsers()
    {
        $users = User::select('id', 'name', 'email', 'jabatan')
            ->where('active', 1)
            ->whereNull('tanggal_keluar')
            ->orderBy('name')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }
    
    

}