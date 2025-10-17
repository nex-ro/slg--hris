<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Perizinan;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class IzinController extends Controller
{
    /**
     * Display a listing of the resource (untuk user biasa)
     */
    public function index()
    {
        // Get all users with 'head' role for dropdown selection
        $heads = User::where('role', 'head')
            ->select('id', 'name', 'jabatan', 'email')
            ->orderBy('name')
            ->get();

        // Get current user's izin submissions with relationships
        $perizinans = Perizinan::where('uid', Auth::id())
            ->with([
                'user:id,name,email,jabatan',
                'diketahuiOleh:id,name,email,jabatan',
                'disetujuiOleh:id,name,email,jabatan'
            ])
            ->latest()
            ->paginate(10);

        return Inertia::render('User/Izin', [
            'heads' => $heads,
            'perizinans' => $perizinans,
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    }

    /**
     * HRD: Display all perizinan with filters
     */
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
            'keperluan' => 'required|string|min:10|max:1000'
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
            Perizinan::create([
                'uid' => Auth::id(),
                'uid_diketahui' => $request->uid_diketahui,
                'type_perizinan' => $request->type_perizinan,
                'tanggal' => $request->tanggal,
                'jam_keluar' => $jamKeluar,
                'jam_kembali' => $jamKembali,
                'keperluan' => $request->keperluan,
                'status' => 'Diajukan'
            ]);

            return redirect()->back()->with('success', 'Pengajuan izin berhasil diajukan!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menyimpan data: ' . $e->getMessage()])
                ->withInput();
        }
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
            // Find the perizinan and check ownership
            $perizinan = Perizinan::where('uid', Auth::id())
                ->where('id', $id)
                ->where('status', 'Diajukan') // Only allow update if status is still 'Diajukan'
                ->firstOrFail();

            // Validate the request
            $validator = Validator::make($request->all(), [
                'type_perizinan' => 'required|in:p1,p2,p3',
                'tanggal' => 'required|date|after_or_equal:today',
                'jam_keluar' => 'nullable|date_format:H:i',
                'jam_kembali' => 'nullable|date_format:H:i',
                'uid_diketahui' => 'required|exists:users,id',
                'keperluan' => 'required|string|min:10|max:1000'
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
                        ->withErrors(['jam_keluar' => 'Jam keluar dan jam kembali harus diisi'])
                        ->withInput();
                }

                if ($jamKeluar >= $jamKembali) {
                    return redirect()->back()
                        ->withErrors(['jam_kembali' => 'Jam kembali harus lebih dari jam keluar'])
                        ->withInput();
                }
            }

            // Update the perizinan
            $perizinan->update([
                'uid_diketahui' => $request->uid_diketahui,
                'type_perizinan' => $request->type_perizinan,
                'tanggal' => $request->tanggal,
                'jam_keluar' => $jamKeluar,
                'jam_kembali' => $jamKembali,
                'keperluan' => $request->keperluan,
            ]);

            return redirect()->back()->with('success', 'Pengajuan izin berhasil diperbarui!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Gagal memperbarui pengajuan izin'])
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

        // Check authorization
        if (Auth::user()->role === 'hrd' || Auth::user()->role === 'admin') {
            // HRD can delete any perizinan
            $perizinan->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Data perizinan berhasil dihapus!'
            ]);
        } else {
            // User can only delete their own 'Diajukan' perizinan
            if ($perizinan->uid !== Auth::id() || $perizinan->status !== 'Diajukan') {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal membatalkan pengajuan izin. Pastikan status masih "Diajukan"'
                ], 403);
            }
            
            $perizinan->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Pengajuan izin berhasil dibatalkan!'
            ]);
        }
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal menghapus data perizinan: ' . $e->getMessage()
        ], 500);
    }
}

// Tambahkan method baru ini di IzinController.php

/**
 * HRD/Head: Approve perizinan
 */
