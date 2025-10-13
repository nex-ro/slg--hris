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
        Schema::create('notifications', function (Blueprint $table) { 
            $table->id(); 
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            $table->unsignedBigInteger('to_uid')->nullable()->default(null);
            $table->string('title'); 
            $table->text('message');  
            $table->string('link')->nullable(); 
            $table->enum('type', ['personal','all', 'hrd', 'atasan'])->default('hrd');  
            $table->boolean('is_read')->default(false);  
            $table->timestamps(); 
            $table->index(['user_id', 'is_read']); 
            $table->index('type'); 
            $table->index('to_uid');
        }); 
    } 
 
    /** 
     * Reverse the migrations. 
     */ 
    public function down(): void 
    { 
        Schema::dropIfExists('notifications'); 
    } 
};