<?php

namespace App\Http\Controllers;

use App\Models\Resign;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;


class ResignController extends Controller
{
    public function index()
    {
        return Inertia::render('Hrd/Resign', [
            'resigns' => Resign::with('user')->latest()->get(),
            'users' => User::select('id', 'name', 'email')->get(),
        ]);
    }
      public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Diajukan,Diproses,Ditolak,Diterima',
        ]);

        $resign = Resign::with('user')->findOrFail($id);
        $oldStatus = $resign->status;
        $newStatus = $request->status;
        
        $resign->update(['status' => $newStatus]);

        // Kirim notifikasi ke user jika status berubah
        if ($oldStatus !== $newStatus) {
            $statusMessages = [
                'Diproses' => 'Pengajuan resign Anda sedang diproses oleh HRD.',
                'Ditolak' => 'Pengajuan resign Anda ditolak. Silakan hubungi HRD untuk informasi lebih lanjut.',
                'Diterima' => 'Pengajuan resign Anda telah diterima. Tanggal efektif berhenti: ' . date('d F Y', strtotime($resign->tanggal_resign)),
            ];

            Notification::create([
                'user_id' => Auth::id(), // Admin/HR yang mengubah
                'to_uid' => $resign->uid, // User yang resign
                'type' => 'personal',
                'title' => "Status Resign Diubah: {$newStatus}",
                'message' => $statusMessages[$newStatus] ?? "Status resign Anda diubah menjadi: {$newStatus}",
                'link' => '/pegawai/resign',
            ]);
        }

        return redirect()->back()->with('success', 'Status resign berhasil diupdate');
    }

public function store(Request $request)
{
    // Validasi input
    $validated = $request->validate([
        'tanggal_keluar' => 'required|date|after_or_equal:today',
        'alasan' => 'required|string|min:10|max:1000',
    ], [
        'tanggal_keluar.required' => 'Tanggal keluar harus diisi',
        'tanggal_keluar.date' => 'Format tanggal tidak valid',
        'tanggal_keluar.after_or_equal' => 'Tanggal keluar tidak boleh kurang dari hari ini',
        'alasan.required' => 'Alasan keluar harus diisi',
        'alasan.min' => 'Alasan keluar minimal 10 karakter',
        'alasan.max' => 'Alasan keluar maksimal 1000 karakter',
    ]);
    try {
        // Simpan data resign
        $resign = Resign::create([
            'uid' => Auth::id(),
            'tanggal_keluar' => $validated['tanggal_keluar'],
            'alasan' => $validated['alasan'],
            'status' => 'Diajukan', 
            'dokument' => null,
            'isDokument' => null,
        ]);

        // Kirim notifikasi untuk HRD
        $userName = Auth::user()->nama ?? Auth::user()->name;
        
        Notification::create([
            'user_id' => Auth::id(), // User yang mengajukan resign
            'to_uid' => null, // Dikosongkan untuk notifikasi ke HRD
            'title' => 'Pengajuan Resign Baru',
            'message' => "{$userName} telah mengajukan resign dengan tanggal keluar {$validated['tanggal_keluar']}",
            'link' => '/resign/manage', // Sesuaikan dengan route management resign HRD
            'is_read' => false,
            'type' => 'hrd'
        ]);

        return redirect()->back()->with('success', 'Pengajuan resign berhasil diajukan');
    } catch (\Exception $e) {
        return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
    }
}

public function update(Request $request, $id)
{
    // Validasi input
    $validated = $request->validate([
        'tanggal_keluar' => 'required|date|after_or_equal:today',
        'alasan' => 'required|string|min:10|max:1000',
    ]);
    
    try {
        $resign = Resign::where('id', $id)
            ->where('uid', Auth::id())
            ->firstOrFail();
        
        // Hanya bisa update jika status masih Diajukan
        if ($resign->status !== 'Diajukan') {
            return redirect()->back()->with('error', 'Pengajuan yang sudah diproses tidak dapat diubah');
        }
        
        $resign->update([
            'tanggal_keluar' => $validated['tanggal_keluar'],
            'alasan' => $validated['alasan'],
        ]);

        // Kirim notifikasi update untuk HRD
        $userName = Auth::user()->nama ?? Auth::user()->name;
        
        Notification::create([
            'user_id' => Auth::id(),
            'to_uid' => null, // Dikosongkan untuk notifikasi ke HRD
            'title' => 'Pengajuan Resign Diperbarui',
            'message' => "{$userName} telah memperbarui pengajuan resign",
            'link' => '/resign/manage',
            'is_read' => false,
            'type' => 'hrd'
        ]);

        return redirect()->back()->with('success', 'Pengajuan resign berhasil diperbarui');
    } catch (\Exception $e) {
        return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
    }
}

