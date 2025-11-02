<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\JatahCuti;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PemakaianCuti;
use Barryvdh\DomPDF\Facade\Pdf;

class CutiController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        $tmk = \Carbon\Carbon::parse($user->tmk);
        $today = \Carbon\Carbon::now();
        
        $diffInDays = $today->diffInDays($tmk);
        $years = 0;
        $months = 0;
        $days = 0;
        
        // Hitung tahun penuh
        $tempDate = $tmk->copy();
        while ($tempDate->copy()->addYear()->lte($today)) {
            $years++;
            $tempDate->addYear();
        }
        
        // Hitung bulan penuh setelah tahun
        while ($tempDate->copy()->addMonth()->lte($today)) {
            $months++;
            $tempDate->addMonth();
        }
        
        // Hitung sisa hari
        $days = $tempDate->diffInDays($today);
        
        // ✅ PERBAIKAN: Tentukan periode berdasarkan tahun penuh yang sudah dilalui
        if ($years < 1) {
            // Belum genap 1 tahun = periode 0
            $currentPeriod = 0;
        } else {
            // Sudah 1 tahun atau lebih = periode sesuai tahun penuh
            $currentPeriod = $years;
        }
        
        // Hitung tahun anniversary
        $currentAnniversary = $tmk->copy()->setYear($today->year);
        if ($today->lt($currentAnniversary)) {
            $currentAnniversary->subYear();
        }
        
        // SPECIAL HANDLING untuk periode 0
        if ($currentPeriod == 0) {
            $periodStartDate = $tmk;
            $periodEndDate = $tmk->copy()->addYear()->subDay();
        } else {
            $periodStartDate = $currentAnniversary;
            $periodEndDate = $currentAnniversary->copy()->addYear()->subDay();
        }
        
        $currentJatahCuti = JatahCuti::where('uid', $user->id)
            ->where('tahun_ke', $currentPeriod)
            ->first();
        
        if (!$currentJatahCuti) {
            $jumlahCuti = $this->calculateCutiByPeriod($currentPeriod, null);
            $currentJatahCuti = JatahCuti::create([
                'uid' => $user->id,
                'tahun_ke' => $currentPeriod,
                'tahun' => $periodStartDate->year,
                'jumlah_cuti' => $jumlahCuti,
                'sisa_cuti' => $jumlahCuti,
                'cuti_dipakai' => 0,
                'tmk' => $user->tmk,
                'pinjam_tahun_prev' => 0,
                'pinjam_tahun_next' => 0,
                'cuti_bersama' => 0,
            ]);
        }
        
        // Ambil/buat jatah cuti periode berikutnya
        $nextPeriod = $currentPeriod + 1;
        $nextJatahCuti = JatahCuti::where('uid', $user->id)
            ->where('tahun_ke', $nextPeriod)
            ->first();
        
        if (!$nextJatahCuti) {
            $jumlahCutiNext = $this->calculateCutiByPeriod($nextPeriod, null);
            $nextPeriodStart = $periodEndDate->copy()->addDay();
            
            $nextJatahCuti = JatahCuti::create([
                'uid' => $user->id,
                'tahun_ke' => $nextPeriod,
                'tahun' => $nextPeriodStart->year,
                'jumlah_cuti' => $jumlahCutiNext,
                'sisa_cuti' => $jumlahCutiNext,
                'cuti_dipakai' => 0,
                'keterangan' => "Periode {$nextPeriod}" . ($currentPeriod == 0 ? " (Akan Aktif Setelah 1 Tahun)" : " (Dapat Dipinjam)"),
                'tmk' => $user->tmk,
                'pinjam_tahun_prev' => 0,
                'pinjam_tahun_next' => 0,
                'cuti_bersama' => 0,
            ]);
        }
        
        // Ambil jatah cuti periode sebelumnya (jika ada dan bukan periode 0)
        $prevPeriod = $currentPeriod - 1;
        $prevJatahCuti = null;
        if ($prevPeriod > 0) {
            $prevJatahCuti = JatahCuti::where('uid', $user->id)
                ->where('tahun_ke', $prevPeriod)
                ->first();
        }
        $jatahCutiData = [
            [
                'id' => $currentJatahCuti->id,
                'tahun' => $currentJatahCuti->tahun,
                'tahun_ke' => $currentJatahCuti->tahun_ke,
                'jumlah_cuti' => $currentJatahCuti->jumlah_cuti,
                'cuti_dipakai' => $currentJatahCuti->cuti_dipakai,
                'sisa_cuti' => $currentJatahCuti->sisa_cuti,
                'is_current' => true,
                'is_borrowable' => false,
                'periode_range' => $periodStartDate->format('d M Y') . ' - ' . $periodEndDate->format('d M Y'),
                'tmk' => $user->tmk,
                'masa_kerja_tahun' => $years,
                'masa_kerja_bulan' => $months,
                'masa_kerja_hari' => $days,
                'total_hari_kerja' => $diffInDays,
                'pinjam_tahun_0' => $currentJatahCuti->pinjam_tahun_prev ?? 0,
                'pinjam_tahun_2' => $currentJatahCuti->pinjam_tahun_next ?? 0,
                'cuti_bersama' => $currentJatahCuti->cuti_bersama ?? 0,
                'is_periode_0' => $currentPeriod == 0,
            ],
            [
                'id' => $nextJatahCuti->id,
                'tahun' => $nextJatahCuti->tahun,
                'tahun_ke' => $nextJatahCuti->tahun_ke,
                'jumlah_cuti' => $nextJatahCuti->jumlah_cuti,
                'cuti_dipakai' => $nextJatahCuti->cuti_dipakai,
                'sisa_cuti' => $nextJatahCuti->sisa_cuti,
                'is_current' => false,
                'is_borrowable' => $currentPeriod > 0,
                'label' => $currentPeriod == 0 ? "Periode 1 (Akan Aktif Setelah 1 Tahun)" : "Periode {$nextPeriod} (Dapat Dipinjam)",
                'periode_range' => $periodEndDate->copy()->addDay()->format('d M Y') . ' - ' . $periodEndDate->copy()->addYear()->format('d M Y'),
                'tmk' => $user->tmk,
                'masa_kerja_tahun' => $years,
                'masa_kerja_bulan' => $months,
                'masa_kerja_hari' => $days,
                'total_hari_kerja' => $diffInDays,
                'pinjam_tahun_0' => $nextJatahCuti->pinjam_tahun_prev ?? 0,
                'pinjam_tahun_2' => $nextJatahCuti->pinjam_tahun_next ?? 0,
                'cuti_bersama' => $nextJatahCuti->cuti_bersama ?? 0,
                'is_periode_0' => false,
            ]
        ];
        
        // Tambahkan info periode sebelumnya jika ada
        if ($prevJatahCuti) {
            $jatahCutiData[] = [
                'id' => $prevJatahCuti->id,
                'tahun' => $prevJatahCuti->tahun,
                'tahun_ke' => $prevJatahCuti->tahun_ke,
                'jumlah_cuti' => $prevJatahCuti->jumlah_cuti,
                'cuti_dipakai' => $prevJatahCuti->cuti_dipakai,
                'sisa_cuti' => $prevJatahCuti->sisa_cuti,
                'is_current' => false,
                'is_borrowable' => false,
                'label' => "Periode {$prevPeriod} (Sebelumnya)",
                'periode_range' => $periodStartDate->copy()->subYear()->format('d M Y') . ' - ' . $periodStartDate->copy()->subDay()->format('d M Y'),
                'tmk' => $user->tmk,
                'masa_kerja_tahun' => $years,
                'masa_kerja_bulan' => $months,
                'masa_kerja_hari' => $days,
                'total_hari_kerja' => $diffInDays,
                'pinjam_tahun_0' => $prevJatahCuti->pinjam_tahun_prev ?? 0,
                'pinjam_tahun_2' => $prevJatahCuti->pinjam_tahun_next ?? 0,
                'cuti_bersama' => $prevJatahCuti->cuti_bersama ?? 0,
                'is_periode_0' => false,
            ];
        }
        $pemakaianCuti = PemakaianCuti::with([
            'user', 'jatahCuti', 'penerimaTugas',
            'diketahuiAtasanUser', 'diketahuiHrdUser', 'disetujuiUser'
        ])
        ->where('uid', $user->id)
        ->orderBy('tanggal_pengajuan', 'desc') 
        ->orderBy('created_at', 'desc')        
        ->paginate(10)                         
        ->through(function($item) {
            return [
                'id' => $item->id,
                'tanggal_pengajuan' => $item->tanggal_pengajuan,
                'tanggal_mulai' => $item->tanggal_mulai,
                'tanggal_selesai' => $item->tanggal_selesai,
                'jumlah_hari' => $item->jumlah_hari,
                'alasan' => $item->alasan,
                'catatan' => $item->catatan,
                'cuti_setengah_hari' => $item->cuti_setengah_hari,
                'id_penerima_tugas' => $item->id_penerima_tugas,
                'tugas' => $item->tugas,
                'jatah_cuti' => [
                    'tahun' => $item->jatahCuti->tahun ?? null,
                    'tahun_ke' => $item->jatahCuti->tahun_ke ?? null,
                    'sisa_cuti' => $item->jatahCuti->sisa_cuti ?? 0,
                ],
                'penerima_tugas' => $item->penerimaTugas ? [
                    'id' => $item->penerimaTugas->id,
                    'name' => $item->penerimaTugas->name,
                ] : null,
                'diketahui_atasan_user' => $item->diketahuiAtasanUser ? [
                    'id' => $item->diketahuiAtasanUser->id,
                    'name' => $item->diketahuiAtasanUser->name,
                    'jabatan' => $item->diketahuiAtasanUser->jabatan,
                ] : null,
                'diketahui_hrd_user' => $item->diketahuiHrdUser ? [
                    'id' => $item->diketahuiHrdUser->id,
                    'name' => $item->diketahuiHrdUser->name,
                    'jabatan' => $item->diketahuiHrdUser->jabatan,
                ] : null,
                'disetujui_user' => $item->disetujuiUser ? [
                    'id' => $item->disetujuiUser->id,
                    'name' => $item->disetujuiUser->name,
                    'jabatan' => $item->disetujuiUser->jabatan,
                ] : null,
                'status_diketahui_atasan' => $item->status_diketahui_atasan,
                'status_diketahui_hrd' => $item->status_diketahui_hrd,
                'status_disetujui' => $item->status_disetujui,
                'status_final' => $item->status_final,
            ];
        });
        
        // Ganti return Inertia::render menjadi:
        return Inertia::render('User/Cuti', [
            'jatahCuti' => $jatahCutiData,
            'pemakaianCuti' => $pemakaianCuti,  // ✅ Sudah include pagination data
            'paginationLinks' => $pemakaianCuti->linkCollection()->toArray(), // ✅ Links untuk navigation
            'periodInfo' => [
                'current' => $currentPeriod,
                'start' => $periodStartDate->format('d F Y'),
                'end' => $periodEndDate->format('d F Y'),
                'is_periode_0' => $currentPeriod == 0,
                'days_until_first_year' => $currentPeriod == 0 ? max(0, 365 - $diffInDays) : 0,
            ],
            'auth' => ['user' => $user]
        ]);       
    }

   public function storePengajuan(Request $request)
{
    $validated = $request->validate([
        'jatah_cuti_id' => 'required|exists:jatah_cuti,id',
        'tanggal_mulai' => 'required|date',
        'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        'cuti_setengah_hari' => 'boolean',
        'alasan' => 'required|string|max:500',
        'id_penerima_tugas' => 'nullable|exists:users,id',
        'tugas' => 'nullable|string|max:1000',
        'diketahui_atasan' => 'nullable|exists:users,id',
        'diketahui_hrd' => 'nullable|exists:users,id',
        'disetujui' => 'nullable|exists:users,id',
    ]);

    $user = auth()->user();
    $jatahCuti = JatahCuti::findOrFail($validated['jatah_cuti_id']);
    
    // ✅ TAMBAHKAN VALIDASI PERIODE DI SINI
    // Hitung periode aktif user
    $tmkDate = \Carbon\Carbon::parse($user->tmk);
    $today = \Carbon\Carbon::now();
    $years = 0;
    $tempDate = $tmkDate->copy();
    
    while ($tempDate->copy()->addYear()->lte($today)) {
        $years++;
        $tempDate->addYear();
    }
    
    $activePeriod = $years;
    
    // ✅ VALIDASI: Tidak boleh pakai periode yang lebih kecil dari periode aktif
    if ($jatahCuti->tahun_ke < $activePeriod) {
        return back()->withErrors([
            'error' => 'Tidak dapat menggunakan cuti dari periode yang sudah lewat. Gunakan periode aktif atau periode masa depan.'
        ]);
    }
    
    // ✅ VALIDASI: Jika pakai periode masa depan saat masih periode 0
    if ($jatahCuti->tahun_ke > $activePeriod && $activePeriod == 0) {
        return back()->withErrors([
            'error' => 'Anda masih dalam periode percobaan (belum 1 tahun). Tidak dapat meminjam cuti periode masa depan.'
        ]);
    }
    
    // Validasi ownership
    if ($jatahCuti->uid !== $user->id) {
        return back()->withErrors(['error' => 'Jatah cuti tidak valid']);
    }

    $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai']);
    $tanggalSelesai = \Carbon\Carbon::parse($validated['tanggal_selesai']);
    
    $jumlahHari = 0;
    $currentDate = $tanggalMulai->copy();
    
    while ($currentDate->lte($tanggalSelesai)) {
        if ($currentDate->dayOfWeek >= 1 && $currentDate->dayOfWeek <= 5) {
            $jumlahHari++;
        }
        $currentDate->addDay();
    }
    
    if ($request->cuti_setengah_hari) {
        $jumlahHari = 0.5;
    }

    // Validasi sisa cuti
    if ($jatahCuti->sisa_cuti < $jumlahHari) {
        return back()->withErrors(['error' => 'Sisa cuti tidak mencukupi. Sisa cuti Anda: ' . $jatahCuti->sisa_cuti . ' hari']);
    }

    // Pengecekan bentrok
    $bentrok = PemakaianCuti::where('uid', $user->id)
        ->where(function($query) {
            $query->where(function($q) {
                $q->where('status_diketahui_atasan', '!=', 'ditolak')
                  ->orWhereNull('status_diketahui_atasan');
            })
            ->where(function($q) {
                $q->where('status_diketahui_hrd', '!=', 'ditolak')
                  ->orWhereNull('status_diketahui_hrd');
            })
            ->where(function($q) {
                $q->where('status_disetujui', '!=', 'ditolak')
                  ->orWhereNull('status_disetujui');
            });
        })
        ->where(function($query) use ($tanggalMulai, $tanggalSelesai) {
            $query->whereBetween('tanggal_mulai', [$tanggalMulai, $tanggalSelesai])
                  ->orWhereBetween('tanggal_selesai', [$tanggalMulai, $tanggalSelesai])
                  ->orWhere(function($q) use ($tanggalMulai, $tanggalSelesai) {
                      $q->where('tanggal_mulai', '<=', $tanggalMulai)
                        ->where('tanggal_selesai', '>=', $tanggalSelesai);
                  });
        })
        ->exists();

    if ($bentrok) {
        return back()->withErrors(['error' => 'Tanggal yang dipilih bentrok dengan pengajuan cuti lainnya']);
    }

    // Create pengajuan cuti
    PemakaianCuti::create([
        'uid' => $user->id,
        'jatah_cuti_id' => $validated['jatah_cuti_id'],
        'tanggal_mulai' => $validated['tanggal_mulai'],
        'tanggal_selesai' => $validated['tanggal_selesai'],
        'cuti_setengah_hari' => $request->cuti_setengah_hari ?? false,
        'jumlah_hari' => $jumlahHari,
        'alasan' => $validated['alasan'],
        'tanggal_pengajuan' => now(),
        'id_penerima_tugas' => $validated['id_penerima_tugas'] ?? null,
        'tugas' => $validated['tugas'] ?? null,
        'diketahui_atasan' => $validated['diketahui_atasan'] ?? null,
        'diketahui_hrd' => $validated['diketahui_hrd'] ?? null,
        'disetujui' => $validated['disetujui'] ?? null,
        'status_diketahui_atasan' => $validated['diketahui_atasan'] ? 'diproses' : null,
        'status_diketahui_hrd' => $validated['diketahui_hrd'] ? 'diproses' : null,
        'status_disetujui' => $validated['disetujui'] ? 'diproses' : null,
    ]);

    return redirect()->back()->with('success', 'Pengajuan cuti berhasil diajukan dan menunggu persetujuan');
}

    // ========================================
    // FUNCTION LAINNYA TETAP SAMA (tidak ada perubahan)
    // ========================================
    
    public function pinjamCutiNext(Request $request)
    {
        $validated = $request->validate([
            'jatah_cuti_id_current' => 'required|exists:jatah_cuti,id',
            'jatah_cuti_id_next' => 'required|exists:jatah_cuti,id',
            'jumlah_pinjam' => 'required|numeric|min:0.5|max:12',
        ]);

        $user = auth()->user();
        
        $currentJatah = JatahCuti::findOrFail($validated['jatah_cuti_id_current']);
        $nextJatah = JatahCuti::findOrFail($validated['jatah_cuti_id_next']);
        
        if ($currentJatah->uid !== $user->id || $nextJatah->uid !== $user->id) {
            return back()->withErrors(['error' => 'Jatah cuti tidak valid']);
        }
        
        if ($nextJatah->tahun_ke !== $currentJatah->tahun_ke + 1) {
            return back()->withErrors(['error' => 'Periode tidak berurutan']);
        }
        
        if ($currentJatah->tahun_ke == 0) {
            return back()->withErrors(['error' => 'Tidak dapat meminjam cuti pada periode percobaan (belum 1 tahun)']);
        }
        
        if ($nextJatah->sisa_cuti < $validated['jumlah_pinjam']) {
            return back()->withErrors(['error' => 'Sisa cuti periode berikutnya tidak mencukupi']);
        }
        
        \DB::beginTransaction();
        try {
            $currentJatah->sisa_cuti += $validated['jumlah_pinjam'];
            $currentJatah->pinjam_tahun_next += $validated['jumlah_pinjam'];
            $currentJatah->save();
            
            $nextJatah->sisa_cuti -= $validated['jumlah_pinjam'];
            $nextJatah->pinjam_tahun_prev += $validated['jumlah_pinjam'];
            $nextJatah->save();
            
            \DB::commit();
            return redirect()->back()->with('success', 'Berhasil meminjam cuti dari periode berikutnya');
            
        } catch (\Exception $e) {
            \DB::rollBack();
            return back()->withErrors(['error' => 'Gagal meminjam cuti: ' . $e->getMessage()]);
        }
    }

    public function kembalikanCutiNext(Request $request)
    {
        $validated = $request->validate([
            'jatah_cuti_id_current' => 'required|exists:jatah_cuti,id',
            'jatah_cuti_id_next' => 'required|exists:jatah_cuti,id',
            'jumlah_kembalikan' => 'required|numeric|min:0.5',
        ]);

        $user = auth()->user();
        
        $currentJatah = JatahCuti::findOrFail($validated['jatah_cuti_id_current']);
        $nextJatah = JatahCuti::findOrFail($validated['jatah_cuti_id_next']);
        
        if ($currentJatah->uid !== $user->id || $nextJatah->uid !== $user->id) {
            return back()->withErrors(['error' => 'Jatah cuti tidak valid']);
        }
        
        if ($currentJatah->pinjam_tahun_next < $validated['jumlah_kembalikan']) {
            return back()->withErrors(['error' => 'Jumlah pengembalian melebihi jumlah pinjaman']);
        }
        
        \DB::beginTransaction();
        try {
            $currentJatah->sisa_cuti -= $validated['jumlah_kembalikan'];
            $currentJatah->pinjam_tahun_next -= $validated['jumlah_kembalikan'];
            $currentJatah->save();
            
            $nextJatah->sisa_cuti += $validated['jumlah_kembalikan'];
            $nextJatah->pinjam_tahun_prev -= $validated['jumlah_kembalikan'];
            $nextJatah->save();
            
            \DB::commit();
            return redirect()->back()->with('success', 'Berhasil mengembalikan cuti ke periode berikutnya');
            
        } catch (\Exception $e) {
            \DB::rollBack();
            return back()->withErrors(['error' => 'Gagal mengembalikan cuti: ' . $e->getMessage()]);
        }
    }
    public function approval(Request $request)
{
    $validated = $request->validate([
        'pemakaian_cuti_id' => 'required|exists:pemakaian_cuti,id',
        'approval_type' => 'required|in:atasan,hrd,pimpinan',
        'status' => 'required|in:disetujui,ditolak',
        'catatan' => 'nullable|string|max:500',
    ]);
    
    if ($validated['status'] === 'ditolak' && empty($validated['catatan'])) {
        return back()->withErrors(['error' => 'Catatan wajib diisi saat menolak pengajuan cuti']);
    }

    $user = auth()->user();
    $pemakaianCuti = PemakaianCuti::with('jatahCuti.user')->findOrFail($validated['pemakaian_cuti_id']);

    if ($pemakaianCuti->status_final === 'ditolak') {
        return back()->withErrors(['error' => 'Pengajuan ini sudah ditolak, tidak dapat diubah lagi']);
    }

    if ($pemakaianCuti->status_final === 'disetujui') {
        return back()->withErrors(['error' => 'Pengajuan ini sudah disetujui sepenuhnya']);
    }

    $canApprove = false;
    $statusField = '';

    if ($validated['approval_type'] === 'atasan') {
        $canApprove = $pemakaianCuti->diketahui_atasan === $user->id;
        $statusField = 'status_diketahui_atasan';
    } elseif ($validated['approval_type'] === 'hrd') {
        $canApprove = $pemakaianCuti->diketahui_hrd === $user->id;
        $statusField = 'status_diketahui_hrd';
    } elseif ($validated['approval_type'] === 'pimpinan') {
        $canApprove = $pemakaianCuti->disetujui === $user->id;
        $statusField = 'status_disetujui';
    }

    if (!$canApprove) {
        return back()->withErrors(['error' => 'Anda tidak memiliki hak untuk menyetujui pengajuan ini']);
    }

    \DB::beginTransaction();
    try {
        $statusFinalSebelumnya = $pemakaianCuti->status_final;
        $pemakaianCuti->$statusField = $validated['status'];

        // ✅ SIMPAN CATATAN
        if (!empty($validated['catatan'])) {
            $approvalLabel = match($validated['approval_type']) {
                'atasan' => 'Atasan',
                'hrd' => 'HRD',
                'pimpinan' => 'Pimpinan',
                default => 'User'
            };

            $timestamp = now()->format('d/m/Y H:i');
            $catatanBaru = "[{$approvalLabel} - {$timestamp}]\n";
            $catatanBaru .= $validated['catatan'] . "\n\n";
            $pemakaianCuti->catatan = $catatanBaru . ($pemakaianCuti->catatan ?? '');
        }

        $statusFinalBaru = $pemakaianCuti->updateStatusFinal();
        $pemakaianCuti->save();

        // ✅ JIKA STATUS FINAL BERUBAH MENJADI DISETUJUI
        if ($statusFinalSebelumnya !== 'disetujui' && $statusFinalBaru === 'disetujui') {
            $jatahCutiDipakai = $pemakaianCuti->jatahCuti;
            $pemakaiCuti = $jatahCutiDipakai->user;
            
            $activePeriod = $this->calculateActivePeriod($pemakaiCuti->tmk);
            $isPeriodeAktif = ($jatahCutiDipakai->tahun_ke == $activePeriod);
            
            if ($isPeriodeAktif) {
                // ✅ PERIODE AKTIF: Kurangi langsung dari periode ini
                if ($jatahCutiDipakai->sisa_cuti >= $pemakaianCuti->jumlah_hari) {
                    $jatahCutiDipakai->cuti_dipakai += $pemakaianCuti->jumlah_hari;
                    $jatahCutiDipakai->sisa_cuti -= $pemakaianCuti->jumlah_hari;
                    $jatahCutiDipakai->save();
                } else {
                    \DB::rollBack();
                    return back()->withErrors(['error' => 'Sisa cuti periode aktif tidak mencukupi']);
                }
            } else {
                // ✅ BUKAN PERIODE AKTIF: Peminjaman dari periode lain
                
                // Ambil data jatah cuti periode aktif
                $jatahCutiAktif = JatahCuti::where('uid', $pemakaiCuti->id)
                    ->where('tahun_ke', $activePeriod)
                    ->first();
                
                if (!$jatahCutiAktif) {
                    \DB::rollBack();
                    return back()->withErrors(['error' => 'Data jatah cuti periode aktif tidak ditemukan']);
                }
                
                // Cek apakah menggunakan cuti dari periode sebelumnya (prev) atau berikutnya (next)
                if ($jatahCutiDipakai->tahun_ke < $activePeriod) {
                    // ❌ TIDAK BOLEH: Pakai cuti dari periode lalu
                    \DB::rollBack();
                    return back()->withErrors(['error' => 'Tidak dapat menggunakan cuti dari periode yang sudah lewat']);
                    
                } elseif ($jatahCutiDipakai->tahun_ke > $activePeriod) {
                    // ✅ MEMINJAM DARI PERIODE MASA DEPAN (NEXT)
                    
                    // Validasi sisa cuti periode masa depan
                    if ($jatahCutiDipakai->sisa_cuti < $pemakaianCuti->jumlah_hari) {
                        \DB::rollBack();
                        return back()->withErrors(['error' => 'Sisa cuti periode masa depan tidak mencukupi']);
                    }
                    
                    // Update periode masa depan (yang dipinjam)
                    $jatahCutiDipakai->cuti_dipakai += $pemakaianCuti->jumlah_hari;
                    $jatahCutiDipakai->sisa_cuti -= $pemakaianCuti->jumlah_hari;
                    $jatahCutiDipakai->pinjam_tahun_prev += $pemakaianCuti->jumlah_hari; // Dicatat sebagai dipinjam ke prev
                    $jatahCutiDipakai->save();
                    
                    // Update periode aktif (yang meminjam)
                    $jatahCutiAktif->pinjam_tahun_next += $pemakaianCuti->jumlah_hari; // Dicatat meminjam dari next
                    $jatahCutiAktif->save();
                }
            }

            // ✅ UPDATE KEHADIRAN SETELAH CUTI DISETUJUI
            $this->updateKehadiranForCuti($pemakaianCuti);
        }

        \DB::commit();

        if ($statusFinalBaru === 'disetujui') {
            $message = 'Pengajuan cuti telah disetujui oleh semua pihak. Jatah cuti telah dikurangi sebesar ' . $pemakaianCuti->jumlah_hari . ' hari dan kehadiran telah diupdate.';
        } elseif ($statusFinalBaru === 'ditolak') {
            $message = 'Pengajuan cuti telah ditolak. Status tidak dapat diubah lagi.';
        } else {
            $message = $validated['status'] === 'disetujui' 
                ? 'Persetujuan berhasil. Menunggu persetujuan dari pihak lainnya.' 
                : 'Pengajuan berhasil ditolak.';
        }

        return redirect()->back()->with('success', $message);

    } catch (\Exception $e) {
        \DB::rollBack();
        return back()->withErrors(['error' => 'Gagal mengupdate status: ' . $e->getMessage()]);
    }
}

