<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class AbsensiPerDivisiSheet implements FromArray, WithTitle, WithStyles, WithColumnWidths
{
    protected $karyawanData;
    protected $divisiName;
    protected $bulan;
    protected $tahun;

    public function __construct($karyawanData, $divisiName, $bulan, $tahun)
    {
        $this->karyawanData = $karyawanData;
        $this->divisiName = $divisiName;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
    }

    public function title(): string
    {
        $title = 'R.' . $this->divisiName;
        return strlen($title) > 31 ? substr($title, 0, 31) : $title;
    }

    public function array(): array
    {
        $data = [];
        $namaBulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        $jumlahHari = Carbon::create($this->tahun, $this->bulan, 1)->daysInMonth;

        // Loop untuk setiap karyawan
        foreach ($this->karyawanData as $karyawan) {
            $namaKaryawan = $karyawan['nama'];
            $dataKehadiran = $karyawan['data'];

            // Header Karyawan
            $data[] = ['DAFTAR HADIR KARYAWAN'];
            $data[] = ['Nama', ': ' . $namaKaryawan];
            $data[] = ['Bulan', ': ' . $namaBulan[$this->bulan] . ' ' . $this->tahun];
            $data[] = [];

            // Header Tabel
            $data[] = [
                'Bulan',
                'Tgl',
                'Tanggal',
                'Hari',
                'Nama',
                'Divisi',
                'Jabatan',
                'Status',
                '#N/A',
                '#N/A',
                '#N/A'
            ];

            // Data Absensi per hari
            foreach ($dataKehadiran as $absensi) {
                $tanggalObj = Carbon::parse($absensi['tanggal']);
                
                $data[] = [
                    $tanggalObj->month,
                    $tanggalObj->day,
                    $tanggalObj->format('d-M-y'),
                    $tanggalObj->locale('id')->dayName,
                    $absensi['user']['name'],
                    $absensi['user']['divisi'],
                    $absensi['user']['jabatan'],
                    $absensi['status'],
                    $absensi['jam_kedatangan'] ?? '#N/A',
                    $absensi['jam_pulang'] ?? '#N/A',
                    '#N/A'
                ];
            }

            $data[] = [];

            // Summary Section
            $statusCount = $this->hitungStatus($dataKehadiran);
            
            $data[] = ['Ket.'];
            $data[] = ['', '- On Time * :', $statusCount['on_time'], 'Hari'];
            $data[] = ['', '- Terlambat * :', $statusCount['terlambat'], 'Hari'];
            $data[] = ['', '- Sakit * :', $statusCount['sakit'], 'Hari'];
            $data[] = ['', '- P1 (Ijin Full Day) * :', $statusCount['p1'], 'Hari'];
            $data[] = ['', '- P2 (Ijin Setengah Hari) * :', $statusCount['p2'], 'Hari'];
            $data[] = ['', '- P3 (Ijin Keluar Kantor) * :', $statusCount['p3'], 'Hari'];
            $data[] = ['', '- C1 (Cuti Full Day) * :', $statusCount['c1'], 'Hari'];
            $data[] = ['', '- C2 (Cuti Setengah Hari) * :', $statusCount['c2'], 'Hari'];
            $data[] = ['', '- Mangkir * :', $statusCount['mangkir'], 'Hari'];
            $data[] = ['', '- Dinas Luar * :', $statusCount['dinas_luar'], 'Hari'];
            $data[] = ['', '- Work From Home * :', $statusCount['wfh'], 'Hari'];
            $data[] = ['', '- FP Tidak Ter-Record * :', $statusCount['fp_tidak_record'], 'Hari'];
            $data[] = ['', '- Libur Kerja * :', $statusCount['libur'], 'Hari'];

            $data[] = [];
            $data[] = [];

            // Signature Section
            $data[] = ['', '', '', '', 'Dibuat Oleh,', '', 'Diperiksa Oleh,'];
            $data[] = [];
            $data[] = [];
            $data[] = [];
            $data[] = ['', '', '', '', 'Jack Sen', '', 'Jupiter'];
            $data[] = ['', '', '', '', 'Staff HRD', '', 'Head of HRD'];

            $data[] = [];
            $data[] = [];
            $data[] = [];
        }

        return $data;
    }

    protected function hitungStatus($dataKehadiran): array
    {
        $count = [
            'on_time' => 0,
            'terlambat' => 0,
            'sakit' => 0,
            'p1' => 0,
            'p2' => 0,
            'p3' => 0,
            'c1' => 0,
            'c2' => 0,
            'mangkir' => 0,
            'dinas_luar' => 0,
            'wfh' => 0,
            'fp_tidak_record' => 0,
            'libur' => 0
        ];

        foreach ($dataKehadiran as $absensi) {
            $status = strtolower($absensi['status']);
            
            if ($status === 'on time' || $status === 'hadir') {
                $count['on_time']++;
            } elseif (strpos($status, 'terlambat') !== false) {
                $count['terlambat']++;
            } elseif (strpos($status, 'sakit') !== false) {
                $count['sakit']++;
            } elseif (strpos($status, 'p1') !== false || strpos($status, 'ijin full') !== false) {
                $count['p1']++;
            } elseif (strpos($status, 'p2') !== false || strpos($status, 'ijin setengah') !== false) {
                $count['p2']++;
            } elseif (strpos($status, 'p3') !== false || strpos($status, 'keluar kantor') !== false) {
                $count['p3']++;
            } elseif (strpos($status, 'c1') !== false || strpos($status, 'cuti full') !== false) {
                $count['c1']++;
            } elseif (strpos($status, 'c2') !== false || strpos($status, 'cuti setengah') !== false) {
                $count['c2']++;
            } elseif (strpos($status, 'mangkir') !== false || strpos($status, 'alpha') !== false) {
                $count['mangkir']++;
            } elseif (strpos($status, 'dinas') !== false) {
                $count['dinas_luar']++;
            } elseif (strpos($status, 'wfh') !== false || strpos($status, 'work from home') !== false) {
                $count['wfh']++;
            } elseif (strpos($status, 'libur') !== false) {
                $count['libur']++;
            }
        }

        return $count;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,
            'B' => 8,
            'C' => 12,
            'D' => 12,
            'E' => 25,
            'F' => 20,
            'G' => 35,
            'H' => 25,
            'I' => 12,
            'J' => 12,
            'K' => 12,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $currentRow = 1;

        foreach ($this->karyawanData as $karyawan) {
            // Style untuk header karyawan
            $sheet->mergeCells("A{$currentRow}:K{$currentRow}");
            $sheet->getStyle("A{$currentRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 14],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ]);
            $currentRow++;

            // Nama dan Bulan
            $currentRow += 2;
            $currentRow++;

            // Header tabel
            $headerRow = $currentRow;
            $sheet->getStyle("A{$headerRow}:K{$headerRow}")->applyFromArray([
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'D3D3D3']
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ]);
            $currentRow++;

            // Data rows
            $jumlahHari = count($karyawan['data']);
            for ($i = 0; $i < $jumlahHari; $i++) {
                $sheet->getStyle("A{$currentRow}:K{$currentRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ]
                    ]
                ]);
                $currentRow++;
            }

            $currentRow++; // Empty row

            // Summary section
            $summaryStart = $currentRow;
            $currentRow += 14; // 14 baris summary

            // Signature section
            $currentRow += 2;
            $sigRow = $currentRow;
            $sheet->mergeCells("E{$sigRow}:E{$sigRow}");
            $sheet->mergeCells("G{$sigRow}:G{$sigRow}");
            $sheet->getStyle("E{$sigRow}:G{$sigRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ]);

            $currentRow += 4;
            $nameRow = $currentRow;
            $sheet->getStyle("E{$nameRow}:G{$nameRow}")->applyFromArray([
                'font' => ['bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ]);

            $currentRow += 2;
            $currentRow += 3; // Extra spacing untuk karyawan berikutnya
        }

        return [];
    }
}