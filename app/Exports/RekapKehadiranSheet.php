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

class RekapKehadiranSheet implements FromArray, WithTitle, WithStyles
{
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

    public function array(): array
    {
        $namaBulan = strtoupper(Carbon::create($this->tahun, $this->bulan, 1)->locale('id')->monthName);
        
        $data = [];
        
        // Baris 1: Title
        $data[] = ['MONITORING KEHADIRAN KARYAWAN'];
        
        // Baris 2: Subtitle
        $data[] = ["BULAN {$namaBulan} {$this->tahun}"];
        
        // Baris 3: Kosong
        $data[] = [''];

        // Group by Divisi
        $groupedUsers = $this->users->groupBy('divisi');
        $divisiCount = 0;
        $totalDivisi = $groupedUsers->count();

        foreach ($groupedUsers as $divisi => $divisiUsers) {
            $divisiCount++;
            
            // Baris Divisi Header
            $data[] = ["Dept. * " . ($divisi ?? 'Tanpa Divisi')];
            
            // Baris Table Header
            $headerRow = [
                'No.', 
                'Nama', 
                'Jabatan', 
                'Divisi', 
                'On Time', 
                'Terlambat', 
                'Sakit', 
                'P1', 
                'P2', 
                'P3', 
                'C1', 
                'C2', 
                'Mangkir', 
                'DL', 
                'WFH', 
                'FP-TR', 
                'LK'
            ];
            $data[] = $headerRow;

            // Data rows
            $no = 1;
            foreach ($divisiUsers as $user) {
                $stats = $this->calculateUserStats($user->id);
                
                $row = [
                    $no++,
                    $user->name ?? '',
                    $user->jabatan ?? '',
                    $user->divisi ?? '',
                    (int)$stats['ontime'],
                    (int)$stats['terlambat'],
                    (int)$stats['Sakit'],
                    (int)$stats['P1'],
                    (int)$stats['P2'],
                    (int)$stats['P3'],
                    (int)$stats['C1'],
                    (int)$stats['C2'],
                    (int)$stats['Mangkir'],
                    (int)$stats['DL'],
                    (int)$stats['WFH'],
                    (int)$stats['FP-TR'],
                    (int)$stats['LK']
                ];
                
                $data[] = $row;
            }

            // Keterangan
            $data[] = ["Keterangan : P1 (Ijin Full Day); P2 (Ijin Setengah Hari); P3 (Ijin Keluar Kantor); C1 (Cuti Full Day); C2 (Cuti Setengah Hari); DL (Dinas Luar); WFH (Work From Home); FP-TR (FP Tidak Ter-Record); LK (Libur Kerja)"];
            
            // Tambahkan 2 baris kosong setelah setiap divisi kecuali divisi terakhir
            if ($divisiCount < $totalDivisi) {
                $data[] = [''];
                $data[] = [''];
            }
        }

        return $data;
    }

    public function styles(Worksheet $sheet)
    {
        $lastColumn = 'Q';
        
        // Baris 1: Title styling
        $sheet->mergeCells('A1:' . $lastColumn . '1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
        ]);
        $sheet->getRowDimension(1)->setRowHeight(25);

