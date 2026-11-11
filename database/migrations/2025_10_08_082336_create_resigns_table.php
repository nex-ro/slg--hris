<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migration.
     */
    public function up(): void
    {
        Schema::create('resigns', function (Blueprint $table) {
            $table->id(); 
            $table->unsignedBigInteger('uid');
            $table->text('alasan')->nullable();
            $table->date('tanggal_keluar')->nullable();
            $table->string('dokument')->nullable(); 
            $table->string('status')->default('Diajukan'); 
            $table->boolean('isDokument')->default(true);
            $table->foreign('uid')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Batalkan migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('resigns');
    }
};
