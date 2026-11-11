<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class AbsensiExport implements FromCollection, WithHeadings, WithStyles, WithTitle, WithEvents
{
    protected $data;
    protected $tanggal;
    protected $tower;

    public function __construct($data, $tanggal, $tower)
    {
        $this->data = $data;
        $this->tanggal = $tanggal;
        $this->tower = $tower;
    }

    public function collection()
    {
        $collection = collect();
        
        foreach ($this->data as $index => $item) {
            $collection->push([
                'no' => $index + 1,
                'tanggal' => $item['tanggal'],
                'hari' => $item['hari'] ?? 'Rabu',
                'nama' => $item['nama'],
                'divisi' => $item['divisi'],
                'tmk' => $item['tmk'],
                'jabatan' => $item['jabatan'],
                'jam_kedatangan' => $item['jam_kedatangan'],
                'jam_pulang' => $item['jam_pulang'],
                'keterangan' => $item['status'], // Ambil dari keterangan, bukan status
            ]);
        }
        return $collection;
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Hari',
            'Nama Karyawan',
            'Department',
            'TMK',
            'Jabatan',
            'Jam Masuk',
            'Jam Pulang',
            'Keterangan'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 11],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '00B050']
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER
                ]
            ],
        ];
    }

    public function title(): string
    {
        return 'Absensi ' . $this->tower;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Set column width
                foreach (range('A', 'J') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
                
                // Border untuk semua cell
                $styleArray = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000'],
                        ],
                    ],
                ];
                $lastRow = count($this->data) + 1;
                $sheet->getStyle('A1:J' . $lastRow)->applyFromArray($styleArray);
                
                // Center alignment untuk semua data
                $sheet->getStyle('A2:J' . $lastRow)->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                    ->setVertical(Alignment::VERTICAL_CENTER);
                
                // Left alignment untuk kolom Nama (D)
                $sheet->getStyle('D2:D' . $lastRow)->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_LEFT);
                
                // Beri warna berdasarkan keterangan (kolom J)
                for ($row = 2; $row <= $lastRow; $row++) {
                    $keterangan = $sheet->getCell('J' . $row)->getValue();
                    
                    // Normalisasi text (lowercase, trim)
                    $keterangan = strtolower(trim($keterangan ?? ''));
                    
                    // On Time atau N/A = Putih (default)
                    if (strpos($keterangan, 'on time') !== false || 
                        $keterangan == 'n/a' || 
                        $keterangan == '-' || 
                        $keterangan == 'libur kerja' || 
                        empty($keterangan)) {
                        // Tidak perlu set warna (tetap putih)
                        continue;
                    } 
                    // Terlambat = Merah
                    elseif (strpos($keterangan, 'terlambat') !== false) {
                        $sheet->getStyle('A' . $row . ':J' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FF0000']
                            ]
                        ]);
                    } 
                    // Selain itu = Kuning
                    else {
                        $sheet->getStyle('A' . $row . ':J' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ]
                        ]);
                    }
                }
            },
        ];
    }
}