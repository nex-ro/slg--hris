<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kehadiran extends Model
{
    use HasFactory;

    protected $table = 'kehadiran';

    protected $fillable = [
        'tanggal',
        'uid',
        'jam_kedatangan',
        'jam_pulang',
        'status',
    ];
    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }
}
