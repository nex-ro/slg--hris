<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\JatahCuti;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PemakaianCuti;
class CutiController extends Controller
{
   public function index()
{
    $user = auth()->user();
    
    // Hitung periode berdasarkan TMK
    $tmk = \Carbon\Carbon::parse($user->tmk);
    $today = \Carbon\Carbon::now();
    
    // Hitung tahun anniversary dari TMK
    $currentAnniversary = $tmk->copy()->setYear($today->year);
    if ($today->lt($currentAnniversary)) {
        $currentAnniversary->subYear();
    }
    
    // Hitung periode ke berapa
    $currentPeriod = $today->diffInYears($tmk) + 1;
    
    // Periode saat ini
    $periodStartDate = $currentAnniversary;
    $periodEndDate = $currentAnniversary->copy()->addYear()->subDay();
    
    // Ambil jatah cuti periode saat ini
    $currentJatahCuti = JatahCuti::where('uid', $user->id)
        ->where('tahun_ke', $currentPeriod)
        ->first();
    
    // Jika belum ada, buat otomatis
    if (!$currentJatahCuti) {
        $jumlahCuti = $this->calculateCutiByPeriod($currentPeriod);
        $currentJatahCuti = JatahCuti::create([
            'uid' => $user->id,
            'tahun_ke' => $currentPeriod,
            'tahun' => $periodStartDate->year,
            'jumlah_cuti' => $jumlahCuti,
            'sisa_cuti' => $jumlahCuti,
            'cuti_dipakai' => 0,
            'keterangan' => "Periode {$currentPeriod}"
        ]);
    }
    
    // Ambil jatah cuti periode berikutnya (untuk dipinjam)
    $nextPeriod = $currentPeriod + 1;
    $nextJatahCuti = JatahCuti::where('uid', $user->id)
        ->where('tahun_ke', $nextPeriod)
        ->first();
    
    if (!$nextJatahCuti) {
        $jumlahCutiNext = $this->calculateCutiByPeriod($nextPeriod);
        $nextPeriodStart = $periodEndDate->copy()->addDay();
        
        $nextJatahCuti = JatahCuti::create([
            'uid' => $user->id,
            'tahun_ke' => $nextPeriod,
            'tahun' => $nextPeriodStart->year,
            'jumlah_cuti' => $jumlahCutiNext,
            'sisa_cuti' => $jumlahCutiNext,
            'cuti_dipakai' => 0,
            'keterangan' => "Periode {$nextPeriod} (Dapat Dipinjam)"
        ]);
    }
    
    // Format data jatah cuti
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
            'label' => "Periode {$currentPeriod} (Aktif)",
            'periode_range' => $periodStartDate->format('d M Y') . ' - ' . $periodEndDate->format('d M Y')
        ],
        [
            'id' => $nextJatahCuti->id,
            'tahun' => $nextJatahCuti->tahun,
            'tahun_ke' => $nextJatahCuti->tahun_ke,
            'jumlah_cuti' => $nextJatahCuti->jumlah_cuti,
            'cuti_dipakai' => $nextJatahCuti->cuti_dipakai,
            'sisa_cuti' => $nextJatahCuti->sisa_cuti,
            'is_current' => false,
            'is_borrowable' => true,
            'label' => "Periode {$nextPeriod} (Dapat Dipinjam)",
            'periode_range' => $periodEndDate->copy()->addDay()->format('d M Y') . ' - ' . $periodEndDate->copy()->addYear()->format('d M Y')
        ]
    ];
    
    // Ambil pemakaian cuti (kode existing Anda)
    $pemakaianCuti = PemakaianCuti::with([
        'user', 'jatahCuti', 'penerimaTugas',
        'disetujuiOlehUser', 'diketahuiOlehUser', 'diterimaOlehUser'
    ])
    ->where('uid', $user->id)
    ->orderBy('tanggal_pengajuan', 'desc')
    ->get()
    ->map(function($item) {
        // mapping existing Anda
        return [
            'id' => $item->id,
            'tanggal_pengajuan' => $item->tanggal_pengajuan,
            'tanggal_mulai' => $item->tanggal_mulai,
            'tanggal_selesai' => $item->tanggal_selesai,
            'jumlah_hari' => $item->jumlah_hari,
            'alasan' => $item->alasan,
            'status' => $item->status,
            'disetujui_oleh' => $item->disetujui_oleh,
            'catatan' => $item->catatan,
            'cuti_setengah_hari' => $item->cuti_setengah_hari,
            'id_penerima_tugas' => $item->id_penerima_tugas,
            'tugas' => $item->tugas,
            'jatah_cuti' => [
                'tahun' => $item->jatahCuti->tahun ?? null,
                'sisa_cuti' => $item->jatahCuti->sisa_cuti ?? 0,
            ],
            'penerima_tugas' => $item->penerimaTugas ? [
                'id' => $item->penerimaTugas->id,
                'name' => $item->penerimaTugas->name,
            ] : null,
            'disetujui_oleh_user' => $item->disetujuiOlehUser ? [
                'id' => $item->disetujuiOlehUser->id,
                'name' => $item->disetujuiOlehUser->name,
                'jabatan' => $item->disetujuiOlehUser->jabatan,
            ] : null,
            'diketahui_oleh_user' => $item->diketahuiOlehUser ? [
                'id' => $item->diketahuiOlehUser->id,
                'name' => $item->diketahuiOlehUser->name,
                'jabatan' => $item->diketahuiOlehUser->jabatan,
            ] : null,
            'diterima_oleh_user' => $item->diterimaOlehUser ? [
                'id' => $item->diterimaOlehUser->id,
                'name' => $item->diterimaOlehUser->name,
                'jabatan' => $item->diterimaOlehUser->jabatan,
            ] : null,
            'status_disetujui_oleh' => $item->status_disetujui_oleh,
            'status_diketahui_oleh' => $item->status_diketahui_oleh,
            'status_diterima' => $item->status_diterima,
        ];
    });
    
    return Inertia::render('User/Cuti', [
        'jatahCuti' => $jatahCutiData,
        'pemakaianCuti' => $pemakaianCuti,
        'periodInfo' => [
            'current' => $currentPeriod,
            'start' => $periodStartDate->format('d F Y'),
            'end' => $periodEndDate->format('d F Y'),
        ],
        'auth' => ['user' => $user]
    ]);
}

