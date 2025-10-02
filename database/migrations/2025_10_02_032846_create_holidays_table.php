<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->string('name');
            $table->year('year');
            $table->timestamps();
            
            $table->index('date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('holidays');
    }
};