        // Baris 2: Subtitle styling
        $sheet->mergeCells('A2:' . $lastColumn . '2');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
        ]);
        $sheet->getRowDimension(2)->setRowHeight(20);

        // Baris 3: Kosong
        $sheet->getRowDimension(3)->setRowHeight(15);

        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(6);   // No
        $sheet->getColumnDimension('B')->setWidth(25);  // Nama
        $sheet->getColumnDimension('C')->setWidth(25);  // Jabatan
        $sheet->getColumnDimension('D')->setWidth(20);  // Divisi
        
        // Set uniform width for status columns
        foreach (range('E', 'Q') as $col) {
            $sheet->getColumnDimension($col)->setWidth(10);
        }

        // Style untuk setiap section divisi
        $currentRow = 4;
        $groupedUsers = $this->users->groupBy('divisi');
        $divisiCount = 0;
        $totalDivisi = $groupedUsers->count();

        foreach ($groupedUsers as $divisi => $divisiUsers) {
            $divisiCount++;
            
            // Divisi header
            $sheet->mergeCells("A{$currentRow}:{$lastColumn}{$currentRow}");
            $sheet->getStyle("A{$currentRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 11],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E8E8E8']]
            ]);
            $sheet->getRowDimension($currentRow)->setRowHeight(20);
            $currentRow++;

            // Header row
            $headerRow = $currentRow;
            $sheet->getStyle("A{$headerRow}:{$lastColumn}{$headerRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D0D0D0']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER, 
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true
                ]
            ]);
            $sheet->getRowDimension($headerRow)->setRowHeight(30);
            $currentRow++;

            // Data rows
            $dataRowStart = $currentRow;
            $dataRowEnd = $currentRow + $divisiUsers->count() - 1;
            
            if ($dataRowEnd >= $dataRowStart) {
                $sheet->getStyle("A{$dataRowStart}:{$lastColumn}{$dataRowEnd}")->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    'font' => ['size' => 10]
                ]);

                // Center alignment untuk kolom No dan data numerik
                $sheet->getStyle("A{$dataRowStart}:A{$dataRowEnd}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("E{$dataRowStart}:{$lastColumn}{$dataRowEnd}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Set number format untuk kolom angka agar 0 tetap tampil sebagai angka
                foreach (range('E', $lastColumn) as $col) {
                    for ($row = $dataRowStart; $row <= $dataRowEnd; $row++) {
                        $cellValue = $sheet->getCell($col . $row)->getValue();
                        if ($cellValue === '' || $cellValue === null) {
                            $sheet->setCellValue($col . $row, 0);
                        }
                    }
                }
                $sheet->getStyle("E{$dataRowStart}:{$lastColumn}{$dataRowEnd}")->getNumberFormat()->setFormatCode('0');
                
                // Set row height untuk data rows
                for ($i = $dataRowStart; $i <= $dataRowEnd; $i++) {
                    $sheet->getRowDimension($i)->setRowHeight(18);
                }
            }

            $currentRow = $dataRowEnd + 1;

            // Keterangan
            $sheet->mergeCells("A{$currentRow}:{$lastColumn}{$currentRow}");
            $sheet->getStyle("A{$currentRow}")->applyFromArray([
                'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '666666']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
            $sheet->getRowDimension($currentRow)->setRowHeight(15);
            $currentRow++;
            
            // Tambahkan 2 baris gap kosong antar divisi kecuali divisi terakhir
            if ($divisiCount < $totalDivisi) {
                $sheet->getRowDimension($currentRow)->setRowHeight(10);
                $currentRow++;
                $sheet->getRowDimension($currentRow)->setRowHeight(10);
                $currentRow++;
            }
        }

        return [];
    }

    public function title(): string
    {
        return 'Rekap Kehadiran';
    }

    private function calculateUserStats($userId)
    {
        $stats = [
            'ontime' => 0,
            'terlambat' => 0,
            'Sakit' => 0,
            'P1' => 0,
            'P2' => 0,
            'P3' => 0,
            'C1' => 0,
            'C2' => 0,
            'Mangkir' => 0,
            'DL' => 0,
            'WFH' => 0,
            'FP-TR' => 0,
            'LK' => 0
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
                
                $statusLower = strtolower($status);
                
                if ($statusLower == 'ontime' || $statusLower == 'on time') {
                    $stats['ontime']++;
                } 
                elseif ($statusLower == 'terlambat') {
                    $stats['terlambat']++;
                } 
                elseif (in_array($status, ['Sakit', 'P1', 'P2', 'P3', 'C1', 'C2', 'DL', 'WFH', 'FP-TR', 'LK'])) {
                    $stats[$status]++;
                }
                elseif ($status == 'Mangkir') {
                    $stats['Mangkir']++;
                }
            }
        }

        return $stats;
    }
}