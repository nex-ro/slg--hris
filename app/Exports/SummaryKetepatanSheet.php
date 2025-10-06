<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class SummaryKetepatanSheet implements FromArray, WithTitle, WithStyles
{
    protected $dataPerTanggal;
    protected $users;
    protected $bulan;
    protected $tahun;

    public function __construct($dataPerTanggal, $users, $bulan, $tahun)
    {
        $this->dataPerTanggal = $dataPerTanggal;
        $this->users = $users;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
    }

    public function array(): array
    {
        $namaBulan = strtoupper(Carbon::create($this->tahun, $this->bulan, 1)->locale('id')->monthName);
        
        $data = [];
        
        // Title
        $data[] = ['SUMMARY KETEPATAN WAKTU KEHADIRAN'];
        $data[] = ["BULAN {$namaBulan} {$this->tahun}"];

        // Table Header
        $data[] = ['No.', 'Nama', 'Divisi', 'Jabatan', 'On Time', 'Terlambat', 'Persentase On Time'];

        // Data rows
        $no = 1;
        foreach ($this->users as $user) {
            $stats = $this->calculateUserStats($user->id);
            
            $total = $stats['ontime'] + $stats['terlambat'];
            $percentage = $total > 0 ? ($stats['ontime'] / $total * 100) : 0;

            $row = [
                $no++,
                $user->name,
                $user->divisi ?? '-',
                $user->jabatan ?? '-',
                (int)$stats['ontime'],
                (int)$stats['terlambat'],
                number_format($percentage, 2) . '%'
            ];
            
            $data[] = $row;
        }

        return $data;
    }

    public function styles(Worksheet $sheet)
    {
        $lastColumn = 'G';
        $lastRow = 3 + $this->users->count();
        
        // Title styling
        $sheet->mergeCells('A1:' . $lastColumn . '1');
        $sheet->mergeCells('A2:' . $lastColumn . '2');
        
        $sheet->getStyle('A1:A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
        ]);

        // Set row height untuk title
        $sheet->getRowDimension(1)->setRowHeight(25);
        $sheet->getRowDimension(2)->setRowHeight(20);

        // Header styling
        $sheet->getStyle('A3:' . $lastColumn . '3')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D0D0D0']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER, 
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true
            ]
        ]);

        // Set row height untuk header
        $sheet->getRowDimension(3)->setRowHeight(30);

        // Data styling
        $sheet->getStyle('A4:' . $lastColumn . $lastRow)->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER]
        ]);

        // Center alignment untuk kolom No, On Time, Terlambat, Persentase
        $sheet->getStyle('A4:A' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('E4:G' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Set number format untuk kolom On Time dan Terlambat agar 0 tetap tampil
        $sheet->getStyle('E4:F' . $lastRow)->getNumberFormat()->setFormatCode('0');
        
        // Set value eksplisit untuk cell yang kosong di kolom E dan F
        for ($row = 4; $row <= $lastRow; $row++) {
            foreach (['E', 'F'] as $col) {
                $cellValue = $sheet->getCell($col . $row)->getValue();
                if ($cellValue === '' || $cellValue === null) {
                    $sheet->setCellValue($col . $row, 0);
                }
            }
        }

        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(30);
        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(20);

        // Conditional formatting untuk persentase
        for ($row = 4; $row <= $lastRow; $row++) {
            $percentageValue = $sheet->getCell('G' . $row)->getValue();
            $percentageNumeric = (float) str_replace(['%', ','], ['', '.'], $percentageValue);
            
            if ($percentageNumeric >= 90) {
                // Hijau untuk >= 90%
                $sheet->getStyle('G' . $row)->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'C6EFCE']],
                    'font' => ['color' => ['rgb' => '006100'], 'bold' => true]
                ]);
            } elseif ($percentageNumeric >= 75) {
                // Kuning untuk 75-89%
                $sheet->getStyle('G' . $row)->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFEB9C']],
                    'font' => ['color' => ['rgb' => '9C6500'], 'bold' => true]
                ]);
            } else {
                // Merah untuk < 75%
                $sheet->getStyle('G' . $row)->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFC7CE']],
                    'font' => ['color' => ['rgb' => '9C0006'], 'bold' => true]
                ]);
            }
        }

        return [];
    }

    public function title(): string
    {
        return 'Summary Ketepatan';
    }

    private function calculateUserStats($userId)
    {
        $stats = [
            'ontime' => 0,
            'terlambat' => 0
        ];

        if (empty($this->dataPerTanggal)) {
            return $stats;
        }

        foreach ($this->dataPerTanggal as $tanggalData) {
            if (!isset($tanggalData['data']) || !is_array($tanggalData['data'])) {
                continue;
            }

            foreach ($tanggalData['data'] as $attendance) {
                if (!isset($attendance['user']['id']) || $attendance['user']['id'] != $userId) {
                    continue;
                }

                $status = $attendance['status'] ?? null;
                
                if (!$status) {
                    continue;
                }
                
                // Cek berdasarkan status langsung
                if ($status == 'On Time' || strtolower($status) == 'ontime') {
                    $stats['ontime']++;
                } elseif ($status == 'Terlambat' || strtolower($status) == 'terlambat') {
                    $stats['terlambat']++;
                }
            }
        }

        return $stats;
    }
}