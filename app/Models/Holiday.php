<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
protected $fillable = ['date', 'name', 'year', 'jenis_liburan']; // TAMBAH 'jenis_liburan'
    
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
        public static function isTanggalMerah(string $date): bool
    {
        return self::where('date', $date)
                   ->where('jenis_liburan', 'tanggal_merah')
                   ->exists();
    }
    
    /**
     * Cek apakah tanggal adalah cuti bersama
     */
    public static function isCutiBersama(string $date): bool
    {
        return self::where('date', $date)
                   ->where('jenis_liburan', 'cuti_bersama')
                   ->exists();
    }
}