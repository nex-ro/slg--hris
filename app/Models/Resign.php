<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resign extends Model
{
    protected $table = 'resigns';

    protected $fillable = [
        'uid',
        'tanggal_keluar',
        'alasan',
        'status',
        'active', 
        'dokument',
        'isDokument',
    ];
    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }
}