private function updateKehadiranForCuti($pemakaianCuti)
{
    $tanggalMulai = \Carbon\Carbon::parse($pemakaianCuti->tanggal_mulai);
    $tanggalSelesai = \Carbon\Carbon::parse($pemakaianCuti->tanggal_selesai);
    $uid = $pemakaianCuti->uid;
    
    // Tentukan status kehadiran berdasarkan jenis cuti
    if ($pemakaianCuti->cuti_setengah_hari || $pemakaianCuti->jumlah_hari == 0.5) {
        // Cuti setengah hari (0.5 hari) = C2
        $statusKehadiran = 'C2';
        
        // Hanya update 1 hari (tanggal mulai)
        \App\Models\Kehadiran::updateOrCreate(
            [
                'tanggal' => $tanggalMulai->format('Y-m-d'),
                'uid' => $uid
            ],
            [
                'status' => $statusKehadiran,
                'keterangan' => 'Cuti Setengah Hari',
                'jam_kedatangan' => null,
                'jam_pulang' => null
            ]
        );
    } else {
        // Cuti penuh (1 hari atau lebih) = C1
        $statusKehadiran = 'C1';
        
        // Loop dari tanggal mulai sampai tanggal selesai
        $currentDate = $tanggalMulai->copy();
        
        while ($currentDate->lte($tanggalSelesai)) {
            // Hanya update hari kerja (Senin-Jumat)
            if ($currentDate->dayOfWeek >= 1 && $currentDate->dayOfWeek <= 5) {
                \App\Models\Kehadiran::updateOrCreate(
                    [
                        'tanggal' => $currentDate->format('Y-m-d'),
                        'uid' => $uid
                    ],
                    [
                        'status' => $statusKehadiran,
                        'keterangan' => 'Cuti',
                        'jam_kedatangan' => null,
                        'jam_pulang' => null
                    ]
                );
            }
            
            $currentDate->addDay();
        }
    }
}
public function updateStatusFinal()
{
    // Ambil semua status yang ada
    $statuses = [
        'diketahui_atasan' => $this->diketahui_atasan ? $this->status_diketahui_atasan : null,
        'diketahui_hrd' => $this->diketahui_hrd ? $this->status_diketahui_hrd : null,
        'disetujui' => $this->disetujui ? $this->status_disetujui : null,
    ];
    
    // Filter hanya yang dipilih (tidak null)
    $activeStatuses = array_filter($statuses, function($status) {
        return $status !== null;
    });
    
    // Jika tidak ada jalur approval yang dipilih
    if (empty($activeStatuses)) {
        $this->status_final = 'diproses';
        return 'diproses';
    }
    
    // Jika ada yang ditolak
    if (in_array('ditolak', $activeStatuses)) {
        $this->status_final = 'ditolak';
        return 'ditolak';
    }
    
    // Jika semua yang dipilih sudah disetujui
    if (count(array_filter($activeStatuses, fn($s) => $s === 'disetujui')) === count($activeStatuses)) {
        $this->status_final = 'disetujui';
        return 'disetujui';
    }
    
    // Masih ada yang diproses
    $this->status_final = 'diproses';
    return 'diproses';
}

