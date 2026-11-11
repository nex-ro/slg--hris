<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AbsensiPerDivisiExport implements WithMultipleSheets
{
    protected $dataPerDivisi;
    protected $bulan;
    protected $tahun;

    public function __construct($dataPerDivisi, $bulan, $tahun)
    {
        $this->dataPerDivisi = $dataPerDivisi;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
    }

    public function sheets(): array
    {
        $sheets = [];

        foreach ($this->dataPerDivisi as $divisiData) {
            $divisiName = $divisiData['divisi'] ?? 'Tanpa Divisi';
            $sheetName = 'R.' . $divisiName;
            
            // Batasi nama sheet max 31 karakter (limit Excel)
            if (strlen($sheetName) > 31) {
                $sheetName = substr($sheetName, 0, 31);
            }

            $sheets[] = new AbsensiPerDivisiSheet(
                $divisiData['karyawan'],
                $divisiName,
                $this->bulan,
                $this->tahun
            );
        }

        return $sheets;
    }
}