// Tambahkan helper method ini
private function calculateCutiByPeriod($period)
{
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
        $query = JatahCuti::with('user');

        // Filter berdasarkan nama user
        if ($request->has('search') && $request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        // Filter berdasarkan tahun
        if ($request->has('tahun') && $request->tahun) {
            $query->where('tahun', $request->tahun);
        }

        $jatahCuti = $query->orderBy('created_at', 'desc')->paginate(10);

        // Ambil list user untuk dropdown
        $users = User::where('active', 1)
            ->orderBy('name')
            ->get(['id', 'name', 'tmk']);

        // Ambil list tahun yang tersedia
        $tahunList = JatahCuti::distinct()
            ->orderBy('tahun', 'desc')
            ->pluck('tahun');

        return Inertia::render('Hrd/Cuti', [
            'jatahCuti' => $jatahCuti,
            'users' => $users,
            'tahunList' => $tahunList,
            'filters' => [
                'search' => $request->input('search', ''),
                'tahun' => $request->input('tahun', '')
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'uid' => 'required|exists:users,id',
            'tahun_ke' => 'required|integer|min:1',
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
            'tahun_ke' => 'required|integer|min:1',
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

    // Tambahkan di CutiController.php

public function create()
{
    $user = auth()->user();
    
    // Ambil jatah cuti yang masih tersedia untuk user
    $jatahCutiTersedia = JatahCuti::where('uid', $user->id)
        ->where('sisa_cuti', '>', 0)
        ->orderBy('tahun', 'desc')
        ->get();
    
    return response()->json([
        'jatahCutiTersedia' => $jatahCutiTersedia
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
        // Tambahkan validasi untuk approvers
        'disetujui_oleh' => 'nullable|exists:users,id',
        'diketahui_oleh' => 'nullable|exists:users,id',
        'diterima' => 'nullable|exists:users,id',
    ]);

    $user = auth()->user();
    
    // Cek jatah cuti
    $jatahCuti = JatahCuti::findOrFail($validated['jatah_cuti_id']);
    
    if ($jatahCuti->uid !== $user->id) {
        return back()->withErrors(['error' => 'Jatah cuti tidak valid']);
    }

    // Hitung jumlah hari
    $tanggalMulai = \Carbon\Carbon::parse($validated['tanggal_mulai']);
    $tanggalSelesai = \Carbon\Carbon::parse($validated['tanggal_selesai']);
    
    // Hitung hari kerja (Senin-Jumat)
    $jumlahHari = 0;
    $currentDate = $tanggalMulai->copy();
    
    while ($currentDate->lte($tanggalSelesai)) {
        // Hitung hanya hari kerja (1=Senin, 5=Jumat)
        if ($currentDate->dayOfWeek >= 1 && $currentDate->dayOfWeek <= 5) {
            $jumlahHari++;
        }
        $currentDate->addDay();
    }
    
    // Jika setengah hari
    if ($request->cuti_setengah_hari) {
        $jumlahHari = 0.5;
    }

    // Validasi sisa cuti
    if ($jatahCuti->sisa_cuti < $jumlahHari) {
        return back()->withErrors(['error' => 'Sisa cuti tidak mencukupi. Sisa cuti Anda: ' . $jatahCuti->sisa_cuti . ' hari']);
    }

    // Cek apakah ada pengajuan yang bentrok
    $bentrok = PemakaianCuti::where('uid', $user->id)
        ->where('status', '!=', 'ditolak')
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

    // Buat pengajuan cuti
    PemakaianCuti::create([
        'uid' => $user->id,
        'jatah_cuti_id' => $validated['jatah_cuti_id'],
        'tanggal_mulai' => $validated['tanggal_mulai'],
        'tanggal_selesai' => $validated['tanggal_selesai'],
        'cuti_setengah_hari' => $request->cuti_setengah_hari ?? false,
        'jumlah_hari' => $jumlahHari,
        'alasan' => $validated['alasan'],
        'status' => 'diproses',
        'tanggal_pengajuan' => now(),
        'id_penerima_tugas' => $validated['id_penerima_tugas'] ?? null,
        'tugas' => $validated['tugas'] ?? null,
        // Tambahkan approvers
        'disetujui_oleh' => $validated['disetujui_oleh'] ?? null,
        'diketahui_oleh' => $validated['diketahui_oleh'] ?? null,
        'diterima' => $validated['diterima'] ?? null,
        'status_disetujui_oleh' => $validated['disetujui_oleh'] ? 'diproses' : null,
        'status_diketahui_oleh' => $validated['diketahui_oleh'] ? 'diproses' : null,
        'status_diterima' => $validated['diterima'] ? 'diproses' : null,
    ]);

    return redirect()->back()->with('success', 'Pengajuan cuti berhasil diajukan');
}
public function getRekanKerja()
{
    $user = auth()->user();
    
    // Ambil semua user aktif kecuali diri sendiri
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
        // ->whereIn('jabatan', ['Manager', 'HRD', 'Supervisor', 'Direktur']) // Sesuaikan dengan jabatan di sistem Anda
        ->orderBy('name')
        ->get(['id', 'name', 'jabatan']);
    
    return response()->json($approvers);
}
    public function calculateCuti(Request $request)
    {
        $userId = $request->uid;
        $tahun = $request->tahun;

        $user = User::findOrFail($userId);
        
        // Hitung tahun ke berapa berdasarkan TMK
        $tmk = \Carbon\Carbon::parse($user->tmk);
        $tahunSekarang = \Carbon\Carbon::create($tahun);
        $tahunKe = $tahunSekarang->diffInYears($tmk) + 1;

        // Logika perhitungan jatah cuti (sesuaikan dengan aturan perusahaan)
        if ($tahunKe == 1) {
            $jumlahCuti = 12;
        } elseif ($tahunKe >= 2 && $tahunKe <= 5) {
            $jumlahCuti = 12;
        } else {
            $jumlahCuti = 12 + floor(($tahunKe - 5) / 2);
            $jumlahCuti = min($jumlahCuti, 24); // Maksimal 24 hari
        }

        return response()->json([
            'tahun_ke' => $tahunKe,
            'jumlah_cuti' => $jumlahCuti
        ]);
    }
}