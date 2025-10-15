<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perizinans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uid')->constrained('users')->onDelete('cascade');
            $table->foreignId('uid_diketahui')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('uid_disetujui')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('type_perizinan', ['izin', 'cuti', 'lembur', 'lainnya'])->default('izin');
            $table->enum('durasi', ['setengah_hari', 'seharian'])->default('seharian');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->string('keperluan')->nullable();
            $table->enum('status', ['Diproses', 'Disetujui', 'Ditolak'])->default('Diproses');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perizinans');
    }
};
