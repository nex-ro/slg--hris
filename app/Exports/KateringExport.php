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
        $eifelHadir = $hadirGrouped->get('Eifel', collect());
        $libertyHadir = $hadirGrouped->get('Liberty', collect());
        
        $eifelAll = $allGrouped->get('Eifel', collect());
        $libertyAll = $allGrouped->get('Liberty', collect());

        // Fungsi untuk mendapatkan data berdasarkan status
        $getByStatus = function($collection, $statuses) {
            return $collection->filter(function($user) use ($statuses) {
                $status = strtolower(trim($user['status'] ?? ''));
                return in_array($status, $statuses);
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

        // Total yang hadir (dikurangi yang tidak hadir)
        $eifelHadirTotal = $eifelTotal - $eifelSakit->count() - $eifelCuti->count() - $eifelDinasLuar->count() - $eifelKeluar->count();
        $libertyHadirTotal = $libertyTotal - $libertySakit->count() - $libertyCuti->count() - $libertyDinasLuar->count() - $libertyKeluar->count();

        // Buat array data untuk Eifel (hadir)
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

        // Buat array data untuk Liberty (hadir)
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

        // Buat keterangan untuk Eifel
        $eifelKeterangan = [];
        $eifelKeterangan[] = ['Keterangan :', '', ''];
        $eifelKeterangan[] = ['', 'tower Eifel', ''];
        $eifelKeterangan[] = ['', '', ''];
        $eifelKeterangan[] = ['TOTAL ' . $eifelTotal, $eifelHadirTotal, 'Orang'];
        $eifelKeterangan[] = ['Sakit', $eifelSakit->count(), ''];
        
        foreach ($eifelSakit as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $eifelKeterangan[] = ['', '', $nama];
        }
        
        $eifelKeterangan[] = ['', '', ''];
        $eifelKeterangan[] = ['Cuti', $eifelCuti->count(), ''];
        
        foreach ($eifelCuti as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $eifelKeterangan[] = ['', '', $nama];
        }
        
        $eifelKeterangan[] = ['Dinas Luar', $eifelDinasLuar->count(), ''];
        
        foreach ($eifelDinasLuar as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $eifelKeterangan[] = ['', '', $nama];
        }
        
        $eifelKeterangan[] = ['', '', ''];
        $eifelKeterangan[] = ['Keluar kantor', $eifelKeluar->count(), ''];
        
        foreach ($eifelKeluar as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $eifelKeterangan[] = ['', '', $nama];
        }
        
        $eifelKeterangan[] = ['', '', ''];
        $eifelKeterangan[] = ['Total', $eifelHadirTotal, ''];

        // Buat keterangan untuk Liberty
        $libertyKeterangan = [];
        $libertyKeterangan[] = ['Keterangan :', '', ''];
        $libertyKeterangan[] = ['', 'tower liberty', ''];
        $libertyKeterangan[] = ['', '', ''];
        $libertyKeterangan[] = ['TOTAL ' . $libertyTotal, $libertyHadirTotal, 'Orang'];
        $libertyKeterangan[] = ['Sakit', $libertySakit->count(), ''];
        
        foreach ($libertySakit as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $libertyKeterangan[] = ['', '', $nama];
        }
        
        $libertyKeterangan[] = ['', '', ''];
        $libertyKeterangan[] = ['Cuti', $libertyCuti->count(), ''];
        
        foreach ($libertyCuti as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $libertyKeterangan[] = ['', '', $nama];
        }
        
        $libertyKeterangan[] = ['Dinas Luar', $libertyDinasLuar->count(), ''];
        
        foreach ($libertyDinasLuar as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $libertyKeterangan[] = ['', '', $nama];
        }
        
        $libertyKeterangan[] = ['', '', ''];
        $libertyKeterangan[] = ['Keluar kantor', $libertyKeluar->count(), ''];
        
        foreach ($libertyKeluar as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $libertyKeterangan[] = ['', '', $nama];
        }
        
        $libertyKeterangan[] = ['', '', ''];
        $libertyKeterangan[] = ['Total', $libertyHadirTotal, ''];

        // Tentukan jumlah baris maksimal
        $maxRows = max(count($eifelData), count($libertyData), count($eifelKeterangan), count($libertyKeterangan));

        // Gabungkan data
        for ($i = 0; $i < $maxRows; $i++) {
            $row = [
                $eifelData[$i][0] ?? '',
                $eifelData[$i][1] ?? '',
                $libertyData[$i][0] ?? '',
                $libertyData[$i][1] ?? '',
                '', // Kolom pemisah
                $eifelKeterangan[$i][0] ?? '',
                $eifelKeterangan[$i][1] ?? '',
                $eifelKeterangan[$i][2] ?? '',
                '', // Kolom pemisah
                $libertyKeterangan[$i][0] ?? '',
                $libertyKeterangan[$i][1] ?? '',
                $libertyKeterangan[$i][2] ?? '',
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
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['Eifel', '', 'Liberty', '', '', '', '', '', '', '', '', ''],
            ['No', 'Nama', 'No', 'Nama', '', '', '', '', '', '', '', '']
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
            'I' => 2,
            'J' => 15,
            'K' => 10,
            'L' => 25,
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

                // Apply borders to Keterangan Eifel (F-H)
                $sheet->getStyle('F4:H' . $highestRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ],
                    ],
                ]);

                // Apply borders to Keterangan Liberty (J-L)
                $sheet->getStyle('J4:L' . $highestRow)->applyFromArray([
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
                $sheet->getStyle('K:K')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                
                // Left align untuk kolom nama
                $sheet->getStyle('B:B')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('D:D')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('H:H')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('L:L')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // Highlight specific rows
                for ($row = 5; $row <= $highestRow; $row++) {
                    $cellValueF = $sheet->getCell('F' . $row)->getValue();
                    $cellValueJ = $sheet->getCell('J' . $row)->getValue();
                    $cellValueG = $sheet->getCell('G' . $row)->getValue();
                    $cellValueK = $sheet->getCell('K' . $row)->getValue();
                    
                    // Highlight untuk "Keterangan :" di Eifel
                    if ($cellValueF === 'Keterangan :') {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true]
                        ]);
                    }

                    // Highlight untuk "Keterangan :" di Liberty
                    if ($cellValueJ === 'Keterangan :') {
                        $sheet->getStyle('J' . $row . ':L' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true]
                        ]);
                    }
                    
                    // Highlight untuk baris "tower ..." di kolom G dan K
                    if (strpos($cellValueG, 'tower') === 0) {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true]
                        ]);
                    }

                    if (strpos($cellValueK, 'tower') === 0) {
                        $sheet->getStyle('J' . $row . ':L' . $row)->applyFromArray([
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

                    if ($cellValueJ === 'Total') {
                        $sheet->getStyle('J' . $row . ':L' . $row)->applyFromArray([
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