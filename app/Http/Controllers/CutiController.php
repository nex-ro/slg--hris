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
    
    $jatahCutiUid = (string) trim($jatahCuti->uid); 
    $currentUserId = (string) trim($user->id);

    
    \Log::info('Validasi Ownership Jatah Cuti', [
        'jatah_cuti_id' => $validated['jatah_cuti_id'],
        'jatah_cuti_uid' => $jatahCutiUid,
        'current_user_id' => $currentUserId,
        'is_match' => $jatahCutiUid === $currentUserId
    ]);
    
    if ($jatahCutiUid !== $currentUserId) {
        \Log::warning('Jatah cuti tidak valid - Ownership mismatch');
        return back()->withErrors([
            'error' => 'Jatah cuti tidak valid. Silakan pilih periode cuti yang sesuai.'
        ]);
    }
    
    // Validasi periode
    $tmkDate = \Carbon\Carbon::parse($user->tmk);
    $today = \Carbon\Carbon::now();
    $years = 0;
    $tempDate = $tmkDate->copy();
    
    while ($tempDate->copy()->addYear()->lte($today)) {
        $years++;
        $tempDate->addYear();
    }
    
    $activePeriod = $years;
    
    if ($jatahCuti->tahun_ke < $activePeriod) {
        return back()->withErrors([
            'error' => 'Tidak dapat menggunakan cuti dari periode yang sudah lewat. Gunakan periode aktif atau periode masa depan.'
        ]);
    }
    
    if ($jatahCuti->tahun_ke > $activePeriod && $activePeriod == 0) {
        return back()->withErrors([
            'error' => 'Anda masih dalam periode percobaan (belum 1 tahun). Tidak dapat meminjam cuti periode masa depan.'
        ]);
    }

    $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai']);
    $tanggalSelesai = \Carbon\Carbon::parse($validated['tanggal_selesai']);
    
    // ✅ PERBAIKAN: Hitung jumlah hari dengan benar
    $jumlahHari = 0;
    
    if ($request->cuti_setengah_hari) {
        // ✅ Jika setengah hari, langsung set 0.5
        $jumlahHari = 0.5;
    } else {
        // ✅ Hitung hari kerja (Senin-Jumat)
        $currentDate = $tanggalMulai->copy();
        
        while ($currentDate->lte($tanggalSelesai)) {
            if ($currentDate->dayOfWeek >= 1 && $currentDate->dayOfWeek <= 5) {
                $jumlahHari++;
            }
            $currentDate->addDay();
        }
    }
    
    \Log::info('DEBUG: Perhitungan jumlah hari cuti', [
        'tanggal_mulai' => $tanggalMulai->format('Y-m-d'),
        'tanggal_selesai' => $tanggalSelesai->format('Y-m-d'),
        'cuti_setengah_hari' => $request->cuti_setengah_hari ?? false,
        'jumlah_hari_dihitung' => $jumlahHari
    ]);

    // Validasi sisa cuti
    $sisaCuti = floatval($jatahCuti->sisa_cuti);
    if ($sisaCuti < $jumlahHari) {
        return back()->withErrors([
            'error' => 'Sisa cuti tidak mencukupi. Sisa cuti Anda: ' . $sisaCuti . ' hari, Dibutuhkan: ' . $jumlahHari . ' hari'
        ]);
    }

    // Pengecekan bentrok
    $bentrok = PemakaianCuti::where('uid', $currentUserId)
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
    try {
        $pengajuan = PemakaianCuti::create([
            'uid' => $currentUserId,
            'jatah_cuti_id' => $validated['jatah_cuti_id'],
            'tanggal_mulai' => $validated['tanggal_mulai'],
            'tanggal_selesai' => $validated['tanggal_selesai'],
            'cuti_setengah_hari' => $request->cuti_setengah_hari ?? false,
            'jumlah_hari' => $jumlahHari, // ✅ Sudah benar (0.5 atau jumlah hari penuh)
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
        
        \Log::info('✅ Pengajuan cuti berhasil dibuat', [
            'pengajuan_id' => $pengajuan->id,
            'user_id' => $currentUserId,
            'jumlah_hari' => $jumlahHari,
            'cuti_setengah_hari' => $request->cuti_setengah_hari ?? false
        ]);
        
        return redirect()->back()->with('success', 'Pengajuan cuti berhasil diajukan dan menunggu persetujuan');
        
    } catch (\Exception $e) {
        \Log::error('❌ Error saat membuat pengajuan cuti', [
            'error' => $e->getMessage(),
            'user_id' => $currentUserId,
            'jatah_cuti_id' => $validated['jatah_cuti_id']
        ]);
        
        return back()->withErrors(['error' => 'Gagal mengajukan cuti. Silakan coba lagi.']);
    }
}

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

    if ($validated['approval_type'] == 'atasan') {
        $canApprove = $pemakaianCuti->diketahui_atasan == $user->id;
        $statusField = 'status_diketahui_atasan';
    } elseif ($validated['approval_type'] === 'hrd') {
        $canApprove = $pemakaianCuti->diketahui_hrd == $user->id;
        $statusField = 'status_diketahui_hrd';
    } elseif ($validated['approval_type'] === 'pimpinan') {
        $canApprove = $pemakaianCuti->disetujui == $user->id;
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
            
            // ✅ PERBAIKAN: Cast jumlah_hari ke float untuk support 0.5 (setengah hari)
            $jumlahHariDikurangi = floatval($pemakaianCuti->jumlah_hari);
            
            \Log::info('DEBUG: Cuti akan dikurangi', [
                'jumlah_hari_raw' => $pemakaianCuti->jumlah_hari,
                'jumlah_hari_float' => $jumlahHariDikurangi,
                'cuti_setengah_hari' => $pemakaianCuti->cuti_setengah_hari,
                'sisa_cuti_sebelum' => floatval($jatahCutiDipakai->sisa_cuti)
            ]);
            
            if ($isPeriodeAktif) {
                // ✅ PERIODE AKTIF: Kurangi langsung dari periode ini
                $sisaCutiSebelum = floatval($jatahCutiDipakai->sisa_cuti);
                
                if ($sisaCutiSebelum >= $jumlahHariDikurangi) {
                    $jatahCutiDipakai->cuti_dipakai = floatval($jatahCutiDipakai->cuti_dipakai) + $jumlahHariDikurangi;
                    $jatahCutiDipakai->sisa_cuti = $sisaCutiSebelum - $jumlahHariDikurangi;
                    $jatahCutiDipakai->save();
                    
                    \Log::info('✅ Cuti disetujui - jatah dikurangi (periode aktif)', [
                        'user_id' => $pemakaiCuti->id,
                        'user_name' => $pemakaiCuti->name,
                        'periode' => $activePeriod,
                        'jumlah_dikurangi' => $jumlahHariDikurangi,
                        'sisa_cuti_sebelum' => $sisaCutiSebelum,
                        'sisa_cuti_sesudah' => floatval($jatahCutiDipakai->sisa_cuti),
                        'cuti_dipakai_sesudah' => floatval($jatahCutiDipakai->cuti_dipakai),
                        'cuti_setengah_hari' => $pemakaianCuti->cuti_setengah_hari
                    ]);
                } else {
                    \DB::rollBack();
                    return back()->withErrors([
                        'error' => 'Sisa cuti periode aktif tidak mencukupi. Sisa: ' . $sisaCutiSebelum . ' hari, Dibutuhkan: ' . $jumlahHariDikurangi . ' hari'
                    ]);
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
                    
                    $sisaCutiPeriodeDepan = floatval($jatahCutiDipakai->sisa_cuti);
                    
                    // Validasi sisa cuti periode masa depan
                    if ($sisaCutiPeriodeDepan < $jumlahHariDikurangi) {
                        \DB::rollBack();
                        return back()->withErrors([
                            'error' => 'Sisa cuti periode masa depan tidak mencukupi. Sisa: ' . $sisaCutiPeriodeDepan . ' hari, Dibutuhkan: ' . $jumlahHariDikurangi . ' hari'
                        ]);
                    }
                    
                    // Update periode masa depan (yang dipinjam)
                    $jatahCutiDipakai->cuti_dipakai = floatval($jatahCutiDipakai->cuti_dipakai) + $jumlahHariDikurangi;
                    $jatahCutiDipakai->sisa_cuti = $sisaCutiPeriodeDepan - $jumlahHariDikurangi;
                    $jatahCutiDipakai->pinjam_tahun_prev = floatval($jatahCutiDipakai->pinjam_tahun_prev) + $jumlahHariDikurangi;
                    $jatahCutiDipakai->save();
                    
                    // Update periode aktif (yang meminjam)
                    $jatahCutiAktif->pinjam_tahun_next = floatval($jatahCutiAktif->pinjam_tahun_next) + $jumlahHariDikurangi;
                    $jatahCutiAktif->save();
                    
                    \Log::info('✅ Cuti disetujui - meminjam dari periode depan', [
                        'user_id' => $pemakaiCuti->id,
                        'user_name' => $pemakaiCuti->name,
                        'periode_aktif' => $activePeriod,
                        'periode_dipinjam' => $jatahCutiDipakai->tahun_ke,
                        'jumlah_dikurangi' => $jumlahHariDikurangi,
                        'sisa_cuti_periode_depan_sebelum' => $sisaCutiPeriodeDepan,
                        'sisa_cuti_periode_depan_sesudah' => floatval($jatahCutiDipakai->sisa_cuti),
                        'cuti_setengah_hari' => $pemakaianCuti->cuti_setengah_hari
                    ]);
                }
            }

            // ✅ UPDATE KEHADIRAN SETELAH CUTI DISETUJUI
            $this->updateKehadiranForCuti($pemakaianCuti);
        }

        \DB::commit();

        if ($statusFinalBaru === 'disetujui') {
            $message = 'Pengajuan cuti telah disetujui oleh semua pihak. Jatah cuti telah dikurangi sebesar ' . $jumlahHariDikurangi . ' hari dan kehadiran telah diupdate.';
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
        \Log::error('ERROR approval cuti', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
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
    ->orderBy('created_at', 'desc') 
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
                'is_manual' => $item->is_manual ?? false, // ✅ TAMBAHKAN
            'file_path' => $item->file_path ?? null,   // ✅ TAMBAHKAN
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
        'uid' => 'required|exists:users,id',
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
    if (!$validated['diketahui_atasan'] && !$validated['diketahui_hrd'] && !$validated['disetujui']) {
        return back()->withErrors(['error' => 'Pilih minimal satu approver (Atasan, HRD, atau Pimpinan)']);
    }
    $user = User::findOrFail($validated['uid']);
    $jatahCuti = JatahCuti::findOrFail($validated['jatah_cuti_id']);
    
    // ✅ PERBAIKAN KRITIS: Validasi ownership jatah cuti
    $jatahCutiUid = (string) trim($jatahCuti->uid);
    $selectedUserId = (string) trim($validated['uid']);
    
    \Log::info('Admin - Validasi Ownership Jatah Cuti', [
        'jatah_cuti_id' => $validated['jatah_cuti_id'],
        'jatah_cuti_uid' => $jatahCutiUid,
        'selected_user_id' => $selectedUserId,
        'is_match' => $jatahCutiUid == $selectedUserId
    ]);
    
    // ✅ TAMBAHKAN VALIDASI INI (yang hilang di kode Anda)
    if ($jatahCutiUid != $selectedUserId) {
        \Log::warning('Admin - Jatah cuti tidak valid', [
            'expected_uid' => $selectedUserId,
            'jatah_cuti_uid' => $jatahCutiUid
        ]);
        
        return back()->withErrors([
            'error' => 'Jatah cuti tidak valid untuk karyawan ini. Silakan pilih periode cuti yang sesuai.'
        ]);
    }
    
    // Validasi periode
    $tmkDate = \Carbon\Carbon::parse($user->tmk);
    $today = \Carbon\Carbon::now();
    $years = 0;
    $tempDate = $tmkDate->copy();
    
    while ($tempDate->copy()->addYear()->lte($today)) {
        $years++;
        $tempDate->addYear();
    }
    
    $activePeriod = $years;
    
    if ($jatahCuti->tahun_ke < $activePeriod) {
        return back()->withErrors([
            'error' => 'Tidak dapat menggunakan cuti dari periode yang sudah lewat. Gunakan periode aktif atau periode masa depan.'
        ]);
    }
    
    if ($jatahCuti->tahun_ke > $activePeriod && $activePeriod == 0) {
        return back()->withErrors([
            'error' => 'Karyawan masih dalam periode percobaan (belum 1 tahun). Tidak dapat meminjam cuti periode masa depan.'
        ]);
    }

    // Validasi approver tidak boleh sama dengan user
    $userId = $validated['uid'];
    if (
        ($validated['diketahui_atasan'] && $validated['diketahui_atasan'] == $userId) ||
        ($validated['diketahui_hrd'] && $validated['diketahui_hrd'] == $userId) ||
        ($validated['disetujui'] && $validated['disetujui'] == $userId)
    ) {
        return back()->withErrors([
            'error' => 'User tidak dapat menjadi approver untuk pengajuan cutinya sendiri.'
        ]);
    }

    $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai']);
    $tanggalSelesai = \Carbon\Carbon::parse($validated['tanggal_selesai']);
    
    // Hitung jumlah hari
    $jumlahHari = 0;
    
    if ($request->cuti_setengah_hari) {
        $jumlahHari = 0.5;
    } else {
        $currentDate = $tanggalMulai->copy();
        
        while ($currentDate->lte($tanggalSelesai)) {
            if ($currentDate->dayOfWeek >= 1 && $currentDate->dayOfWeek <= 5) {
                $jumlahHari++;
            }
            $currentDate->addDay();
        }
    }
    
    \Log::info('DEBUG: Perhitungan jumlah hari cuti (Admin)', [
        'user_id' => $user->id,
        'user_name' => $user->name,
        'tanggal_mulai' => $tanggalMulai->format('Y-m-d'),
        'tanggal_selesai' => $tanggalSelesai->format('Y-m-d'),
        'cuti_setengah_hari' => $request->cuti_setengah_hari ?? false,
        'jumlah_hari_dihitung' => $jumlahHari
    ]);

    // Validasi sisa cuti
    $sisaCuti = floatval($jatahCuti->sisa_cuti);
    if ($sisaCuti < $jumlahHari) {
        return back()->withErrors([
            'error' => 'Sisa cuti tidak mencukupi. Sisa cuti: ' . $sisaCuti . ' hari, Dibutuhkan: ' . $jumlahHari . ' hari'
        ]);
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
        'uid' => $validated['uid'],
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
        'jumlah_cuti' => 'required|numeric|min:0', 
        'keterangan' => 'nullable|string',
        'sisa_cuti' => 'nullable|numeric|min:0',   
        'cuti_dipakai' => 'nullable|numeric|min:0',
    ]);

    // Set default values jika tidak ada
    $validated['sisa_cuti'] = $validated['sisa_cuti'] ?? $validated['jumlah_cuti'];
    $validated['cuti_dipakai'] = $validated['cuti_dipakai'] ?? 0;

    JatahCuti::create($validated);

    return redirect()->back()->with('success', 'Jatah cuti berhasil ditambahkan');
}
public function destroyPengajuan($id)
{
    try {
        $pemakaianCuti = PemakaianCuti::findOrFail($id);
        $user = auth()->user();
        
        // Validasi: Hanya user yang mengajukan atau admin/hrd yang bisa delete
        if ($pemakaianCuti->uid !== $user->id && !in_array($user->role, ['admin', 'hrd'])) {
            return back()->withErrors(['error' => 'Anda tidak memiliki hak untuk menghapus pengajuan ini']);
        }
        
        // Validasi: Tidak bisa delete jika sudah disetujui
        if ($pemakaianCuti->status_final === 'disetujui') {
            return back()->withErrors(['error' => 'Tidak dapat menghapus pengajuan cuti yang sudah disetujui']);
        }
        
        \DB::beginTransaction();
        try {
            // Hapus pengajuan cuti
            $pemakaianCuti->delete();
            
            \DB::commit();
            
            \Log::info('✅ Pengajuan cuti berhasil dihapus', [
                'id' => $id,
                'user_id' => $pemakaianCuti->uid,
                'deleted_by' => $user->id,
                'status_final' => $pemakaianCuti->status_final
            ]);
            
            return redirect()->back()->with('success', 'Pengajuan cuti berhasil dihapus');
            
        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
        
    } catch (\Exception $e) {
        \Log::error('❌ Error menghapus pengajuan cuti', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return back()->withErrors(['error' => 'Gagal menghapus pengajuan cuti: ' . $e->getMessage()]);
    }
}
public function update(Request $request, $id)
{
    $jatahCuti = JatahCuti::findOrFail($id);

    $validated = $request->validate([
        'uid' => 'required|exists:users,id',
        'tahun_ke' => 'required|integer|min:0',
        'tahun' => 'required|integer|min:2020',
        'jumlah_cuti' => 'required|numeric|min:0', 
        'keterangan' => 'nullable|string',
        'sisa_cuti' => 'required|numeric|min:0',    
        'cuti_dipakai' => 'required|numeric|min:0',
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
    try {
        $validated = $request->validate([
            'uid' => 'required|exists:users,id',
            'tahun' => 'required|integer|min:2020',
        ]);

        $userId = $validated['uid'];
        $tahun = $validated['tahun'];

        $user = User::findOrFail($userId);
        
        if (!$user->tmk) {
            return response()->json([
                'success' => false,
                'error' => 'TMK user belum diset. Silakan set TMK terlebih dahulu di data karyawan.'
            ], 400);
        }
        
        $tmk = \Carbon\Carbon::parse($user->tmk);
        $tahunTarget = \Carbon\Carbon::create($tahun, 12, 31);
        
        $diffInDays = $tmk->diffInDays($tahunTarget);
        $diffInYears = $diffInDays / 365.25;
        
        $tahunKe = (int) ceil($diffInYears);
        $tahunKe = max(1, $tahunKe);

        // Hitung jumlah cuti berdasarkan periode
        if ($tahunKe == 1) {
            $jumlahCuti = 12;
        } elseif ($tahunKe >= 2 && $tahunKe <= 5) {
            $jumlahCuti = 12;
        } else {
            $jumlahCuti = 12 + floor(($tahunKe - 5) / 2);
            $jumlahCuti = min($jumlahCuti, 24);
        }

        // ✅ CEK DUPLIKASI
        $existingRecord = JatahCuti::where('uid', $userId)
            ->where('tahun_ke', $tahunKe)
            ->first();

        // ✅ RETURN JSON RESPONSE
        return response()->json([
            'success' => true,
            'tahun_ke' => $tahunKe,
            'jumlah_cuti' => $jumlahCuti,
            'is_duplicate' => $existingRecord ? true : false,
            'debug' => [
                'tmk' => $tmk->format('Y-m-d'),
                'tahun_target' => $tahunTarget->format('Y-m-d'),
                'diff_in_days' => $diffInDays,
                'diff_in_years' => round($diffInYears, 2),
            ]
        ], 200);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'error' => 'Validasi gagal: ' . implode(', ', $e->errors())
        ], 422);
    } catch (\Exception $e) {
        \Log::error('Error calculating cuti', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'request' => $request->all()
        ]);

        return response()->json([
            'success' => false,
            'error' => 'Terjadi kesalahan saat menghitung cuti: ' . $e->getMessage()
        ], 500);
    }
}
   public function downloadPdf($id)
{
    $pemakaianCuti = PemakaianCuti::with([
        'user', 'jatahCuti', 'penerimaTugas',
        'diketahuiAtasanUser', 'diketahuiHrdUser', 'disetujuiUser'
    ])->findOrFail($id);
    
    $user = auth()->user();
    
    

    // Hitung riwayat cuti yang sudah diambil + permohonan ini
    $riwayatCuti = PemakaianCuti::where('uid', $pemakaianCuti->uid)
        ->where('jatah_cuti_id', $pemakaianCuti->jatah_cuti_id)
        ->where(function($query) use ($id) {
            $query->where('status_final', 'disetujui')
                  ->orWhere('id', $id); // Tambahkan permohonan ini meski belum disetujui
        })
        ->where('id', '<=', $id)
        ->orderBy('tanggal_mulai')
        ->get();

    // Format TMK dengan masa kerja
    $tmkFormatted = '-';
    if ($pemakaianCuti->user->tmk) {
        $tmkDate = \Carbon\Carbon::parse($pemakaianCuti->user->tmk);
        $now = \Carbon\Carbon::now();
        
        $years = $now->diffInYears($tmkDate);
        $months = $now->copy()->subYears($years)->diffInMonths($tmkDate);
        $days = $now->copy()->subYears($years)->subMonths($months)->diffInDays($tmkDate);
        
        $tmkFormatted = $tmkDate->format('d F Y') . ' (' . $years . ' tahun ' . $months . ' bulan ' . $days . ' hari)';
    }

    $data = [
        'pemakaianCuti' => $pemakaianCuti,
        'riwayatCuti' => $riwayatCuti,
        'jatahCuti' => $pemakaianCuti->jatahCuti,
        'user' => $pemakaianCuti->user,
        'tmkFormatted' => $tmkFormatted,
    ];

    $pdf = Pdf::loadView('pdf.formulir-cuti', $data);
    $pdf->setPaper('A4', 'portrait');
    
    $filename = 'Formulir_Cuti_' . $pemakaianCuti->user->name . '_' . date('YmdHis') . '.pdf';
    
    return $pdf->stream($filename);
}

public function indexHead()
{
    $user = auth()->user();
    
    // Hitung periode aktif user yang login
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
    
    // Tentukan periode berdasarkan tahun penuh yang sudah dilalui
    if ($years < 1) {
        $currentPeriod = 0;
    } else {
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
    
    // Ambil jatah cuti periode saat ini
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
    
    // Ambil jatah cuti periode sebelumnya (jika ada)
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
    
    // ✅ QUERY 1: Pengajuan Cuti User Sendiri (Tab "Cuti Saya")
    $cutiSaya = PemakaianCuti::with([
        'user', 'jatahCuti', 'penerimaTugas',
        'diketahuiAtasanUser', 'diketahuiHrdUser', 'disetujuiUser'
    ])
    ->where('uid', $user->id) // ✅ Hanya cuti user yang login
    ->orderBy('tanggal_pengajuan', 'desc')
    ->orderBy('created_at', 'desc')
    ->paginate(10, ['*'], 'cuti_saya_page')
    ->through(function($item) {
        return [
            'id' => $item->id,
            'uid' => $item->uid,
            'tanggal_pengajuan' => $item->tanggal_pengajuan,
            'tanggal_mulai' => $item->tanggal_mulai,
            'tanggal_selesai' => $item->tanggal_selesai,
            'jumlah_hari' => floatval($item->jumlah_hari),
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
            'jatah_cuti' => [
                'tahun' => $item->jatahCuti->tahun ?? null,
                'tahun_ke' => $item->jatahCuti->tahun_ke ?? null,
                'sisa_cuti' => $item->jatahCuti->sisa_cuti ?? 0,
            ],
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
    
    // ✅ QUERY 2: Cuti yang Butuh Validasi User (Tab "Validasi Cuti")
    $validasiCuti = PemakaianCuti::with([
        'user', 'jatahCuti', 'penerimaTugas',
        'diketahuiAtasanUser', 'diketahuiHrdUser', 'disetujuiUser'
    ])
    ->where(function($query) use ($user) {
        $query->where('diketahui_atasan', $user->id)
              ->orWhere('diketahui_hrd', $user->id)
              ->orWhere('disetujui', $user->id);
    })
    ->where('uid', '!=', $user->id) // ✅ Exclude cuti user sendiri
    ->orderBy('tanggal_pengajuan', 'desc')
    ->orderBy('created_at', 'desc')
    ->paginate(10, ['*'], 'validasi_page')
    ->through(function($item) {
        return [
            'id' => $item->id,
            'uid' => $item->uid,
            'tanggal_pengajuan' => $item->tanggal_pengajuan,
            'tanggal_mulai' => $item->tanggal_mulai,
            'tanggal_selesai' => $item->tanggal_selesai,
            'jumlah_hari' => floatval($item->jumlah_hari),
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
            'jatah_cuti' => [
                'tahun' => $item->jatahCuti->tahun ?? null,
                'tahun_ke' => $item->jatahCuti->tahun_ke ?? null,
                'sisa_cuti' => $item->jatahCuti->sisa_cuti ?? 0,
            ],
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
    
    // ✅ Ambil daftar users untuk dropdown approver
    $users = User::select('id', 'name', 'email', 'jabatan')
        ->where('id', '!=', $user->id)
        ->orderBy('name', 'asc')
        ->get();
    
    return Inertia::render('Atasan/CutiHead', [
        'jatahCuti' => $jatahCutiData,
        'cutiSaya' => $cutiSaya, // ✅ Data cuti user sendiri
        'validasiCuti' => $validasiCuti, // ✅ Data cuti yang butuh validasi
        'cutiSayaPaginationLinks' => $cutiSaya->linkCollection()->toArray(),
        'validasiPaginationLinks' => $validasiCuti->linkCollection()->toArray(),
        'users' => $users, // ✅ Untuk dropdown approver
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

// ✅ UPDATE: storeManualCuti method di Controller
public function storeManualCuti(Request $request)
{
    try {
        // ✅ Log untuk debug
        \Log::info('Manual Cuti Request Data:', $request->all());
        
        $validated = $request->validate([
            'uid' => 'required|exists:users,id',
            'jatah_cuti_id' => 'required|exists:jatah_cuti,id',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'cuti_setengah_hari' => 'nullable|in:0,1,true,false', // ✅ Accept multiple formats
            'alasan' => 'required|string|max:500',
            'status_final' => 'required|in:diproses,disetujui,ditolak',
            'catatan' => 'nullable|string|max:500',
            'file_cuti' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        // ✅ Convert cuti_setengah_hari to boolean
        $cutiSetengahHari = in_array($request->cuti_setengah_hari, [1, '1', 'true', true], true);
        
        \Log::info('Cuti Setengah Hari Converted:', [
            'original' => $request->cuti_setengah_hari,
            'converted' => $cutiSetengahHari,
            'type' => gettype($cutiSetengahHari)
        ]);

        // Handle file upload
        $filePath = null;
        if ($request->hasFile('file_cuti')) {
            $file = $request->file('file_cuti');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('cuti_files', $fileName, 'public');
        }

        // ✅ HITUNG JUMLAH HARI (exclude weekend)
        $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai']);
        $tanggalSelesai = \Carbon\Carbon::parse($validated['tanggal_selesai']);
        
        if ($cutiSetengahHari) {
            $jumlahHari = 0.5;
        } else {
            $jumlahHari = 0;
            $currentDate = $tanggalMulai->copy();
            
            while ($currentDate->lte($tanggalSelesai)) {
                // ✅ HANYA HITUNG SENIN-JUMAT (1-5)
                if ($currentDate->dayOfWeek >= 1 && $currentDate->dayOfWeek <= 5) {
                    $jumlahHari++;
                }
                $currentDate->addDay();
            }
        }
        
        \Log::info('DEBUG: Manual Cuti - Perhitungan hari', [
            'tanggal_mulai' => $tanggalMulai->format('Y-m-d'),
            'tanggal_selesai' => $tanggalSelesai->format('Y-m-d'),
            'cuti_setengah_hari' => $cutiSetengahHari,
            'jumlah_hari' => $jumlahHari
        ]);

        // Cek sisa cuti
        $jatahCuti = JatahCuti::findOrFail($validated['jatah_cuti_id']);
        if ($validated['status_final'] === 'disetujui') {
            if ($jatahCuti->sisa_cuti < $jumlahHari) {
                return back()->withErrors(['error' => 'Sisa cuti tidak mencukupi']);
            }
        }

        // Create pemakaian cuti
        $pemakaianCuti = PemakaianCuti::create([
            'uid' => $validated['uid'],
            'jatah_cuti_id' => $validated['jatah_cuti_id'],
            'tanggal_mulai' => $validated['tanggal_mulai'],
            'tanggal_selesai' => $validated['tanggal_selesai'],
            'jumlah_hari' => $jumlahHari,
            'cuti_setengah_hari' => $cutiSetengahHari, // ✅ Simpan sebagai boolean
            'alasan' => $validated['alasan'],
            'tanggal_pengajuan' => now(),
            'status_final' => $validated['status_final'],
            'catatan' => $validated['catatan'] ?? null,
            'file_path' => $filePath,
            'is_manual' => true,
        ]);

        \Log::info('✅ Manual Cuti Created:', [
            'id' => $pemakaianCuti->id,
            'jumlah_hari' => $pemakaianCuti->jumlah_hari,
            'cuti_setengah_hari' => $pemakaianCuti->cuti_setengah_hari
        ]);

        // Jika disetujui, update jatah cuti dan kehadiran
        if ($validated['status_final'] === 'disetujui') {
            $jatahCuti->cuti_dipakai = floatval($jatahCuti->cuti_dipakai) + $jumlahHari;
            $jatahCuti->sisa_cuti = floatval($jatahCuti->sisa_cuti) - $jumlahHari;
            $jatahCuti->save();

            // Update kehadiran
            $this->updateKehadiranForCuti($pemakaianCuti);
        }

        return redirect()->route('perizinan.cuti')
            ->with('success', 'Cuti manual berhasil ditambahkan');

    } catch (\Illuminate\Validation\ValidationException $e) {
        \Log::error('Validation Error in storeManualCuti:', [
            'errors' => $e->errors(),
            'request' => $request->all()
        ]);
        return back()->withErrors($e->errors());
    } catch (\Exception $e) {
        \Log::error('Error storing manual cuti:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return back()->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()]);
    }
}

public function downloadFileCuti($id)
{
    try {
        $cuti = PemakaianCuti::findOrFail($id);
        
        // ✅ CEK: Jika is_manual dan ada file_path, download file
        if ($cuti->is_manual && $cuti->file_path) {
            $filePath = storage_path('app/public/' . $cuti->file_path);
            
            if (!file_exists($filePath)) {
                return back()->withErrors(['error' => 'File tidak ditemukan di server']);
            }

            return response()->download($filePath);
        }
        
        // ✅ Jika tidak manual atau tidak ada file, redirect ke generate PDF
        return $this->downloadPdf($id);
        
    } catch (\Exception $e) {
        \Log::error('Error download file cuti:', [
            'error' => $e->getMessage(),
            'cuti_id' => $id
        ]);
        return back()->withErrors(['error' => 'Gagal mengunduh file']);
    }
}


public function updateStatusDirect(Request $request, $id)
{
    $validated = $request->validate([
        'status_final' => 'required|in:disetujui,ditolak',
        'catatan' => 'nullable|string|max:500',
    ]);
    
    if ($validated['status_final'] === 'ditolak' && empty($validated['catatan'])) {
        return back()->withErrors(['error' => 'Catatan wajib diisi saat menolak pengajuan cuti']);
    }

    $pemakaianCuti = PemakaianCuti::with('jatahCuti.user')->findOrFail($id);
    
    // Validasi: Hanya admin/hrd yang bisa edit langsung
    $user = auth()->user();
    if (!in_array($user->role, ['admin', 'hrd'])) {
        return back()->withErrors(['error' => 'Anda tidak memiliki hak untuk mengubah status ini']);
    }

    \DB::beginTransaction();
    try {
        $statusSebelumnya = $pemakaianCuti->status_final;
        
        // Update semua status approval menjadi sesuai dengan status final yang dipilih
        if ($pemakaianCuti->diketahui_atasan) {
            $pemakaianCuti->status_diketahui_atasan = $validated['status_final'];
        }
        if ($pemakaianCuti->diketahui_hrd) {
            $pemakaianCuti->status_diketahui_hrd = $validated['status_final'];
        }
        if ($pemakaianCuti->disetujui) {
            $pemakaianCuti->status_disetujui = $validated['status_final'];
        }
        
        $pemakaianCuti->status_final = $validated['status_final'];
        
        // Tambahkan catatan
        if (!empty($validated['catatan'])) {
            $timestamp = now()->format('d/m/Y H:i');
            $catatanBaru = "[Edit Langsung oleh HRD - {$timestamp}]\n";
            $catatanBaru .= $validated['catatan'] . "\n\n";
            $pemakaianCuti->catatan = $catatanBaru . ($pemakaianCuti->catatan ?? '');
        }
        
        $pemakaianCuti->save();
        
        // Jika status berubah menjadi DISETUJUI, kurangi jatah cuti
        if ($statusSebelumnya !== 'disetujui' && $validated['status_final'] === 'disetujui') {
            $jatahCutiDipakai = $pemakaianCuti->jatahCuti;
            $pemakaiCuti = $jatahCutiDipakai->user;
            
            $activePeriod = $this->calculateActivePeriod($pemakaiCuti->tmk);
            $isPeriodeAktif = ($jatahCutiDipakai->tahun_ke == $activePeriod);
            
            $jumlahHariDikurangi = floatval($pemakaianCuti->jumlah_hari);
            
            if ($isPeriodeAktif) {
                // Periode aktif
                $sisaCutiSebelum = floatval($jatahCutiDipakai->sisa_cuti);
                
                if ($sisaCutiSebelum >= $jumlahHariDikurangi) {
                    $jatahCutiDipakai->cuti_dipakai = floatval($jatahCutiDipakai->cuti_dipakai) + $jumlahHariDikurangi;
                    $jatahCutiDipakai->sisa_cuti = $sisaCutiSebelum - $jumlahHariDikurangi;
                    $jatahCutiDipakai->save();
                    
                    \Log::info('✅ Edit Status: Cuti disetujui - jatah dikurangi', [
                        'user' => $pemakaiCuti->name,
                        'periode' => $activePeriod,
                        'jumlah' => $jumlahHariDikurangi,
                        'sisa_sebelum' => $sisaCutiSebelum,
                        'sisa_sesudah' => floatval($jatahCutiDipakai->sisa_cuti)
                    ]);
                } else {
                    \DB::rollBack();
                    return back()->withErrors([
                        'error' => 'Sisa cuti tidak mencukupi. Sisa: ' . $sisaCutiSebelum . ' hari'
                    ]);
                }
            } else {
                // Peminjaman dari periode lain
                if ($jatahCutiDipakai->tahun_ke < $activePeriod) {
                    \DB::rollBack();
                    return back()->withErrors(['error' => 'Tidak dapat menggunakan cuti dari periode lalu']);
                } elseif ($jatahCutiDipakai->tahun_ke > $activePeriod) {
                    // Pinjam dari periode depan
                    $sisaCutiPeriodeDepan = floatval($jatahCutiDipakai->sisa_cuti);
                    
                    if ($sisaCutiPeriodeDepan < $jumlahHariDikurangi) {
                        \DB::rollBack();
                        return back()->withErrors([
                            'error' => 'Sisa cuti periode masa depan tidak mencukupi'
                        ]);
                    }
                    
                    $jatahCutiDipakai->cuti_dipakai = floatval($jatahCutiDipakai->cuti_dipakai) + $jumlahHariDikurangi;
                    $jatahCutiDipakai->sisa_cuti = $sisaCutiPeriodeDepan - $jumlahHariDikurangi;
                    $jatahCutiDipakai->pinjam_tahun_prev = floatval($jatahCutiDipakai->pinjam_tahun_prev) + $jumlahHariDikurangi;
                    $jatahCutiDipakai->save();
                    
                    $jatahCutiAktif = JatahCuti::where('uid', $pemakaiCuti->id)
                        ->where('tahun_ke', $activePeriod)
                        ->first();
                    
                    if ($jatahCutiAktif) {
                        $jatahCutiAktif->pinjam_tahun_next = floatval($jatahCutiAktif->pinjam_tahun_next) + $jumlahHariDikurangi;
                        $jatahCutiAktif->save();
                    }
                }
            }
            
            // Update kehadiran
            $this->updateKehadiranForCuti($pemakaianCuti);
        }
        
        // Jika status berubah dari DISETUJUI ke DITOLAK, kembalikan jatah cuti
        if ($statusSebelumnya === 'disetujui' && $validated['status_final'] === 'ditolak') {
            $jatahCutiDipakai = $pemakaianCuti->jatahCuti;
            $jumlahHariDikembalikan = floatval($pemakaianCuti->jumlah_hari);
            
            $jatahCutiDipakai->cuti_dipakai = max(0, floatval($jatahCutiDipakai->cuti_dipakai) - $jumlahHariDikembalikan);
            $jatahCutiDipakai->sisa_cuti = floatval($jatahCutiDipakai->sisa_cuti) + $jumlahHariDikembalikan;
            $jatahCutiDipakai->save();
            
            // Hapus kehadiran cuti
            \App\Models\Kehadiran::where('uid', $pemakaianCuti->uid)
                ->whereBetween('tanggal', [$pemakaianCuti->tanggal_mulai, $pemakaianCuti->tanggal_selesai])
                ->whereIn('status', ['C1', 'C2'])
                ->delete();
            
            \Log::info('✅ Edit Status: Jatah cuti dikembalikan karena diubah ke ditolak');
        }
        
        \DB::commit();
        
        $message = $validated['status_final'] === 'disetujui' 
            ? 'Status berhasil diubah menjadi DISETUJUI. Jatah cuti telah dikurangi.' 
            : 'Status berhasil diubah menjadi DITOLAK.';
        
        return redirect()->back()->with('success', $message);
        
    } catch (\Exception $e) {
        \DB::rollBack();
        \Log::error('ERROR edit status cuti', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return back()->withErrors(['error' => 'Gagal mengubah status: ' . $e->getMessage()]);
    }
}

}