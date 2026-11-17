<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventaris extends Model
{
    use HasFactory;

    protected $table = 'inventaris';

    protected $fillable = [
        'kode_barang',
        'nama_barang',
        'kategori',
        'serial_number',
        'pengguna',
        'lokasi',
        'kondisi',
        'status',
        'nilai_aset',
        'tanggal_perolehan',
        'keterangan',
    ];

    protected $casts = [
        'nilai_aset' => 'float',
        'tanggal_perolehan' => 'date',
    ];
}
