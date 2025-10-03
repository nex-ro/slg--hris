<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AbsensiMonthlyExport implements WithMultipleSheets
{
    protected $dataPerTanggal;
    protected $bulan;
    protected $tahun;

    public function __construct($dataPerTanggal, $bulan, $tahun)
    {
        $this->dataPerTanggal = $dataPerTanggal;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
    }

    public function sheets(): array
    {
        $sheets = [];

        foreach ($this->dataPerTanggal as $index => $dataHarian) {
            $sheets[] = new AbsensiDailySheet(
                $dataHarian['data'], 
                $dataHarian['tanggal'],
                $dataHarian['hari']
            );
        }

        return $sheets;
    }
}