<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jatah_cuti', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('uid');
            $table->integer('tahun_ke')->nullable();
            $table->year('tahun');
            $table->decimal('jumlah_cuti', 5, 2)->default(12.00); 
            $table->decimal('cuti_dipakai', 5, 2)->default(0.00);
            $table->decimal('sisa_cuti', 5, 2)->default(12.00);
            $table->decimal('pinjam_tahun_prev', 5, 2)->default(0.00);
            $table->decimal('pinjam_tahun_next', 5, 2)->default(0.00);
            $table->string('keterangan')->nullable();
            $table->timestamps();
            $table->foreign('uid')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('pemakaian_cuti', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('uid');
            $table->unsignedBigInteger('jatah_cuti_id')->nullable();
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->decimal('jumlah_hari', 5, 2);
            $table->boolean('cuti_setengah_hari')->default(false);
            $table->string('alasan')->nullable();
            $table->date('tanggal_pengajuan')->nullable();
            
            // User ID untuk approval
            $table->unsignedBigInteger('diketahui_atasan')->nullable();
            $table->unsignedBigInteger('diketahui_hrd')->nullable();
            $table->unsignedBigInteger('disetujui')->nullable();
            
            // Status untuk setiap approval
            $table->enum('status_diketahui_atasan', ['diproses', 'disetujui', 'ditolak'])->nullable();
            $table->enum('status_diketahui_hrd', ['diproses', 'disetujui', 'ditolak'])->nullable();
            $table->enum('status_disetujui', ['diproses', 'disetujui', 'ditolak'])->nullable();
            $table->enum('status_final', ['diproses', 'disetujui', 'ditolak'])->default('diproses');

            $table->unsignedBigInteger('id_penerima_tugas')->nullable();
            $table->text('tugas')->nullable();
            $table->text('catatan')->nullable();
            
            $table->timestamps();

            $table->foreign('uid')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('jatah_cuti_id')->references('id')->on('jatah_cuti')->onDelete('set null');
            $table->foreign('diketahui_atasan')->references('id')->on('users')->onDelete('set null');
            $table->foreign('diketahui_hrd')->references('id')->on('users')->onDelete('set null');
            $table->foreign('disetujui')->references('id')->on('users')->onDelete('set null');
            $table->foreign('id_penerima_tugas')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pemakaian_cuti');
        Schema::dropIfExists('jatah_cuti'); 
    }
};