// ✅ Pastikan fungsi ini sudah ada di controller
private function calculateActivePeriod($tmk)
{
    $tmkDate = \Carbon\Carbon::parse($tmk);
    $today = \Carbon\Carbon::now();
    
    $years = 0;
    $tempDate = $tmkDate->copy();
    
    while ($tempDate->copy()->addYear()->lte($today)) {
        $years++;
        $tempDate->addYear();
    }
    
    return $years; 
}
    private function calculateCutiByPeriod($period, $yearDecimal = null)
    {
        if ($period == 0 || ($yearDecimal !== null && $yearDecimal < 1)) {
            return 0;
        }
        
        if ($period == 1) {
            return 12;
        } elseif ($period >= 2 && $period <= 5) {
            return 12;
        } else {
            $jumlahCuti = 12 + floor(($period - 5) / 2);
            return min($jumlahCuti, 24);
        }
    }

   public function Admin(Request $request)
{
    $query = JatahCuti::with(['user', 'pemakaian' => function($q) {
        $q->where('status_final', 'disetujui')->orderBy('tanggal_mulai', 'asc');
    }]);
    
    if ($request->has('search') && $request->search) {
        $query->whereHas('user', function ($q) use ($request) {
            $q->where('name', 'like', '%' . $request->search . '%');
        });
    }

    if ($request->has('tahun') && $request->tahun) {
        $query->where('tahun', $request->tahun);
    }

    $jatahCutiRaw = $query->orderBy('created_at', 'desc')->get();
    
    // ✅ FILTER: Hanya tampilkan periode aktif dan masa depan
    $jatahCutiFiltered = $jatahCutiRaw->filter(function ($item) {
        if ($item->user && $item->user->tmk) {
            $activePeriod = $this->calculateActivePeriod($item->user->tmk);
            
            // Hanya tampilkan jika tahun_ke >= periode aktif
            return $item->tahun_ke >= $activePeriod;
        }
        return false;
    })->values();

    // Manual pagination
    $page = $request->input('page', 1);
    $perPage = 10;
    $total = $jatahCutiFiltered->count();
    $jatahCutiPaginated = $jatahCutiFiltered->slice(($page - 1) * $perPage, $perPage)->values();

    $jatahCuti = new \Illuminate\Pagination\LengthAwarePaginator(
        $jatahCutiPaginated,
        $total,
        $perPage,
        $page,
        ['path' => $request->url(), 'query' => $request->query()]
    );

    $users = User::where('active', 1)
        ->orderBy('name')
        ->get(['id', 'name', 'tmk']);

    $tahunList = JatahCuti::distinct()
        ->orderBy('tahun', 'desc')
        ->pluck('tahun');

    // ✅ Ambil semua pengajuan cuti dengan relasi
    $pemakaianCuti = PemakaianCuti::with([
        'user', 'jatahCuti', 'penerimaTugas',
        'diketahuiAtasanUser', 'diketahuiHrdUser', 'disetujuiUser'
    ])
    ->orderBy('tanggal_pengajuan', 'desc')
    ->get()
    ->map(function($item) {
        return [
            'id' => $item->id,
            'uid' => $item->uid,
            'tanggal_pengajuan' => $item->tanggal_pengajuan,
            'tanggal_mulai' => $item->tanggal_mulai,
            'tanggal_selesai' => $item->tanggal_selesai,
            'jumlah_hari' => floatval($item->jumlah_hari), // ✅ Cast to float
            'alasan' => $item->alasan,
            'catatan' => $item->catatan,
            'cuti_setengah_hari' => $item->cuti_setengah_hari,
            'id_penerima_tugas' => $item->id_penerima_tugas,
            'tugas' => $item->tugas,
            'user' => $item->user ? [
                'id' => $item->user->id,
                'name' => $item->user->name,
                'email' => $item->user->email,
            ] : null,
            'penerima_tugas' => $item->penerimaTugas ? [
                'id' => $item->penerimaTugas->id,
                'name' => $item->penerimaTugas->name,
            ] : null,
            'diketahui_atasan' => $item->diketahui_atasan,
            'diketahui_hrd' => $item->diketahui_hrd,
            'disetujui' => $item->disetujui,
            'diketahui_atasan_user' => $item->diketahuiAtasanUser ? [
                'id' => $item->diketahuiAtasanUser->id,
                'name' => $item->diketahuiAtasanUser->name,
                'jabatan' => $item->diketahuiAtasanUser->jabatan,
            ] : null,
            'diketahui_hrd_user' => $item->diketahuiHrdUser ? [
                'id' => $item->diketahuiHrdUser->id,
                'name' => $item->diketahuiHrdUser->name,
                'jabatan' => $item->diketahuiHrdUser->jabatan,
            ] : null,
            'disetujui_user' => $item->disetujuiUser ? [
                'id' => $item->disetujuiUser->id,
                'name' => $item->disetujuiUser->name,
                'jabatan' => $item->disetujuiUser->jabatan,
            ] : null,
            'status_diketahui_atasan' => $item->status_diketahui_atasan,
            'status_diketahui_hrd' => $item->status_diketahui_hrd,
            'status_disetujui' => $item->status_disetujui,
            'status_final' => $item->status_final,
        ];
    });

    return Inertia::render('Hrd/Cuti', [
        'jatahCuti' => $jatahCuti,
        'pemakaianCuti' => $pemakaianCuti,
        'users' => $users,
        'tahunList' => $tahunList,
        'filters' => [
            'search' => $request->input('search', ''),
        ],
    ]);
}
public function storePengajuanAdmin(Request $request)
{
    $validated = $request->validate([
        'uid' => 'required|exists:users,id', // User yang akan cuti
        'jatah_cuti_id' => 'required|exists:jatah_cuti,id',
        'tanggal_mulai' => 'required|date',
        'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        'cuti_setengah_hari' => 'boolean',
        'alasan' => 'required|string|max:500',
        'id_penerima_tugas' => 'nullable|exists:users,id',
        'tugas' => 'nullable|string|max:1000',
        'diketahui_atasan' => 'nullable|exists:users,id',
        'diketahui_hrd' => 'nullable|exists:users,id',
        'disetujui' => 'nullable|exists:users,id',
    ]);

    // Validasi: Minimal satu approver harus dipilih
    if (!$validated['diketahui_atasan'] && !$validated['diketahui_hrd'] && !$validated['disetujui']) {
        return back()->withErrors(['error' => 'Pilih minimal satu approver (Atasan, HRD, atau Pimpinan)']);
    }

    $user = User::findOrFail($validated['uid']); // User yang akan cuti
    $jatahCuti = JatahCuti::findOrFail($validated['jatah_cuti_id']);
    
    // ✅ VALIDASI PERIODE
    $tmkDate = \Carbon\Carbon::parse($user->tmk);
    $today = \Carbon\Carbon::now();
    $years = 0;
    $tempDate = $tmkDate->copy();
    
    while ($tempDate->copy()->addYear()->lte($today)) {
        $years++;
        $tempDate->addYear();
    }
    
    $activePeriod = $years;
    
    // Validasi: Tidak boleh pakai periode yang sudah lewat
    if ($jatahCuti->tahun_ke < $activePeriod) {
        return back()->withErrors([
            'error' => 'Tidak dapat menggunakan cuti dari periode yang sudah lewat. Gunakan periode aktif atau periode masa depan.'
        ]);
    }
    
    // Validasi: Jika pakai periode masa depan saat masih periode 0
    if ($jatahCuti->tahun_ke > $activePeriod && $activePeriod == 0) {
        return back()->withErrors([
            'error' => 'Karyawan masih dalam periode percobaan (belum 1 tahun). Tidak dapat meminjam cuti periode masa depan.'
        ]);
    }
    
    // Validasi ownership
    if ($jatahCuti->uid !== $user->id) {
        return back()->withErrors(['error' => 'Jatah cuti tidak valid untuk karyawan ini']);
    }

    $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai']);
    $tanggalSelesai = \Carbon\Carbon::parse($validated['tanggal_selesai']);
    
    // Hitung jumlah hari kerja
    $jumlahHari = 0;
    $currentDate = $tanggalMulai->copy();
    
    while ($currentDate->lte($tanggalSelesai)) {
        if ($currentDate->dayOfWeek >= 1 && $currentDate->dayOfWeek <= 5) {
            $jumlahHari++;
        }
        $currentDate->addDay();
    }
    
    if ($request->cuti_setengah_hari) {
        $jumlahHari = 0.5;
    }

    // Validasi sisa cuti
    if ($jatahCuti->sisa_cuti < $jumlahHari) {
        return back()->withErrors(['error' => 'Sisa cuti tidak mencukupi. Sisa cuti: ' . $jatahCuti->sisa_cuti . ' hari']);
    }

    // Pengecekan bentrok
    $bentrok = PemakaianCuti::where('uid', $user->id)
        ->where(function($query) {
            $query->where(function($q) {
                $q->where('status_diketahui_atasan', '!=', 'ditolak')
                  ->orWhereNull('status_diketahui_atasan');
            })
            ->where(function($q) {
                $q->where('status_diketahui_hrd', '!=', 'ditolak')
                  ->orWhereNull('status_diketahui_hrd');
            })
            ->where(function($q) {
                $q->where('status_disetujui', '!=', 'ditolak')
                  ->orWhereNull('status_disetujui');
            });
        })
        ->where(function($query) use ($tanggalMulai, $tanggalSelesai) {
            $query->whereBetween('tanggal_mulai', [$tanggalMulai, $tanggalSelesai])
                  ->orWhereBetween('tanggal_selesai', [$tanggalMulai, $tanggalSelesai])
                  ->orWhere(function($q) use ($tanggalMulai, $tanggalSelesai) {
                      $q->where('tanggal_mulai', '<=', $tanggalMulai)
                        ->where('tanggal_selesai', '>=', $tanggalSelesai);
                  });
        })
        ->exists();

    if ($bentrok) {
        return back()->withErrors(['error' => 'Tanggal yang dipilih bentrok dengan pengajuan cuti lainnya']);
    }

    // Create pengajuan cuti
    PemakaianCuti::create([
        'uid' => $validated['uid'], // User yang cuti
        'jatah_cuti_id' => $validated['jatah_cuti_id'],
        'tanggal_mulai' => $validated['tanggal_mulai'],
        'tanggal_selesai' => $validated['tanggal_selesai'],
        'cuti_setengah_hari' => $request->cuti_setengah_hari ?? false,
        'jumlah_hari' => $jumlahHari,
        'alasan' => $validated['alasan'],
        'tanggal_pengajuan' => now(),
        'id_penerima_tugas' => $validated['id_penerima_tugas'] ?? null,
        'tugas' => $validated['tugas'] ?? null,
        'diketahui_atasan' => $validated['diketahui_atasan'] ?? null,
        'diketahui_hrd' => $validated['diketahui_hrd'] ?? null,
        'disetujui' => $validated['disetujui'] ?? null,
        'status_diketahui_atasan' => $validated['diketahui_atasan'] ? 'diproses' : null,
        'status_diketahui_hrd' => $validated['diketahui_hrd'] ? 'diproses' : null,
        'status_disetujui' => $validated['disetujui'] ? 'diproses' : null,
    ]);

    return redirect()->back()->with('success', 'Pengajuan cuti untuk ' . $user->name . ' berhasil diajukan dan menunggu persetujuan');
}


    public function store(Request $request)
{
    $validated = $request->validate([
        'uid' => 'required|exists:users,id',
        'tahun_ke' => 'required|integer|min:0',
        'tahun' => 'required|integer|min:2020',
        'jumlah_cuti' => 'required|integer|min:0',
        'keterangan' => 'nullable|string',
    ]);
    $validated['sisa_cuti'] = $validated['jumlah_cuti'];
    $validated['cuti_dipakai'] = 0;

    JatahCuti::create($validated);

    return redirect()->back()->with('success', 'Jatah cuti berhasil ditambahkan');
}


    public function update(Request $request, $id)
    {
        $jatahCuti = JatahCuti::findOrFail($id);

        $validated = $request->validate([
            'uid' => 'required|exists:users,id',
            'tahun_ke' => 'required|integer|min:0',
            'tahun' => 'required|integer|min:2020',
            'jumlah_cuti' => 'required|integer|min:0',
            'keterangan' => 'nullable|string',
            'sisa_cuti' => 'required|integer|min:0',
            'cuti_dipakai' => 'required|integer|min:0',
        ]);

        $jatahCuti->update($validated);

        return redirect()->back()->with('success', 'Jatah cuti berhasil diperbarui');
    }

    public function destroy($id)
    {
        $jatahCuti = JatahCuti::findOrFail($id);
        $jatahCuti->delete();

        return redirect()->back()->with('success', 'Jatah cuti berhasil dihapus');
    }

    public function create()
    {
        $user = auth()->user();
        
        $jatahCutiTersedia = JatahCuti::where('uid', $user->id)
            ->where('sisa_cuti', '>', 0)
            ->orderBy('tahun', 'desc')
            ->get();
        
        return response()->json([
            'jatahCutiTersedia' => $jatahCutiTersedia
        ]);
    }

    public function getRekanKerja()
    {
        $user = auth()->user();
        
        $rekanKerja = User::where('active', 1)
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'jabatan']);
        
        return response()->json($rekanKerja);
    }

    public function getApprovers()
    {
        $user = auth()->user();
        $approvers = User::where('active', 1)
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'jabatan']);
        
        return response()->json($approvers);
    }

    public function calculateCuti(Request $request)
    {
        $userId = $request->uid;
        $tahun = $request->tahun;

        $user = User::findOrFail($userId);
        
        $tmk = \Carbon\Carbon::parse($user->tmk);
        $tahunSekarang = \Carbon\Carbon::create($tahun);
        $tahunKe = $tahunSekarang->diffInYears($tmk) + 1;

        if ($tahunKe == 1) {
            $jumlahCuti = 12;
        } elseif ($tahunKe >= 2 && $tahunKe <= 5) {
            $jumlahCuti = 12;
        } else {
            $jumlahCuti = 12 + floor(($tahunKe - 5) / 2);
            $jumlahCuti = min($jumlahCuti, 24);
        }

        return response()->json([
            'tahun_ke' => $tahunKe,
            'jumlah_cuti' => $jumlahCuti
        ]);
    }
    public function downloadPdf($id)
{
    $pemakaianCuti = PemakaianCuti::with([
        'user', 'jatahCuti', 'penerimaTugas',
        'diketahuiAtasanUser', 'diketahuiHrdUser', 'disetujuiUser'
    ])->findOrFail($id);

    // Pastikan user hanya bisa download cuti miliknya sendiri (kecuali admin/HRD)
    $user = auth()->user();
    if ($pemakaianCuti->uid !== $user->id && !in_array($user->role, ['admin', 'hrd'])) {
        abort(403, 'Unauthorized');
    }

    // Hitung riwayat cuti yang sudah diambil
    $riwayatCuti = PemakaianCuti::where('uid', $pemakaianCuti->uid)
        ->where('jatah_cuti_id', $pemakaianCuti->jatah_cuti_id)
        ->where('status_final', 'disetujui')
        ->where('id', '<=', $id)
        ->orderBy('tanggal_mulai')
        ->get();

    $data = [
        'pemakaianCuti' => $pemakaianCuti,
        'riwayatCuti' => $riwayatCuti,
        'jatahCuti' => $pemakaianCuti->jatahCuti,
        'user' => $pemakaianCuti->user,
    ];

    $pdf = Pdf::loadView('pdf.formulir-cuti', $data);
    $pdf->setPaper('A4', 'portrait');
    
    $filename = 'Formulir_Cuti_' . $pemakaianCuti->user->name . '_' . date('YmdHis') . '.pdf';
    
    return $pdf->stream($filename);
}

}