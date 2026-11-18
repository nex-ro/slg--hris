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
        Schema::create('surat_dinas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uid')->constrained('users')->onDelete('cascade');
            $table->string('email');
            $table->string('nama_lengkap');
            $table->string('nomor_surat')->comment('Diisi manual setelah konfirmasi HRD');
            $table->string('jabatan')->nullable();
            $table->string('pemberi_tugas')->nullable();
            $table->date('tanggal_berangkat');
            $table->date('tanggal_kembali')->nullable();
            $table->string('keterangan_kembali')->nullable(); // antisipasi pilihan "/ Selesai"
            $table->string('tujuan');
            $table->text('keperluan');
            $table->string('transportasi');
            
            // Advance Perjalanan Dinas (Cash Advance)
            $table->boolean('ajukan_advance')->default(false);
            $table->string('panjar_nominal')->default('-');
            $table->string('panjar_terbilang')->default('-');
            $table->string('nama_rekening')->default('-');
            $table->string('nomor_rekening')->default('-');
            $table->string('nama_bank')->default('-');
            
            // Status dan Verifikasi
            $table->enum('status', ['Diajukan', 'Diproses', 'Disetujui', 'Ditolak'])->default('Diajukan');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surat_dinas');
    }
};
