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
            $table->integer('jumlah_cuti')->default(12);
            $table->integer('cuti_dipakai')->default(0);
            $table->integer('sisa_cuti')->default(12);
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
            $table->integer('jumlah_hari');
            $table->string('alasan')->nullable();
            $table->enum('status', ['diproses', 'disetujui', 'ditolak'])->default('diproses');
            $table->unsignedBigInteger('disetujui_oleh')->nullable();
            $table->unsignedBigInteger('diketahui_oleh')->nullable();
            $table->boolean('diterima')->default(false);
            $table->date('tanggal_pengajuan')->nullable();
            $table->timestamps();
            $table->enum('status_disetujui_oleh', ['diproses', 'disetujui', 'ditolak'])->default('diproses');
            $table->enum('status_diketahui_oleh', ['diproses', 'disetujui', 'ditolak'])->default('diproses');
            $table->enum('status_diterima', ['diproses', 'disetujui', 'ditolak'])->default('diproses');
            $table->foreign('uid')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('jatah_cuti_id')->references('id')->on('jatah_cuti')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pemakaian_cuti');
        Schema::dropIfExists('jatah_cuti');
    }
};