public function approve(Request $request, $id)
{
    try {
        $perizinan = Perizinan::with(['user', 'diketahuiOleh', 'disetujuiOleh'])->findOrFail($id);
        $currentUser = Auth::user();

        // Check authorization berdasarkan role
        if ($currentUser->role === 'hrd') {
            if ($perizinan->status_disetujui !== null) {
                return back()->with('error', 'Perizinan ini sudah diproses oleh HRD sebelumnya');
            }

            $perizinan->status_disetujui = 'Disetujui';
            $perizinan->uid_disetujui = Auth::id();
            if ($request->catatan) {
                $perizinan->catatan = $request->catatan;
            }
            $perizinan->save();

        } elseif ($currentUser->role === 'head') {
            if ($perizinan->uid_diketahui != $currentUser->id) {
                return back()->with('error', 'Anda tidak memiliki akses untuk menyetujui perizinan ini');
            }

            if ($perizinan->status_diketahui !== null) {
                return back()->with('error', 'Perizinan ini sudah Anda proses sebelumnya');
            }

            $perizinan->status_diketahui = 'Disetujui';
            if ($request->catatan) {
                $perizinan->catatan = $request->catatan;
            }
            $perizinan->save();

        } else {
            return back()->with('error', 'Anda tidak memiliki akses untuk menyetujui perizinan');
        }

        $perizinan->refresh();
        $this->updateOverallStatus($perizinan);

        // PERBAIKAN: Return back dengan flash message untuk Inertia
        return back()->with('success', "Perizinan berhasil disetujui!");
        
    } catch (\Exception $e) {
        \Log::error('Error approving perizinan: ' . $e->getMessage());
        return back()->with('error', 'Gagal menyetujui perizinan');
    }
}

public function generatePdf($id)
{
    try {
        $perizinan = Perizinan::with([
            'user:id,name,email,jabatan,divisi',
            'diketahuiOleh:id,name,email,jabatan,ttd',
            'disetujuiOleh:id,name,email,jabatan,ttd'
        ])->findOrFail($id);

        // Check authorization
        if (Auth::user()->role !== 'hrd' && Auth::user()->role !== 'admin') {
            if ($perizinan->uid !== Auth::id()) {
                abort(403, 'Unauthorized');
            }
        }

        // Format data
        $data = [
            'perizinan' => $perizinan,
            'tanggal_print' => Carbon::now()->format('d/m/Y H:i')
        ];

        // Generate PDF
        $pdf = Pdf::loadView('pdf.surat-izin', $data)
            ->setPaper('a4', 'portrait');

        // Download PDF
        $filename = 'Surat_Izin_' . $perizinan->user->name . '_' . date('Ymd') . '.pdf';
        return $pdf->download($filename);

    } catch (\Exception $e) {
        \Log::error('Error generating PDF: ' . $e->getMessage());
        return redirect()->back()->with('error', 'Gagal generate PDF');
    }
}

public function reject(Request $request, $id)
{
    // PERBAIKAN: Hapus validasi min 10 karakter
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

        if ($currentUser->role === 'hrd') {
            if ($perizinan->status_disetujui !== null) {
                return back()->with('error', 'Perizinan ini sudah diproses oleh HRD sebelumnya');
            }

            $perizinan->status_disetujui = 'Ditolak';
            $perizinan->uid_disetujui = Auth::id();
            $perizinan->catatan = $request->catatan;
            $perizinan->save();

        } elseif ($currentUser->role === 'head') {
            if ($perizinan->uid_diketahui != $currentUser->id) {
                return back()->with('error', 'Anda tidak memiliki akses untuk menolak perizinan ini');
            }

            if ($perizinan->status_diketahui !== null) {
                return back()->with('error', 'Perizinan ini sudah Anda proses sebelumnya');
            }

            $perizinan->status_diketahui = 'Ditolak';
            $perizinan->catatan = $request->catatan;
            $perizinan->save();

        } else {
            return back()->with('error', 'Anda tidak memiliki akses untuk menolak perizinan');
        }

        $perizinan->refresh();
        $this->updateOverallStatus($perizinan);

        // Return back dengan flash message
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

        // Jika salah satu ditolak, maka status keseluruhan = Ditolak
        if ($statusDiketahui === 'Ditolak' || $statusDisetujui === 'Ditolak') {
            $perizinan->status = 'Ditolak';
        }
        // Jika keduanya disetujui, maka status keseluruhan = Disetujui
        elseif ($statusDiketahui === 'Disetujui' && $statusDisetujui === 'Disetujui') {
            $perizinan->status = 'Disetujui';
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
        'keperluan' => 'required|string|min:10|max:1000'
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

        return response()->json([
            'success' => true,
            'message' => 'Perizinan berhasil ditambahkan',
            'data' => $perizinan
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal menambahkan perizinan: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Get all users (for dropdown)
     */
    public function getUsers()
    {
        $users = User::select('id', 'name', 'email', 'jabatan')
            ->orderBy('name')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }
    
    /**
     * Get all heads (for dropdown)
     */
    public function getHeads()
    {
        $heads = User::where('role', 'head')
            ->select('id', 'name', 'email', 'jabatan')
            ->orderBy('name')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $heads
        ]);
    }
}