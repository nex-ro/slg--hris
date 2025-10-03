<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class KateringExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithEvents
{
    protected $kehadiran;
    protected $tower;
    protected $tanggal;

    public function __construct($kehadiran, $tower, $tanggal)
    {
        $this->kehadiran = $kehadiran;
        $this->tower = $tower;
        $this->tanggal = $tanggal;
    }

    public function collection()
    {
        $data = [];
        // Filter hanya yang hadir (ontime/hadir) dan terlambat
        $hadirCollection = collect($this->kehadiran)->filter(function($user) {
            $status = strtolower(trim($user['status'] ?? ''));
            return in_array($status, [
                'ontime', 
                'on time', 
                'hadir', 
                'terlambat',
                'late',
                'telat'
            ]);
        });

        // Group semua data by tower
        $allGrouped = collect($this->kehadiran)->groupBy('tower')->sortKeys();
        $hadirGrouped = $hadirCollection->groupBy('tower')->sortKeys();

        // Ambil data untuk Eifel dan Liberty
        $eifelHadir = $hadirGrouped->get('Eiffel', collect());
        $libertyHadir = $hadirGrouped->get('Liberty', collect());
        
        $eifelAll = $allGrouped->get('Eiffel', collect());
        $libertyAll = $allGrouped->get('Liberty', collect());

        // Fungsi untuk mendapatkan data berdasarkan status
        $getByStatus = function($collection, $statuses) {
            return $collection->filter(function($user) use ($statuses) {
                $status = strtolower(trim($user['status'] ?? ''));
                $statusesLower = array_map('strtolower', $statuses);
                return in_array($status, $statusesLower);
            });
        };

        // Data Eifel
        $eifelSakit = $getByStatus($eifelAll, ['sakit']);
        $eifelCuti = $getByStatus($eifelAll, ['c1', 'c2', 'c3', 'cuti']);
        $eifelDinasLuar = $getByStatus($eifelAll, ['dinas_luar', 'dinas luar']);
        $eifelKeluar = $getByStatus($eifelAll, ['p1', 'p2', 'p3', 'keluar_kantor', 'keluar kantor']);

        // Data Liberty
        $libertySakit = $getByStatus($libertyAll, ['sakit']);
        $libertyCuti = $getByStatus($libertyAll, ['c1', 'c2', 'c3', 'cuti']);
        $libertyDinasLuar = $getByStatus($libertyAll, ['dinas_luar', 'dinas luar']);
        $libertyKeluar = $getByStatus($libertyAll, ['p1', 'p2', 'p3', 'keluar_kantor', 'keluar kantor']);

        // Total keseluruhan
        $eifelTotal = $eifelAll->count();
        $libertyTotal = $libertyAll->count();

        // Total hadir
        $eifelHadirTotal = $eifelHadir->count();
        $libertyHadirTotal = $libertyHadir->count();

        // Buat array data untuk Eifel (hadir) - minimal 45 baris
        $eifelData = [];
        $noEifel = 1;
        foreach ($eifelHadir as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $eifelData[] = [
                $noEifel,
                $nama
            ];
            $noEifel++;
        }
        
        // Tambahkan baris kosong hingga minimal 45
        while (count($eifelData) < 45) {
            $eifelData[] = [count($eifelData) + 1, ''];
        }

        // Buat array data untuk Liberty (hadir) - minimal 45 baris
        $libertyData = [];
        $noLiberty = 1;
        foreach ($libertyHadir as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $libertyData[] = [
                $noLiberty,
                $nama
            ];
            $noLiberty++;
        }
        
        // Tambahkan baris kosong hingga minimal 45
        while (count($libertyData) < 45) {
            $libertyData[] = [count($libertyData) + 1, ''];
        }

        // Buat keterangan untuk Eifel
        $eifelKeterangan = [];
        $eifelKeterangan[] = ['Keterangan :', '', ''];
        $eifelKeterangan[] = ['', 'tower Eifel', ''];
        $eifelKeterangan[] = ['', '', ''];
        $eifelKeterangan[] = ['TOTAL ', $eifelTotal, 'Orang'];
        
        // Sakit
        $sakitCount = $eifelSakit->count();
        $sakitArray = $eifelSakit->values()->all();
        if ($sakitCount > 0) {
            $nama = $sakitArray[0]['user']['name'] ?? $sakitArray[0]['nama'] ?? $sakitArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Sakit', $sakitCount, $nama];
            for ($i = 1; $i < $sakitCount; $i++) {
                $nama = $sakitArray[$i]['user']['name'] ?? $sakitArray[$i]['nama'] ?? $sakitArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Sakit', "0", ''];
        }
        
        // Cuti
        $cutiCount = $eifelCuti->count();
        $cutiArray = $eifelCuti->values()->all();
        if ($cutiCount > 0) {
            $nama = $cutiArray[0]['user']['name'] ?? $cutiArray[0]['nama'] ?? $cutiArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Cuti', $cutiCount, $nama];
            for ($i = 1; $i < $cutiCount; $i++) {
                $nama = $cutiArray[$i]['user']['name'] ?? $cutiArray[$i]['nama'] ?? $cutiArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Cuti', "0", ''];
        }
        
        // Dinas Luar
        $dinasCount = $eifelDinasLuar->count();
        $dinasArray = $eifelDinasLuar->values()->all();
        if ($dinasCount > 0) {
            $nama = $dinasArray[0]['user']['name'] ?? $dinasArray[0]['nama'] ?? $dinasArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Dinas Luar', $dinasCount, $nama];
            for ($i = 1; $i < $dinasCount; $i++) {
                $nama = $dinasArray[$i]['user']['name'] ?? $dinasArray[$i]['nama'] ?? $dinasArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Dinas Luar', '0', ''];
        }
        
        // Keluar kantor
        $keluarCount = $eifelKeluar->count();
        $keluarArray = $eifelKeluar->values()->all();
        if ($keluarCount > 0) {
            $nama = $keluarArray[0]['user']['name'] ?? $keluarArray[0]['nama'] ?? $keluarArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Keluar kantor', $keluarCount, $nama];
            for ($i = 1; $i < $keluarCount; $i++) {
                $nama = $keluarArray[$i]['user']['name'] ?? $keluarArray[$i]['nama'] ?? $keluarArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Keluar kantor', "0", ''];
        }

        $eifelHadirTotals = $eifelAll->count() - ($sakitCount + $cutiCount + $dinasCount + $keluarCount);
        $eifelKeterangan[] = ['', '', ''];
        if($eifelHadirTotals > 0){
            $eifelKeterangan[] = ['Total', $eifelHadirTotals, ''];
        } else {
            $eifelKeterangan[] = ['Total', '0', ''];
        }

        // Buat keterangan untuk Liberty
        $libertyKeterangan = [];
        $libertyKeterangan[] = ['Keterangan :', '', ''];
        $libertyKeterangan[] = ['', 'tower liberty', ''];
        $libertyKeterangan[] = ['', '', ''];
        $libertyKeterangan[] = ['TOTAL ' , $libertyTotal, 'Orang'];
        
        // Sakit
        $sakitCountL = $libertySakit->count();
        $sakitArrayL = $libertySakit->values()->all();
        if ($sakitCountL > 0) {
            $nama = $sakitArrayL[0]['user']['name'] ?? $sakitArrayL[0]['nama'] ?? $sakitArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Sakit', $sakitCountL, $nama];
            for ($i = 1; $i < $sakitCountL; $i++) {
                $nama = $sakitArrayL[$i]['user']['name'] ?? $sakitArrayL[$i]['nama'] ?? $sakitArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Sakit', "0", ''];
        }
        
        // Cuti
        $cutiCountL = $libertyCuti->count();
        $cutiArrayL = $libertyCuti->values()->all();
        if ($cutiCountL > 0) {
            $nama = $cutiArrayL[0]['user']['name'] ?? $cutiArrayL[0]['nama'] ?? $cutiArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Cuti', $cutiCountL, $nama];
            for ($i = 1; $i < $cutiCountL; $i++) {
                $nama = $cutiArrayL[$i]['user']['name'] ?? $cutiArrayL[$i]['nama'] ?? $cutiArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Cuti', "0", ''];
        }
        
        // Dinas Luar
        $dinasCountL = $libertyDinasLuar->count();
        $dinasArrayL = $libertyDinasLuar->values()->all();
        if ($dinasCountL > 0) {
            $nama = $dinasArrayL[0]['user']['name'] ?? $dinasArrayL[0]['nama'] ?? $dinasArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Dinas Luar', $dinasCountL, $nama];
            for ($i = 1; $i < $dinasCountL; $i++) {
                $nama = $dinasArrayL[$i]['user']['name'] ?? $dinasArrayL[$i]['nama'] ?? $dinasArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Dinas Luar', "0", ''];
        }
        
        // Keluar kantor
        $keluarCountL = $libertyKeluar->count();
        $keluarArrayL = $libertyKeluar->values()->all();
        if ($keluarCountL > 0) {
            $nama = $keluarArrayL[0]['user']['name'] ?? $keluarArrayL[0]['nama'] ?? $keluarArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Keluar kantor', $keluarCountL, $nama];
            for ($i = 1; $i < $keluarCountL; $i++) {
                $nama = $keluarArrayL[$i]['user']['name'] ?? $keluarArrayL[$i]['nama'] ?? $keluarArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Keluar kantor', "0", ''];
        }

        $libertyHadirTotals = $libertyAll->count() - ($sakitCountL + $cutiCountL + $dinasCountL + $keluarCountL);
        $libertyKeterangan[] = ['', '', ''];
        if($libertyHadirTotals > 0){
            $libertyKeterangan[] = ['Total', $libertyHadirTotals, ''];
        } else {
            $libertyKeterangan[] = ['Total', '0', ''];
        }

        // Hitung total untuk akumulasi
        $totalLantai19 = $eifelHadirTotals;
        $totalLantai1 = $libertyHadirTotals;
        $totalMarein = 0; // Sesuaikan jika ada data Marein
        $totalAkumulasi = $totalLantai19 + $totalLantai1 + $totalMarein;

        // Tambahkan tabel akumulasi
        $akumulasiTable = [];
        $akumulasiTable[] = ['', '', ''];
        $akumulasiTable[] = ['', '', ''];
        $akumulasiTable[] = ['Akumulasi', '', ''];
        $akumulasiTable[] = ['Lantai 19', '', $totalLantai19];
        $akumulasiTable[] = ['Lantai 1', '', $totalLantai1];
        $akumulasiTable[] = ['Marein', '', $totalMarein];
        $akumulasiTable[] = ['Total', '', $totalAkumulasi];

        // Gabungkan semua keterangan
        $allKeterangan = array_merge($eifelKeterangan, [['', '', '']], $libertyKeterangan, $akumulasiTable);

        // Tentukan jumlah baris maksimal (minimal 45 atau sesuai keterangan)
        $maxDataRows = max(45, count($eifelData), count($libertyData));
        $keteranganRows = count($allKeterangan);

        // Pastikan tinggi tabel sama dengan keterangan
        $totalRows = max($maxDataRows, $keteranganRows);

        // Gabungkan data hadir Eifel dan Liberty dengan keterangan di kolom kanan
        for ($i = 0; $i < $totalRows; $i++) {
            $row = [
                $eifelData[$i][0] ?? '',
                $eifelData[$i][1] ?? '',
                $libertyData[$i][0] ?? '',
                $libertyData[$i][1] ?? '',
                '', // Kolom pemisah
                $allKeterangan[$i][0] ?? '',
                $allKeterangan[$i][1] ?? '',
                $allKeterangan[$i][2] ?? '',
            ];
            $data[] = $row;
        }

        return collect($data);
    }

    public function headings(): array
    {
        // Format tanggal dalam bahasa Indonesia
        $bulanIndo = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        
        $tanggalObj = \DateTime::createFromFormat('Y-m-d', $this->tanggal);
        if (!$tanggalObj) {
            $tanggalObj = new \DateTime($this->tanggal);
        }
        
        $hari = $tanggalObj->format('d');
        $bulan = $bulanIndo[(int)$tanggalObj->format('m')];
        $tahun = $tanggalObj->format('Y');
        
        $tanggalFormatted = $hari . ' ' . $bulan . ' ' . $tahun;
        
        return [
            ['Laporan Absen ' . $tanggalFormatted],
            ['', '', '', '', '', '', '', ''],
            ['Eifel', '', 'Liberty', '', '', '', '', ''],
            ['No', 'Nama', 'No', 'Nama', '', '', '', '']
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,
            'B' => 30,
            'C' => 8,
            'D' => 30,
            'E' => 2,
            'F' => 15,
            'G' => 10,
            'H' => 25,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 14],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ],
            3 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'CCCCCC']
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
            ],
            4 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'CCCCCC']
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Merge cells for title
                $sheet->mergeCells('A1:D1');
                
                // Merge cells untuk header Tower
                $sheet->mergeCells('A3:B3');
                $sheet->mergeCells('C3:D3');
                
                // Apply borders to all data columns (A-D)
                $highestRow = $sheet->getHighestRow();
                $sheet->getStyle('A4:D' . $highestRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ],
                    ],
                ]);

                // Apply borders to Keterangan (F-H) untuk semua baris
                $sheet->getStyle('F4:H' . $highestRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ],
                    ],
                ]);

                // Center align untuk kolom nomor dan jumlah
                $sheet->getStyle('A:A')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('C:C')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('G:G')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                
                // Left align untuk kolom nama
                $sheet->getStyle('B:B')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('D:D')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('H:H')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // Highlight specific rows
                for ($row = 5; $row <= $highestRow; $row++) {
                    $cellValueF = $sheet->getCell('F' . $row)->getValue();
                    $cellValueG = $sheet->getCell('G' . $row)->getValue();
                    
                    // Highlight untuk "Keterangan :"
                    if ($cellValueF === 'Keterangan :') {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true]
                        ]);
                    }
                    
                    // Highlight untuk baris "tower ..."
                    if (strpos($cellValueG, 'tower') === 0) {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true]
                        ]);
                    }

                    // Highlight untuk "Total"
                    if ($cellValueF === 'Total') {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true]
                        ]);
                    }
                }
            },
        ];
    }
}