public function destroy($id)
{
    try {
        $resign = Resign::where('id', $id)
            ->where('uid', Auth::id())
            ->firstOrFail();
        
        // Hanya bisa hapus jika status masih Diajukan
        if ($resign->status !== 'Diajukan') {
            return redirect()->back()->with('error', 'Pengajuan yang sudah diproses tidak dapat dihapus');
        }

        // Kirim notifikasi pembatalan untuk HRD sebelum dihapus
        $userName = Auth::user()->nama ?? Auth::user()->name;
        
        Notification::create([
            'user_id' => Auth::id(),
            'to_uid' => null, // Dikosongkan untuk notifikasi ke HRD
            'title' => 'Pengajuan Resign Dibatalkan',
            'message' => "{$userName} telah membatalkan pengajuan resign",
            'link' => '/resign/manage',
            'is_read' => false,
            'type' => 'hrd'
        ]);
        
        $resign->delete();
        
        return redirect()->back()->with('success', 'Pengajuan resign berhasil dibatalkan');
    } catch (\Exception $e) {
        return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
    }
}

public function filestore(Request $request, $id)
{
    $validated = $request->validate([
        'evaluasi' => 'required|array',
        'saranPerbaikan' => 'required|array',
        'informasiTambahan' => 'nullable|string',
        'untukMempertahankan' => 'nullable|string',
        'bersediaDipekerjakan' => 'nullable|string',
        'perusahaanBaru' => 'nullable|string',
        'jabatanBaru' => 'nullable|string',
        'gajiBaru' => 'nullable|string',
    ]);
    
    $resign = Resign::findOrFail($id);
    
    // Generate PDF
    $pegawai = Auth::user();
    $data = [
        'nama' => $pegawai->nama ?? 'Nama Karyawan',
        'divisi' => $pegawai->divisi ?? 'Divisi/Departemen',
        'tanggal_efektif' => now()->format('d/m/Y'),
        'evaluasi' => $validated['evaluasi'],
        'saranPerbaikan' => $validated['saranPerbaikan'],
        'informasiTambahan' => $validated['informasiTambahan'] ?? '',
        'untukMempertahankan' => $validated['untukMempertahankan'] ?? '',
        'bersediaDipekerjakan' => $validated['bersediaDipekerjakan'] ?? '',
        'perusahaanBaru' => $validated['perusahaanBaru'] ?? '',
        'jabatanBaru' => $validated['jabatanBaru'] ?? '',
        'gajiBaru' => $validated['gajiBaru'] ?? '',
    ];
    
    $pdf = PDF::loadView('pdf.exit-interview', $data);
    
    // Simpan PDF ke storage
    $fileName = 'exit-interview-' . $pegawai->nama . '-' . time() . '.pdf';
    $filePath = 'dokumen/resign/' . $fileName;
    Storage::put($filePath, $pdf->output());
    
    // Update table resigns
    $resign->update([
        'status' => "Diproses",
        'dokument' => $filePath,
        'isDokument' => true
    ]);

    // Kirim notifikasi untuk HRD bahwa dokumen exit interview sudah diisi
    $userName = Auth::user()->nama ?? Auth::user()->name;
    
    Notification::create([
        'user_id' => Auth::id(),
        'to_uid' => null, // Dikosongkan untuk notifikasi ke HRD
        'title' => 'Dokumen Exit Interview Diserahkan',
        'message' => "{$userName} telah menyelesaikan dan menyerahkan dokumen exit interview",
        'link' => '/resign/manage',
        'is_read' => false,
        'type' => 'hrd'
    ]);
    
    return redirect('/dokumen')->with('success', 'Exit interview berhasil disimpan!');
}
}