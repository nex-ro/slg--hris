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

    protected function getStatusLabel($status): string
    {
        if (empty($status)) {
            return 'N/A';
        }

        $statusMap = [
            'Hadir' => 'Hadir',
            'Sakit' => 'Sakit',
            'P1' => 'Ijin Full Day',
            'P2' => 'Ijin Setengah Hari',
            'P3' => 'Ijin Keluar Kantor',
            'C1' => 'Cuti Full Day',
            'C2' => 'Cuti Setengah Hari',
            'DL' => 'Dinas Luar',
            'WFH' => 'Work From Home',
            'FP-TR' => 'FP Tidak Ter-Record',
            'LK' => 'Libur Kerja',
        ];

        $statusNormalized = strtoupper(trim($status));
        
        foreach ($statusMap as $key => $label) {
            if (strtoupper($key) === $statusNormalized) {
                return $label;
            }
        }
        return !empty($status) ? $status : 'N/A';
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
            
            // Ambil TMK dari data user
            $tmkFormatted = 'N/A';
            if (!empty($dataKehadiran) && isset($dataKehadiran[0]['user']['tmk'])) {
                $tmk = $dataKehadiran[0]['user']['tmk'];
                if ($tmk) {
                    $tmkFormatted = Carbon::parse($tmk)->format('d F Y');
                }
            }

            // Header Baris 1: Judul Utama
            $data[] = ['MONITORING KEHADIRAN KARYAWAN'];
            
            // Header Baris 2: Bulan dan Tahun
            $data[] = ['BULAN ' . strtoupper($namaBulan[$this->bulan]) . ' ' . $this->tahun];
            
            // Header Baris 3: Baris kosong
            $data[] = [''];
            
            // Header Baris 4: Nama Karyawan dan TMK (Nama * akan merge A-B, nama di C)
            $data[] = ['Nama *', '', $namaKaryawan, '', '', '', 'TMK * :', $tmkFormatted];

            // Header Baris 5: Header Tabel
            $data[] = [
                'No.',
                'Tanggal',
                'Hari',
                'Nama Karyawan',
                'Department',
                'Jabatan',
                'Jam Masuk',
                'Jam Pulang',
                'Keterangan'
            ];

            // Data Absensi per hari
            $no = 1;
            for ($i = 1; $i <= $jumlahHari; $i++) {
                $tanggalCari = Carbon::create($this->tahun, $this->bulan, $i)->format('Y-m-d');
                $absensi = collect($dataKehadiran)->firstWhere('tanggal', $tanggalCari);
                
                if ($absensi) {
                    $tanggalObj = Carbon::parse($absensi['tanggal']);
                    $data[] = [
                        $no,
                        $tanggalObj->format('d-M-y'),
                        $tanggalObj->locale('id')->dayName,
                        $absensi['user']['name'],
                        $absensi['user']['divisi'],
                        $absensi['user']['jabatan'],
                        $absensi['jam_kedatangan'] ?? '-',
                        $absensi['jam_pulang'] ?? '-',
                        $this->getStatusLabel($absensi['status'])
                    ];
                } else {
                    $tanggalObj = Carbon::create($this->tahun, $this->bulan, $i);
                    $data[] = [
                        $no,
                        $tanggalObj->format('d-M-y'),
                        $tanggalObj->locale('id')->dayName,
                        $namaKaryawan,
                        $karyawan['divisi'] ?? '-',
                        $karyawan['jabatan'] ?? '-',
                        '-',
                        '-',
                        'N/A'
                    ];
                }
                $no++;
            }

            // Summary Section
            $statusCount = $this->hitungStatus($dataKehadiran);
            $data[] = ['Ket.', '', '', '', '', '', '', '', ''];
            $data[] = ['', '- On Time * :', '', (string)$statusCount['on_time'], 'Hari', '', 'Dibuat Oleh,', '', 'Diperiksa Oleh,'];
            $data[] = ['', '- Terlambat * :', '', (string)$statusCount['terlambat'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Sakit * :', '', (string)$statusCount['sakit'], 'Hari', '', '', '', ''];
            $data[] = ['', '- P1 (Ijin Full Day) * :', '', (string)$statusCount['p1'], 'Hari', '', '', '', ''];
            $data[] = ['', '- P2 (Ijin Setengah Hari) * :', '', (string)$statusCount['p2'], 'Hari', '', 'Jack Sen', '', 'Jupiter'];
            $data[] = ['', '- P3 (Ijin Keluar Kantor) * :', '', (string)$statusCount['p3'], 'Hari', '', 'Staff HRD', '', 'Head of HRD'];
            $data[] = ['', '- C1 (Cuti Full Day) * :', '', (string)$statusCount['c1'], 'Hari', '', '', '', ''];
            $data[] = ['', '- C2 (Cuti Setengah Hari) * :', '', (string)$statusCount['c2'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Mangkir * :', '', (string)$statusCount['mangkir'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Dinas Luar * :', '', (string)$statusCount['dinas_luar'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Work From Home * :', '', (string)$statusCount['wfh'], 'Hari', '', '', '', ''];
            $data[] = ['', '- FP Tidak Ter-Record * :', '', (string)$statusCount['fp_tidak_record'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Libur Kerja * :', '', (string)$statusCount['libur'], 'Hari', '', '', '', ''];
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
            $status = strtoupper(trim($absensi['status'] ?? ''));
            
            switch ($status) {
                case 'HADIR':
                case 'ON TIME':
                    $count['on_time']++;
                    break;
                case 'SAKIT':
                    $count['sakit']++;
                    break;
                case 'P1':
                    $count['p1']++;
                    break;
                case 'P2':
                    $count['p2']++;
                    break;
                case 'P3':
                    $count['p3']++;
                    break;
                case 'C1':
                    $count['c1']++;
                    break;
                case 'C2':
                    $count['c2']++;
                    break;
                case 'DL':
                    $count['dinas_luar']++;
                    break;
                case 'WFH':
                    $count['wfh']++;
                    break;
                case 'FP-TR':
                    $count['fp_tidak_record']++;
                    break;
                case 'LK':
                case 'LIBUR KERJA':
                    $count['libur']++;
                    break;
                default:
                    $statusLower = strtolower($status);
                    if (strpos($statusLower, 'terlambat') !== false) {
                        $count['terlambat']++;
                    } elseif (strpos($statusLower, 'mangkir') !== false || strpos($statusLower, 'alpha') !== false) {
                        $count['mangkir']++;
                    }
                    break;
            }
        }

        return $count;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No.
            'B' => 12,  // Tanggal
            'C' => 12,  // Hari
            'D' => 25,  // Nama Karyawan
            'E' => 20,  // Department
            'F' => 20,  // Jabatan
            'G' => 12.5,  // Jam Masuk
            'H' => 12.5,  // Jam Pulang
            'I' => 25,  // Keterangan
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $currentRow = 1;

        foreach ($this->karyawanData as $karyawan) {
            $dataKehadiran = $karyawan['data'];
            $jumlahHari = Carbon::create($this->tahun, $this->bulan, 1)->daysInMonth;
            
            // Baris 1: MONITORING KEHADIRAN KARYAWAN (merge A-I, center, bold, size 14)
            $sheet->mergeCells("A{$currentRow}:I{$currentRow}");
            $sheet->getStyle("A{$currentRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 14],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
            $currentRow++;

            // Baris 2: BULAN X 2025 (merge A-I, center, bold, size 12)
            $sheet->mergeCells("A{$currentRow}:I{$currentRow}");
            $sheet->getStyle("A{$currentRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
            $currentRow++;

            // Baris 3: Kosong
            $currentRow++;

            // Baris 4: Nama dan TMK - MERGE A dan B untuk "Nama *"
            $sheet->mergeCells("A{$currentRow}:B{$currentRow}");
            $sheet->getStyle("A{$currentRow}:I{$currentRow}")->applyFromArray([
                'font' => ['bold' => false, 'size' => 12],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER]
            ]);
            $currentRow++;

            // Baris 5: Header tabel (size 12)
            $headerRow = $currentRow;
            $sheet->getStyle("A{$headerRow}:I{$headerRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12],
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
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
            $currentRow++;

            // Data rows - semua center dan size 12
            for ($i = 0; $i < $jumlahHari; $i++) {
                $rowNumber = $currentRow;
                
                // Cek apakah hari libur
                $tanggalCari = Carbon::create($this->tahun, $this->bulan, $i + 1)->format('Y-m-d');
                $absensi = collect($dataKehadiran)->firstWhere('tanggal', $tanggalCari);
                $isLibur = false;
                
                if ($absensi) {
                    $status = strtoupper(trim($absensi['status'] ?? ''));
                    $isLibur = ($status === 'LK' || $status === 'LIBUR KERJA');
                }
                
                // Apply styling dengan semua center dan size 12
                if ($isLibur) {
                    $sheet->getStyle("A{$rowNumber}:I{$rowNumber}")->applyFromArray([
                        'font' => ['color' => ['rgb' => 'FF0000'], 'size' => 12],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'E8E8E8']
                        ],
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => '000000']
                            ]
                        ],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
                    ]);
                } else {
                    $sheet->getStyle("A{$rowNumber}:I{$rowNumber}")->applyFromArray([
                        'font' => ['size' => 12],
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => '000000']
                            ]
                        ],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
                    ]);
                }
                
                $currentRow++;
            }

            // Summary section (size 12)
            $summaryStart = $currentRow;

            // Row 1: Ket. (tanpa border)
            $sheet->getStyle("A{$currentRow}:I{$currentRow}")->applyFromArray([
                'font' => ['size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
            $currentRow++;

            // Row 2: On Time dengan "Dibuat Oleh," dan "Diperiksa Oleh,"
            // Hanya G-I yang punya border
            $sheet->mergeCells("G{$currentRow}:H{$currentRow}");
            
            // Style untuk kolom A-F (tanpa border)
            $sheet->getStyle("A{$currentRow}:F{$currentRow}")->applyFromArray([
                'font' => ['size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
            
            // Style untuk kolom G-H (dengan border)
            $sheet->getStyle("G{$currentRow}:H{$currentRow}")->applyFromArray([
                'font' => ['size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]]
            ]);
            
            // Style untuk kolom I (dengan border)
            $sheet->getStyle("I{$currentRow}")->applyFromArray([
                'font' => ['size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]]
            ]);

            $currentRow++;
            $signatureStartRow = $currentRow;
            $signatureEndRow = $currentRow + 2;

            // Area tanda tangan G-H untuk "Dibuat Oleh"
            $sheet->mergeCells("G{$signatureStartRow}:H{$signatureEndRow}");
            $sheet->getStyle("G{$signatureStartRow}:H{$signatureEndRow}")->applyFromArray([
                'font' => ['size' => 12],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);

            // Area tanda tangan I untuk "Diperiksa Oleh"
            $sheet->mergeCells("I{$signatureStartRow}:I{$signatureEndRow}");
            $sheet->getStyle("I{$signatureStartRow}:I{$signatureEndRow}")->applyFromArray([
                'font' => ['size' => 12],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);

            $currentRow += 3;

            // Baris nama (setelah area signature)
            $nameRowSignature = $signatureEndRow + 1;
            $sheet->mergeCells("G{$nameRowSignature}:H{$nameRowSignature}");
            $sheet->getStyle("G{$nameRowSignature}:I{$nameRowSignature}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]]
            ]);

            // Baris jabatan
            $positionRowSignature = $nameRowSignature + 1;
            $sheet->mergeCells("G{$positionRowSignature}:H{$positionRowSignature}");
            $sheet->getStyle("G{$positionRowSignature}:I{$positionRowSignature}")->applyFromArray([
                'font' => ['size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]]
            ]);

            // Tulis nama dan jabatan
            $sheet->setCellValue("G{$nameRowSignature}", "Jack Sen");
            $sheet->setCellValue("I{$nameRowSignature}", "Jupiter");
            $sheet->setCellValue("G{$positionRowSignature}", "Staff HRD");
            $sheet->setCellValue("I{$positionRowSignature}", "Head of HRD");

            $currentRow += 2;

            // Summary stats styling (size 12, tanpa border)
            for ($i = 2; $i <= 13; $i++) {
                $row = $summaryStart + $i;
                $sheet->mergeCells("B{$row}:C{$row}");
                $sheet->getStyle("A{$row}:F{$row}")->applyFromArray([
                    'font' => ['size' => 12],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
                ]);

                $sheet->getStyle("D{$row}")->applyFromArray([
                    'font' => ['size' => 12],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
                ]);
            }

            $currentRow = $summaryStart + 14;
        }

        return [];
    }
}