<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KlaimDinasItem extends Model
{
    use HasFactory;

    protected $table = 'klaim_dinas_items';

    protected $fillable = [
        'klaim_dinas_id',
        'tanggal',
        'rincian_biaya',
        'nominal',
        'keterangan',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'nominal' => 'decimal:2',
    ];

    public function klaimDinas()
    {
        return $this->belongsTo(KlaimDinas::class, 'klaim_dinas_id');
    }
}
