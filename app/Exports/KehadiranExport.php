<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class KehadiranExport implements WithMultipleSheets
{
    use Exportable;

    protected $dataPerTanggal;
    protected $users;
    protected $bulan;
    protected $tahun;
    protected $jumlahHari;

    public function __construct($dataPerTanggal, $users, $bulan, $tahun, $jumlahHari)
    {
        $this->dataPerTanggal = $dataPerTanggal;
        $this->users = $users;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
        $this->jumlahHari = $jumlahHari;
    }

    public function sheets(): array
    {
        return [
            new RekapKehadiranSheet($this->dataPerTanggal, $this->users, $this->bulan, $this->tahun, $this->jumlahHari),
            new SummaryKetepatanSheet($this->dataPerTanggal, $this->users, $this->bulan, $this->tahun)
        ];
    }
}