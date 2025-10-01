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
            // Tambahkan lebih banyak variasi status
            return in_array($status, [
                'ontime', 
                'hadir', 
                'terlambat',
                'late',
                'telat'
            ]) || $status !== 'n/a';
        });

        // Group by tower (bukan lantai)
        $groupedByLantai = $hadirCollection->groupBy('tower')->sortKeys();

        // Ambil data untuk Lantai 19 dan Lantai 1
        $lantai19 = $groupedByLantai->get('Eifel', collect());
        $lantai1 = $groupedByLantai->get('Liberty', collect());

        // Buat array data untuk Lantai 19
        $lantai19Data = [];
        $no19 = 1;
        foreach ($lantai19 as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $lantai19Data[] = [
                $no19,
                $nama
            ];
            $no19++;
        }

        // Buat array data untuk Lantai 1
        $lantai1Data = [];
        $no1 = 1;
        foreach ($lantai1 as $item) {
            $nama = $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '';
            $lantai1Data[] = [
                $no1,
                $nama
            ];
            $no1++;
        }

        // Tentukan jumlah baris maksimal
        $maxRows = max(count($lantai19Data), count($lantai1Data));

        // Gabungkan data
        for ($i = 0; $i < $maxRows; $i++) {
            $row = [
                $lantai19Data[$i][0] ?? '',
                $lantai19Data[$i][1] ?? '',
                $lantai1Data[$i][0] ?? '',
                $lantai1Data[$i][1] ?? '',
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
            ['', '', '', ''],
            ['Eifel', '', 'Liberty', ''],
            ['No', 'Nama', 'No', 'Nama']
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,
            'B' => 35,
            'C' => 8,
            'D' => 35,
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
                
                // Merge cells untuk header Lantai
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

                // Center align untuk kolom nomor
                $sheet->getStyle('A:A')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('C:C')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                
                // Left align untuk kolom nama
                $sheet->getStyle('B:B')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('D:D')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            },
        ];
    }
}