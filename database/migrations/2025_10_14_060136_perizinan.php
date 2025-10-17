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
            $table->enum('type_perizinan', ['p1', 'p2', 'p3'])->nullable();
            $table->date('tanggal');
            $table->time('jam_keluar')->nullable();
            $table->time('jam_kembali')->nullable();
            $table->text('keperluan')->nullable();
            $table->enum('status', ['Diajukan', 'Diproses','Disetujui', 'Ditolak'])->default('Diajukan');
            $table->enum('status_diketahui', ['Disetujui', 'Ditolak'])->nullable();
            $table->enum('status_disetujui', ['Disetujui', 'Ditolak'])->nullable();

            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perizinans');
    }
};