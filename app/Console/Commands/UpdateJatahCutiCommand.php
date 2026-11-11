<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\JatahCuti;
use Carbon\Carbon;

class UpdateJatahCutiCommand extends Command
{
    protected $signature = 'cuti:update-jatah';
    protected $description = 'Update jatah cuti karyawan berdasarkan TMK';

    public function handle()
    {
        $this->info("Memulai pengecekan jatah cuti...");
        
        // Ambil semua user yang aktif dan memiliki TMK
        $users = User::where('active', true)
            ->whereNotNull('tmk')
            ->get();

        $totalProcessed = 0;
        $totalAdded = 0;
        $totalSkipped = 0;

        foreach ($users as $user) {
            try {
                // Validasi TMK
                if (empty($user->tmk)) {
                    $totalSkipped++;
                    continue;
                }

                $tmk = Carbon::parse($user->tmk);
                $today = Carbon::now();
                
                // Validasi tahun TMK (harus antara 1950 - sekarang)
                if ($tmk->year < 1950 || $tmk->year > $today->year) {
                    $this->error("✗ TMK tidak valid untuk {$user->name} (ID: {$user->id}): {$user->tmk} - Skip");
                    Log::error("TMK tidak valid", [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'tmk' => $user->tmk
                    ]);
                    $totalSkipped++;
                    continue;
                }

                // Validasi TMK tidak di masa depan
                if ($tmk->isFuture()) {
                    $totalSkipped++;
                    continue;
                }
                
                // Hitung berapa tahun sejak TMK
                $yearsDiff = $tmk->diffInYears($today);
                
                // Cek setiap tahun kerja untuk menemukan anniversary yang tepat hari ini
                $foundAnniversaryToday = false;
                
                for ($tahunKe = 1; $tahunKe <= $yearsDiff + 1; $tahunKe++) {
                    // Hitung tanggal anniversary (TMK + x tahun + 1 hari)
                    $anniversaryDate = $tmk->copy()->addYears($tahunKe)->addDay();
                    
                    // Cek apakah anniversary tepat hari ini
                    if ($anniversaryDate->isSameDay($today)) {
                        $foundAnniversaryToday = true;
                        $tahunCuti = $anniversaryDate->year;
                        
                        // Validasi tahun cuti
                        if ($tahunCuti < 1950 || $tahunCuti > $today->year + 1) {
                            $this->error("✗ Tahun cuti tidak valid: {$tahunCuti} untuk {$user->name} - Skip");
                            $totalSkipped++;
                            continue 2; // Continue ke user berikutnya
                        }
                        
                        // Cek apakah jatah cuti untuk tahun ke ini sudah ada
                        $existingJatahCuti = JatahCuti::where('uid', $user->id)
                            ->where('tahun_ke', $tahunKe)
                            ->where('tahun', $tahunCuti)
                            ->first();
                        
                        if (!$existingJatahCuti) {
                            // Tambahkan jatah cuti untuk tahun ke ini
                            JatahCuti::create([
                                'uid' => $user->id,
                                'tahun_ke' => $tahunKe,
                                'tahun' => $tahunCuti,
                                'jumlah_cuti' => 12.00,
                                'cuti_dipakai' => 0.00,
                                'sisa_cuti' => 12.00,
                                'pinjam_tahun_prev' => 0.00,
                                'pinjam_tahun_next' => 0.00,
                                'keterangan' => "Jatah cuti tahun ke-{$tahunKe} (TMK: {$tmk->format('d-m-Y')})"
                            ]);
                            
                            $this->info("✓ Menambahkan jatah cuti untuk {$user->name} - Tahun ke-{$tahunKe} ({$tahunCuti}) - Anniversary hari ini!");
                            Log::info("Jatah cuti ditambahkan", [
                                'user_id' => $user->id,
                                'user_name' => $user->name,
                                'tahun_ke' => $tahunKe,
                                'tahun' => $tahunCuti,
                                'tmk' => $user->tmk,
                                'anniversary_date' => $anniversaryDate->format('Y-m-d')
                            ]);
                            
                            $totalAdded++;
                        } else {
                            $this->line("→ User {$user->name} sudah memiliki jatah cuti tahun ke-{$tahunKe} (Anniversary hari ini)");
                        }
                        
                        break; // Hanya proses 1 anniversary per user
                    }
                }
                
                if ($foundAnniversaryToday) {
                    $totalProcessed++;
                }
                
            } catch (\Exception $e) {
                $this->error("✗ Error pada user {$user->name} (ID: {$user->id}): {$e->getMessage()}");
                Log::error("Error processing user", [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'tmk' => $user->tmk,
                    'error' => $e->getMessage()
                ]);
                $totalSkipped++;
            }
        }

        $this->info("\n=== Selesai ===");
        $this->info("Total karyawan dengan anniversary hari ini: {$totalProcessed}");
        $this->info("Total jatah cuti ditambahkan: {$totalAdded}");
        $this->info("Total karyawan dilewati: {$totalSkipped}");
        
        Log::info("Update jatah cuti selesai", [
            'total_processed' => $totalProcessed,
            'total_added' => $totalAdded,
            'total_skipped' => $totalSkipped,
            'executed_at' => now()
        ]);

        return Command::SUCCESS;
    }
}