<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Sakit;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Kehadiran;
use Carbon\Carbon;

class SakitController extends Controller
{
    /**
     * Tampilkan halaman index izin sakit (User)
     */
    public function index()
    {
        $sakits = Sakit::with('user')
            ->where('uid', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($sakit) {
                return [
                    'id' => $sakit->id,
                    'tanggal_mulai' => $sakit->tanggal_mulai,
                    'tanggal_selesai' => $sakit->tanggal_selesai,
                    'keterangan' => $sakit->keterangan,
                    'bukti' => $sakit->bukti,
                    'bukti_url' => $sakit->bukti ? Storage::url($sakit->bukti) : null,
                    'status' => $sakit->status,
                    'created_at' => $sakit->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return Inertia::render('User/Sakit', [
            'sakits' => $sakits,
            'flash' => session('flash'),
        ]);
    }

    /**
     * Simpan data izin sakit baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'keterangan' => 'required|string|max:500',
            'bukti' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ], [
            'tanggal_mulai.required' => 'Tanggal mulai harus diisi',
            'tanggal_selesai.required' => 'Tanggal selesai harus diisi',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai',
            'keterangan.required' => 'Keterangan harus diisi',
            'bukti.mimes' => 'Format file harus PDF, JPG, JPEG, atau PNG',
            'bukti.max' => 'Ukuran file maksimal 2MB',
        ]);

        $buktiPath = null;
        if ($request->hasFile('bukti')) {
            $file = $request->file('bukti');
            $fileName = time() . '_' . Auth::id() . '_' . $file->getClientOriginalName();
            $buktiPath = $file->storeAs('bukti_sakit', $fileName, 'public');
        }

        Sakit::create([
            'uid' => Auth::id(),
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'keterangan' => $request->keterangan,
            'bukti' => $buktiPath,
            'status' => 'Diproses',
        ]);

        return redirect()->route('sakit.index')
            ->with('flash', [
                'success' => 'Pengajuan izin sakit berhasil diajukan'
            ]);
    }

    /**
 * Simpan data izin sakit baru dari admin
 */
public function adminStore(Request $request)
{
    $request->validate([
        'uid' => 'required|exists:users,id',
        'tanggal_mulai' => 'required|date',
        'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        'keterangan' => 'required|string|max:500',
        'bukti' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        'status' => 'nullable|in:Diproses,Disetujui,Ditolak',
    ], [
        'uid.required' => 'Karyawan harus dipilih',
        'uid.exists' => 'Karyawan tidak ditemukan',
        'tanggal_mulai.required' => 'Tanggal mulai harus diisi',
        'tanggal_selesai.required' => 'Tanggal selesai harus diisi',
        'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai',
        'keterangan.required' => 'Keterangan harus diisi',
        'bukti.mimes' => 'Format file harus PDF, JPG, JPEG, atau PNG',
        'bukti.max' => 'Ukuran file maksimal 2MB',
        'status.in' => 'Status harus Diproses, Disetujui, atau Ditolak',
    ]);

    $buktiPath = null;
    if ($request->hasFile('bukti')) {
        $file = $request->file('bukti');
        $fileName = time() . '_' . $request->uid . '_' . $file->getClientOriginalName();
        $buktiPath = $file->storeAs('bukti_sakit', $fileName, 'public');
    }

    $status = $request->status ?? 'Diproses';

    $sakit = Sakit::create([
        'uid' => $request->uid,
        'tanggal_mulai' => $request->tanggal_mulai,
        'tanggal_selesai' => $request->tanggal_selesai,
        'keterangan' => $request->keterangan,
        'bukti' => $buktiPath,
        'status' => $status,
    ]);

    // Jika status langsung Disetujui saat dibuat, buat kehadiran
    if ($status === 'Disetujui') {
        $this->updateKehadiranSakit($sakit);
    }

    return redirect()->route('sakit.admin')
        ->with('flash', [
            'success' => 'Data izin sakit berhasil ditambahkan'
        ]);
}
    /**
     * Update data izin sakit (User)
     */
    public function update(Request $request, $id)
    {
        $sakit = Sakit::where('uid', Auth::id())->findOrFail($id);

        if ($sakit->status !== 'Diproses') {
            return redirect()->route('sakit.index')
                ->with('flash', [
                    'error' => 'Izin sakit yang sudah diproses tidak dapat diubah'
                ]);
        }

        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'keterangan' => 'required|string|max:500',
            'bukti' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ], [
            'tanggal_mulai.required' => 'Tanggal mulai harus diisi',
            'tanggal_selesai.required' => 'Tanggal selesai harus diisi',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai',
            'keterangan.required' => 'Keterangan harus diisi',
            'bukti.mimes' => 'Format file harus PDF, JPG, JPEG, atau PNG',
            'bukti.max' => 'Ukuran file maksimal 2MB',
        ]);

        $updateData = [
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'keterangan' => $request->keterangan,
        ];

        if ($request->hasFile('bukti')) {
            if ($sakit->bukti && Storage::disk('public')->exists($sakit->bukti)) {
                Storage::disk('public')->delete($sakit->bukti);
            }

            $file = $request->file('bukti');
            $fileName = time() . '_' . Auth::id() . '_' . $file->getClientOriginalName();
            $updateData['bukti'] = $file->storeAs('bukti_sakit', $fileName, 'public');
        }

        $sakit->update($updateData);

        return redirect()->route('sakit.index')
            ->with('flash', [
                'success' => 'Data izin sakit berhasil diupdate'
            ]);
    }

    /**
     * Hapus data izin sakit (User)
     */
    public function destroy($id)
    {
        $sakit = Sakit::where('uid', Auth::id())->findOrFail($id);

        if ($sakit->status !== 'Diproses') {
            return redirect()->route('sakit.index')
                ->with('flash', [
                    'error' => 'Izin sakit yang sudah diproses tidak dapat dihapus'
                ]);
        }

        if ($sakit->bukti && Storage::disk('public')->exists($sakit->bukti)) {
            Storage::disk('public')->delete($sakit->bukti);
        }

        $sakit->delete();

        return redirect()->route('sakit.index')
            ->with('flash', [
                'success' => 'Data izin sakit berhasil dihapus'
            ]);
    }

    /**
     * Update status izin sakit (Admin only)
     */
    private function updateKehadiranSakit($sakit)
{
    $tanggalMulai = Carbon::parse($sakit->tanggal_mulai);
    $tanggalSelesai = Carbon::parse($sakit->tanggal_selesai);
    
    // Loop untuk setiap tanggal dalam range izin sakit
    for ($date = $tanggalMulai; $date->lte($tanggalSelesai); $date->addDay()) {
        Kehadiran::updateOrCreate(
            [
                'uid' => $sakit->uid,
                'tanggal' => $date->format('Y-m-d'),
            ],
            [
                'status' => 'Sakit',
                'keterangan' => $sakit->keterangan,
                'jam_kedatangan' => null,
                'jam_pulang' => null,
            ]
        );
    }
}

    public function updateStatus(Request $request, $id)
{
    $request->validate([
        'status' => 'required|in:Diproses,Disetujui,Ditolak',
    ]);

    $sakit = Sakit::findOrFail($id);
    $oldStatus = $sakit->status;
    
    $sakit->update([
        'status' => $request->status,
    ]);

    // Jika status berubah menjadi Disetujui, buat/update kehadiran
    if ($request->status === 'Disetujui' && $oldStatus !== 'Disetujui') {
        $this->updateKehadiranSakit($sakit);
    }

    return redirect()->route('sakit.admin')
        ->with('flash', [
            'success' => 'Status izin sakit berhasil diupdate menjadi ' . $request->status
        ]);
}

    /**
 * Download bukti sakit
 */
public function download($id)
{
    $sakit = Sakit::findOrFail($id);
    
    // Cek authorization: user hanya bisa download miliknya, admin bisa download semua
    if (Auth::user()->role !== 'admin' && $sakit->uid !== Auth::id()) {
        abort(403, 'Unauthorized');
    }
    
    if (!$sakit->bukti || !Storage::disk('public')->exists($sakit->bukti)) {
        abort(404, 'File tidak ditemukan');
    }
    
    return Storage::disk('public')->download($sakit->bukti);
}

/**
 * Tampilkan halaman admin untuk kelola semua izin sakit
 */
public function admin()
{
    $sakits = Sakit::with('user')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($sakit) {
            return [
                'id' => $sakit->id,
                'uid' => $sakit->uid,
                'user_name' => $sakit->user->name ?? 'Unknown',
                'user_email' => $sakit->user->email ?? '-',
                'tanggal_mulai' => $sakit->tanggal_mulai,
                'tanggal_selesai' => $sakit->tanggal_selesai,
                'keterangan' => $sakit->keterangan,
                'bukti' => $sakit->bukti,
                'bukti_url' => $sakit->bukti ? Storage::url($sakit->bukti) : null,
                'status' => $sakit->status,
                'created_at' => $sakit->created_at->format('Y-m-d H:i:s'),
            ];
        });

    return Inertia::render('Hrd/Perizinan/SakitAdmin', [
        'sakits' => $sakits,
        'flash' => session('flash'),
    ]);
}

/**
 * Update data izin sakit (Admin)
 */

public function adminUpdate(Request $request, $id)
{
    $sakit = Sakit::findOrFail($id);

    $request->validate([
        'tanggal_mulai' => 'required|date',
        'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        'keterangan' => 'required|string|max:500',
        'bukti' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        'status' => 'nullable|in:Diproses,Disetujui,Ditolak',
    ], [
        'tanggal_mulai.required' => 'Tanggal mulai harus diisi',
        'tanggal_selesai.required' => 'Tanggal selesai harus diisi',
        'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai',
        'keterangan.required' => 'Keterangan harus diisi',
        'bukti.mimes' => 'Format file harus PDF, JPG, JPEG, atau PNG',
        'bukti.max' => 'Ukuran file maksimal 2MB',
        'status.in' => 'Status harus Diproses, Disetujui, atau Ditolak',
    ]);

    $oldStatus = $sakit->status;
    $newStatus = $request->status ?? 'Diproses';

    $updateData = [
        'tanggal_mulai' => $request->tanggal_mulai,
        'tanggal_selesai' => $request->tanggal_selesai,
        'keterangan' => $request->keterangan,
        'status' => $newStatus,
    ];

    if ($request->hasFile('bukti')) {
        if ($sakit->bukti && Storage::disk('public')->exists($sakit->bukti)) {
            Storage::disk('public')->delete($sakit->bukti);
        }

        $file = $request->file('bukti');
        $fileName = time() . '_' . $sakit->uid . '_' . $file->getClientOriginalName();
        $updateData['bukti'] = $file->storeAs('bukti_sakit', $fileName, 'public');
    }

    $sakit->update($updateData);

    // Jika status berubah menjadi Disetujui, buat/update kehadiran
    if ($newStatus === 'Disetujui' && $oldStatus !== 'Disetujui') {
        $this->updateKehadiranSakit($sakit);
    }

    return redirect()->route('sakit.admin')
        ->with('flash', [
            'success' => 'Data izin sakit berhasil diupdate'
        ]);
}

/**
 * Hapus data izin sakit (Admin)
 */
public function adminDestroy($id)
{
    $sakit = Sakit::findOrFail($id);
    if ($sakit->bukti && Storage::disk('public')->exists($sakit->bukti)) {
        Storage::disk('public')->delete($sakit->bukti);
    }
    $sakit->delete();
    return redirect()->route('sakit.admin')
        ->with('flash', [
            'success' => 'Data izin sakit berhasil dihapus'
        ]);
}
}