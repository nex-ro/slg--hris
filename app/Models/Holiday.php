<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = ['date', 'name', 'year'];
    
    protected $casts = [
        'date' => 'date',
    ];
    
    /**
     * Cek apakah tanggal adalah libur
     */
    public static function isHoliday(string $date): bool
    {
        return self::where('date', $date)->exists();
    }
}