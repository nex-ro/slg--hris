<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'tanggal_keluar')) {
            Schema::table('users', function (Blueprint $table) {
                $table->date('tanggal_keluar')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'tanggal_keluar')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('tanggal_keluar');
            });
        }
    }
};
