<?php
namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\JatahCuti;
use App\Models\PemakaianCuti;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('m'));
        
        // Ambil SEMUA libur dalam tahun ini dan tahun depan (untuk kalender)
        $monthlyHolidays = Holiday::whereBetween('date', [
                now()->startOfYear(), 
                now()->addYear()->endOfYear()
            ])
            ->get()
            ->map(function ($holiday) {
                return [
                    'date' => $holiday->date->format('Y-m-d'),
                    'name' => $holiday->name
                ];
            })
            ->pluck('name', 'date')
            ->toArray();
        
        // Ambil semua libur yang belum lewat (dari hari ini ke depan)
        $allHolidays = Holiday::whereDate('date', '>=', now()->startOfDay())
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($holiday) {
                return [
                    'id' => $holiday->id,
                    'date' => $holiday->date->format('Y-m-d'),
                    'name' => $holiday->name,
                    'year' => $holiday->year,
                    'jenis_liburan' => $holiday->jenis_liburan
                ];
            });
        
        return Inertia::render('Hrd/Liburan', [
            'year' => (int) $year,
            'month' => (int) $month,
            'holidays' => $monthlyHolidays,
            'allHolidays' => $allHolidays
        ]);
    }
    
    /**
     * Mendapatkan jatah cuti yang aktif berdasarkan TMK user dan tanggal cuti
     */
    private function getActiveJatahCuti($userId, $tanggalCuti)
    {
        $user = User::find($userId);
        
        if (!$user || !$user->tmk) {
            return null;
        }
        
        $tmk = Carbon::parse($user->tmk);
        $tanggalCutiCarbon = Carbon::parse($tanggalCuti);
        
        // Jika tanggal cuti sebelum TMK, user belum bekerja
        if ($tanggalCutiCarbon->lt($tmk)) {
            return null;
        }
        
        // Hitung tahun ke berapa sejak TMK
        $selisihHari = $tmk->diffInDays($tanggalCutiCarbon);
        $tahunKe = floor($selisihHari / 365) + 1;
        
        // Cari jatah cuti yang sesuai
        $jatahCuti = JatahCuti::where('uid', $userId)
            ->where('tahun_ke', $tahunKe)
            ->first();
        
        return $jatahCuti;
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'jenis_liburan' => 'required|in:tanggal_merah,cuti_bersama',
        ]);

        DB::beginTransaction();
        try {
            $startDate = Carbon::parse($request->start_date);
            $endDate = Carbon::parse($request->end_date);
            
            $currentDate = $startDate->copy();
            $createdHolidays = [];
            
            while ($currentDate->lte($endDate)) {
                // Simpan data holiday
                $holiday = Holiday::create([
                    'date' => $currentDate->format('Y-m-d'),
                    'name' => $request->name,
                    'year' => $currentDate->year,
                    'jenis_liburan' => $request->jenis_liburan,
                ]);
                
                $createdHolidays[] = $holiday;
                
                // Jika ini adalah cuti bersama
                if ($request->jenis_liburan === 'cuti_bersama') {
                    // Ambil semua user aktif
                    $activeUsers = User::where('active', 1)
                        ->whereNotNull('tmk')
                        ->get();
                    
                    $successCount = 0;
                    $skipCount = 0;
                    
                    foreach ($activeUsers as $user) {
                        // Dapatkan jatah cuti yang aktif untuk user ini
                        $jatahCuti = $this->getActiveJatahCuti($user->id, $currentDate);
                        
                        // Skip jika user belum punya jatah cuti (belum TMK atau belum dibuat)
                        if (!$jatahCuti) {
                            $skipCount++;
                            continue;
                        }
                        
                        // Tambahkan cuti_bersama +1
                        $jatahCuti->increment('cuti_bersama');
                        
                        // Tambahkan cuti_dipakai +1
                        $jatahCuti->increment('cuti_dipakai');
                        
                        // Update sisa_cuti
                        $jatahCuti->sisa_cuti = $jatahCuti->jumlah_cuti 
                            - $jatahCuti->cuti_dipakai 
                            - $jatahCuti->cuti_reserved;
                        $jatahCuti->save();
                        
                        // Buat record pemakaian cuti
                        PemakaianCuti::create([
                            'jatah_cuti_id' => $jatahCuti->id,
                            'uid' => $user->id,
                            'tanggal_mulai' => $currentDate->format('Y-m-d'),
                            'tanggal_selesai' => $currentDate->format('Y-m-d'),
                            'jumlah_hari' => 1,
                            'jenis_cuti' => 'cuti_bersama',
                            'keterangan' => 'Cuti Bersama: ' . $request->name,
                            'status' => 'approved',
                        ]);
                        
                        $successCount++;
                    }
                    
                    \Log::info("Cuti Bersama - Tanggal: {$currentDate->format('Y-m-d')}, Berhasil: {$successCount}, Dilewati: {$skipCount}");
                }
                
                $currentDate->addDay();
            }

            DB::commit();
            
            return back()->with('success', 'Hari libur berhasil ditambahkan!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Gagal menambahkan hari libur: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string',
            'jenis_liburan' => 'required|in:tanggal_merah,cuti_bersama',
        ]);

        DB::beginTransaction();
        try {
            $holiday = Holiday::findOrFail($id);
            $oldJenisLiburan = $holiday->jenis_liburan;
            $tanggal = $holiday->date->format('Y-m-d');
            $tahun = $holiday->year;
            
            // Jika sebelumnya cuti bersama, rollback dulu
            if ($oldJenisLiburan === 'cuti_bersama') {
                // Ambil semua pemakaian cuti untuk tanggal ini
                $pemakaianCutiList = PemakaianCuti::where('tanggal_mulai', $tanggal)
                    ->where('jenis_cuti', 'cuti_bersama')
                    ->get();
                
                foreach ($pemakaianCutiList as $pemakaianCuti) {
                    $jatahCuti = JatahCuti::find($pemakaianCuti->jatah_cuti_id);
                    
                    if ($jatahCuti) {
                        $jatahCuti->decrement('cuti_bersama');
                        $jatahCuti->decrement('cuti_dipakai');
                        $jatahCuti->sisa_cuti = $jatahCuti->jumlah_cuti 
                            - $jatahCuti->cuti_dipakai 
                            - $jatahCuti->cuti_reserved;
                        $jatahCuti->save();
                    }
                    
                    $pemakaianCuti->delete();
                }
            }

            // Update holiday
            $holiday->update([
                'name' => $request->name,
                'jenis_liburan' => $request->jenis_liburan,
            ]);

            // Jika yang baru adalah cuti bersama
            if ($request->jenis_liburan === 'cuti_bersama') {
                // Ambil semua user aktif
                $activeUsers = User::where('active', 1)
                    ->whereNotNull('tmk')
                    ->get();
                
                foreach ($activeUsers as $user) {
                    // Dapatkan jatah cuti yang aktif untuk user ini
                    $jatahCuti = $this->getActiveJatahCuti($user->id, $tanggal);
                    
                    // Skip jika user belum punya jatah cuti
                    if (!$jatahCuti) {
                        continue;
                    }
                    
                    $jatahCuti->increment('cuti_bersama');
                    $jatahCuti->increment('cuti_dipakai');
                    $jatahCuti->sisa_cuti = $jatahCuti->jumlah_cuti 
                        - $jatahCuti->cuti_dipakai 
                        - $jatahCuti->cuti_reserved;
                    $jatahCuti->save();
                    
                    PemakaianCuti::create([
                        'jatah_cuti_id' => $jatahCuti->id,
                        'uid' => $user->id,
                        'tanggal_mulai' => $tanggal,
                        'tanggal_selesai' => $tanggal,
                        'jumlah_hari' => 1,
                        'jenis_cuti' => 'cuti_bersama',
                        'keterangan' => 'Cuti Bersama: ' . $request->name,
                        'status' => 'approved',
                    ]);
                }
            }

            DB::commit();
            
            return back()->with('success', 'Hari libur berhasil diperbarui!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Gagal memperbarui hari libur: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $holiday = Holiday::findOrFail($id);
            
            // Jika ini cuti bersama, rollback perubahan di jatah_cuti
            if ($holiday->jenis_liburan === 'cuti_bersama') {
                $tanggal = $holiday->date->format('Y-m-d');
                
                // Ambil semua pemakaian cuti untuk tanggal ini
                $pemakaianCutiList = PemakaianCuti::where('tanggal_mulai', $tanggal)
                    ->where('jenis_cuti', 'cuti_bersama')
                    ->get();
                
                foreach ($pemakaianCutiList as $pemakaianCuti) {
                    $jatahCuti = JatahCuti::find($pemakaianCuti->jatah_cuti_id);
                    
                    if ($jatahCuti) {
                        $jatahCuti->decrement('cuti_bersama');
                        $jatahCuti->decrement('cuti_dipakai');
                        $jatahCuti->sisa_cuti = $jatahCuti->jumlah_cuti 
                            - $jatahCuti->cuti_dipakai 
                            - $jatahCuti->cuti_reserved;
                        $jatahCuti->save();
                    }
                    
                    $pemakaianCuti->delete();
                }
            }
            
            $holiday->delete();
            
            DB::commit();
            
            return back()->with('success', 'Hari libur berhasil dihapus!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Gagal menghapus hari libur: ' . $e->getMessage());
        }
    }
}