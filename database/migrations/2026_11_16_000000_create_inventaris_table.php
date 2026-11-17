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
        Schema::create('inventaris', function (Blueprint $table) {
            $table->id();
            $table->string('kode_barang')->unique();
            $table->string('nama_barang');
            $table->string('kategori')->default('Laptop / Komputer');
            $table->string('serial_number')->nullable();
            $table->string('pengguna')->nullable();
            $table->string('lokasi')->nullable();
            $table->string('kondisi')->default('Baik'); // Baik, Cukup, Perlu Perbaikan, Rusak
            $table->string('status')->default('Tersedia'); // Tersedia, Digunakan, Dalam Perbaikan, Dihapus
            $table->decimal('nilai_aset', 15, 2)->default(0);
            $table->date('tanggal_perolehan')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventaris');
    }
};
