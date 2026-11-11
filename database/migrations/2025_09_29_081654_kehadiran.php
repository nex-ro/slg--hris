<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kehadiran', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('uid')->constrained('users')->onDelete('cascade'); 
            $table->date('tanggal');
            $table->time('jam_kedatangan')->nullable(); 
            $table->time('jam_pulang')->nullable();     
            $table->string('status')->nullable(); 
            $table->string('tower')->nullable(); 
            $table->timestamps(); 
            $table->string('keterangan')->nullable(); 
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('kehadiran');
    }
};
