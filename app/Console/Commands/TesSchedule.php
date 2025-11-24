<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TesSchedule extends Command
{
    protected $signature = 'tes:schedule';
    protected $description = 'Command untuk testing scheduler';

    public function handle()
    {
        Log::info("Schedule berjalan pada " . now());
        $this->info("Berhasil dijalankan tes");
    }
}
