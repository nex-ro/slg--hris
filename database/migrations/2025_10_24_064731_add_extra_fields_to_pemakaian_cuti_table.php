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
        Schema::table('pemakaian_cuti', function (Blueprint $table) {
    $table->boolean('cuti_setengah_hari')->default(false)->after('tanggal_selesai');
    $table->text('catatan')->nullable()->after('tanggal_pengajuan');
    $table->unsignedBigInteger('id_penerima_tugas')->nullable()->after('diterima');
    $table->text('tugas')->nullable()->after('id_penerima_tugas');

    $table->foreign('id_penerima_tugas')->references('id')->on('users')->onDelete('set null');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pemakaian_cuti', function (Blueprint $table) {
            //
        });
    }
};
