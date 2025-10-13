<?php

namespace App\Http\Controllers;

use App\Models\Resign;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PegawaiController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        $resigns = Resign::where('uid', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($resign) {
                return [
                    'id' => $resign->id,
                    'jenisSurat' => 'Pengajuan Resign',
                    'tanggal' => $resign->created_at->format('d M Y'),
                    'tanggal_keluar' => $resign->tanggal_keluar,
                    'alasan' => $resign->alasan,
                    'dokument' => $resign->dokument,
                    'isDokument' => $resign->isDokument,
                    'status' => $resign->status,
                    'statusColor' => $this->getStatusColor($resign->status)
                ];
            });
        return Inertia::render('User/Pengajuan/Dokumen', [
            'riwayatResign' => $resigns
        ]);
    }

    private function getStatusColor($status)
    {
        return match($status) {
            'Disetujui' => 'bg-green-100 text-green-800',
            'Proses' => 'bg-yellow-100 text-yellow-800',
            'Ditolak' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800'
        };
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
            $resign = Resign::create([
                'uid' => Auth::id(),
                'tanggal_keluar' => $validated['tanggal_keluar'],
                'alasan' => $validated['alasan'],
                'status' => 'Diajukan', 
                'dokument' => null,
            ]);

            // Kirim notifikasi ke semua HRD
            $this->sendNotificationToHRD(
                'Pengajuan Resign Baru',
                Auth::user()->nama . ' telah mengajukan resign dengan tanggal keluar ' . date('d M Y', strtotime($validated['tanggal_keluar'])),
                '/hrd/resign/' . $resign->id
            );

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

            // Hanya bisa update jika status masih pending
            if ($resign->status !== 'pending') {
                return redirect()->back()->with('error', 'Pengajuan yang sudah diproses tidak dapat diubah');
            }

            $resign->update([
                'tanggal_keluar' => $validated['tanggal_keluar'],
                'alasan' => $validated['alasan'],
            ]);

            // Kirim notifikasi ke semua HRD
            $this->sendNotificationToHRD(
                'Pengajuan Resign Diperbarui',
                Auth::user()->nama . ' telah memperbarui pengajuan resign dengan tanggal keluar ' . date('d M Y', strtotime($validated['tanggal_keluar'])),
                '/hrd/resign/' . $resign->id
            );

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

            // Hanya bisa hapus jika status masih pending
            if ($resign->status !== 'pending') {
                return redirect()->back()->with('error', 'Pengajuan yang sudah diproses tidak dapat dihapus');
            }

            $resign->delete();

            return redirect()->back()->with('success', 'Pengajuan resign berhasil dibatalkan');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    // Method untuk menyimpan data (POST request dari Inertia)
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

        // Kirim notifikasi ke semua HRD
        $this->sendNotificationToHRD(
            'Exit Interview Diselesaikan',
            Auth::user()->nama . ' telah menyelesaikan exit interview untuk pengajuan resign',
            '/hrd/resign/' . $resign->id
        );

        return redirect('/dokumen')->with('success', 'Exit interview berhasil disimpan!');
    }

    /**
     * Kirim notifikasi ke semua user dengan role HRD
     */
    private function sendNotificationToHRD($title, $message, $link)
    {
        // Ambil semua user dengan role HRD
        $hrdUsers = User::where('role', 'hrd')->get();

        foreach ($hrdUsers as $hrd) {
            Notification::create([
                'user_id' => Auth::id(), // Pengirim (user yang login)
                'to_uid' => null,
                'title' => $title,
                'message' => $message,
                'link' => $link,
                'is_read' => false,
                'type' => 'hrd'
            ]);
        }
    }
}