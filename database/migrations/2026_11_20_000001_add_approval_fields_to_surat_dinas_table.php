<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('surat_dinas', function (Blueprint $table) {
            $table->foreignId('disetujui_oleh_id')->nullable()->after('catatan')->constrained('users')->nullOnDelete();
            $table->string('disetujui_oleh_nama')->nullable()->after('disetujui_oleh_id');
            $table->string('disetujui_oleh_jabatan')->nullable()->after('disetujui_oleh_nama');
            $table->timestamp('disetujui_pada')->nullable()->after('disetujui_oleh_jabatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_dinas', function (Blueprint $table) {
            $table->dropForeign(['disetujui_oleh_id']);
            $table->dropColumn([
                'disetujui_oleh_id',
                'disetujui_oleh_nama',
                'disetujui_oleh_jabatan',
                'disetujui_pada',
            ]);
        });
    }
};
