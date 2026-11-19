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
        Schema::create('klaim_dinas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uid')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nomor_klaim')->unique(); // e.g. CLM/SLG/2026/XI/001
            $table->string('nomor_surat_dinas')->nullable(); // referensi SPD jika ada
            $table->string('nama_lengkap');
            $table->string('email');
            $table->string('jabatan')->nullable();
            $table->string('divisi')->nullable();
            $table->string('kegiatan'); // e.g. Internal Audit, Training, dll
            $table->date('periode_awal')->nullable();
            $table->date('periode_akhir')->nullable();
            $table->string('kota_penandatangan')->default('Jakarta');
            $table->date('tanggal_pengajuan');
            $table->decimal('cash_advance', 15, 2)->default(0);
            $table->decimal('total_realisasi', 15, 2)->default(0);
            $table->decimal('sisa_kurang', 15, 2)->default(0); // total_realisasi - cash_advance
            $table->string('no_rekening')->nullable();
            $table->string('nama_bank')->nullable();
            $table->string('nama_rekening')->nullable();
            $table->enum('metode_nota', ['pdf', 'offline'])->default('pdf');
            $table->string('file_nota_pdf')->nullable(); // Path bukti nota jika PDF
            $table->text('catatan_pemohon')->nullable();
            
            // Verifikasi HRD
            $table->enum('status', ['Diajukan', 'Diproses', 'Disetujui', 'Ditolak'])->default('Diajukan');
            $table->foreignId('diperiksa_oleh_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('diperiksa_oleh_nama')->nullable(); // Nama HRD pemeriksa
            $table->string('diperiksa_oleh_jabatan')->nullable(); // Jabatan HRD pemeriksa
            $table->timestamp('diperiksa_pada')->nullable();
            $table->text('catatan_hrd')->nullable();

            $table->timestamps();
        });

        Schema::create('klaim_dinas_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('klaim_dinas_id')->constrained('klaim_dinas')->cascadeOnDelete();
            $table->date('tanggal')->nullable();
            $table->string('rincian_biaya'); // e.g. GrabCar dari Jl Rosela ke Hotel Santika
            $table->decimal('nominal', 15, 2)->default(0);
            $table->string('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('klaim_dinas_items');
        Schema::dropIfExists('klaim_dinas');
    }
};
