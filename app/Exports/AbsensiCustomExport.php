<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AbsensiCustomExport implements WithMultipleSheets
{
    protected $dataPerTanggal;
    protected $tanggalMulai;
    protected $tanggalAkhir;

    public function __construct($dataPerTanggal, $tanggalMulai, $tanggalAkhir)
    {
        $this->dataPerTanggal = $dataPerTanggal;
        $this->tanggalMulai = $tanggalMulai;
        $this->tanggalAkhir = $tanggalAkhir;
    }

    /**
     * @return array
     */
    public function sheets(): array
    {
        $sheets = [];

        foreach ($this->dataPerTanggal as $dataHarian) {
            // Format nama sheet: DD-MM-YYYY (NamaHari)
            $sheetName = \Carbon\Carbon::parse($dataHarian['tanggal'])->format('d-m-Y') . 
                         ' (' . $dataHarian['hari'] . ')';
            
            // Batasi panjang nama sheet max 31 karakter (batasan Excel)
            if (strlen($sheetName) > 31) {
                $sheetName = substr($sheetName, 0, 31);
            }

            $sheets[] = new AbsensiPerTanggalSheet(
                $dataHarian['data'],
                $dataHarian['tanggal'],
                $dataHarian['hari'],
                $dataHarian['is_holiday'],
                $sheetName
            );
        }

        return $sheets;
    }
}