<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;
use Carbon\Carbon;

class AbsensiDailySheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithColumnWidths
{
    protected $data;
    protected $tanggal;
    protected $hari;

    public function __construct($data, $tanggal, $hari)
    {
        $this->data = $data;
        $this->tanggal = $tanggal;
        $this->hari = $hari;
    }

    public function collection()
    {
        return collect($this->data)->map(function($item, $index) {
            return [
                'no' => $index + 1,
                'tower' => $item['tower'],
                'tmk' => $item['tmk'],
                'nama' => $item['nama'],
                'divisi' => $item['divisi'],
                'jabatan' => $item['jabatan'],
                'jam_kedatangan' => $item['jam_kedatangan'],
                'jam_pulang' => $item['jam_pulang'],
                'keterangan' => $item['status'], // Ganti dari keterangan ke status
            ];
        });
    }

    public function headings(): array
    {
        return [
            ['LAPORAN ABSENSI HARIAN'],
            ['Tanggal: ' . Carbon::parse($this->tanggal)->locale('id')->translatedFormat('d F Y') . ' (' . $this->hari . ')'],
            [],
            [
                'No',
                'Tower',
                'TMK',
                'Nama',
                'Divisi',
                'Jabatan',
                'Jam Datang',
                'Jam Pulang',
                'Keterangan' // Header tetap Keterangan
            ]
        ];
    }

    public function title(): string
    {
        // Sheet name max 31 characters
        return Carbon::parse($this->tanggal)->format('d M Y');
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->mergeCells('A1:I1');
        $sheet->mergeCells('A2:I2');
        $styles = [
            1 => ['font' => ['bold' => true, 'size' => 14]],
            2 => ['font' => ['bold' => true]],
            4 => ['font' => ['bold' => true], 'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E0E0E0']
            ]],
        ];

        // Styling untuk baris data berdasarkan status
        $rowNumber = 5; // Mulai dari baris 5 (setelah header)
        foreach ($this->data as $item) {
            $status = $item['status'];
            
            // Warna merah untuk Terlambat
            if ($status === 'Terlambat') {
                $styles[$rowNumber] = [
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'FFB3B3'] // Merah muda
                    ]
                ];
            }
            // Warna kuning untuk DL, C1, C2, C3, P1, P2, P3, FP-TR
            elseif (in_array($status, ['DL', 'C1', 'C2', 'C3', 'P1', 'P2', 'P3', 'FP-TR'])) {
                $styles[$rowNumber] = [
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'FFFF00'] // Kuning muda
                    ]
                ];
            }
            
            $rowNumber++;
        }

        return $styles;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,
            'B' => 15,
            'C' => 15,
            'D' => 25,
            'E' => 20,
            'F' => 20,
            'G' => 12,
            'H' => 12,
            'I' => 20,
        ];
    }
}