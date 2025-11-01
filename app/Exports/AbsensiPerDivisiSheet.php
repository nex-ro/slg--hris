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

            // Header Baris 1: Judul Utama
            $data[] = ['MONITORING KEHADIRAN KARYAWAN'];
            
            // Header Baris 2: Bulan dan Tahun
            $data[] = ['BULAN ' . strtoupper($namaBulan[$this->bulan]) . ' ' . $this->tahun];
            
            // Header Baris 3: Baris kosong
            $data[] = [''];
            
            // Header Baris 4: Nama Karyawan dan TMK
            $data[] = ['Nama *', $namaKaryawan, '', '', '', '', 'TMK * :', '21 August 2023'];

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
            // Di method array(), ubah bagian Data Absensi per hari:

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
        
        // Exact match untuk kode status
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
            case 'lk':
            case 'LIBUR KERJA':
            case 'Libur Kerja':
                $count['libur']++;
                break;
            default:
                // Fallback dengan strpos untuk kompatibilitas dengan data lama
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
            'B' => 8,   // No.
            'C' => 12,  // Tanggal
            'D' => 12,  // Hari
            'E' => 25,  // Nama Karyawan
            'F' => 20,  // Department
            'G' => 20,  // Jabatan
            'H' => 12,  // Jam Masuk
            'I' => 12,  // Jam Pulang
            'J' => 20,  // Keterangan
        ];
    }

    public function styles(Worksheet $sheet)
{
    $currentRow = 1;

    foreach ($this->karyawanData as $karyawan) {
        $dataKehadiran = $karyawan['data'];
        $jumlahHari = Carbon::create($this->tahun, $this->bulan, 1)->daysInMonth;
        
        // Baris 1: MONITORING KEHADIRAN KARYAWAN (merge A-I, center, bold)
        $sheet->mergeCells("A{$currentRow}:I{$currentRow}");
        $sheet->getStyle("A{$currentRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);
        $currentRow++;

        // Baris 2: BULAN MARET 2025 (merge A-I, center, bold)
        $sheet->mergeCells("A{$currentRow}:I{$currentRow}");
        $sheet->getStyle("A{$currentRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 12],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);
        $currentRow++;

        // Baris 3: Kosong
        $currentRow++;

        // Baris 4: Nama dan TMK
        $sheet->getStyle("A{$currentRow}:I{$currentRow}")->applyFromArray([
            'font' => ['bold' => false],
        ]);
        $currentRow++;

        // Baris 5: Header tabel
        $headerRow = $currentRow;
        $sheet->getStyle("A{$headerRow}:I{$headerRow}")->applyFromArray([
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

        // Data rows dengan pengecekan hari libur
        for ($i = 0; $i < $jumlahHari; $i++) {
            $rowNumber = $currentRow;
            
            // Cek apakah baris ini adalah hari libur
            $tanggalCari = Carbon::create($this->tahun, $this->bulan, $i + 1)->format('Y-m-d');
            $absensi = collect($dataKehadiran)->firstWhere('tanggal', $tanggalCari);
            $isLibur = false;
            
            if ($absensi) {
                $status = strtoupper(trim($absensi['status'] ?? ''));
                $isLibur = ($status === 'LK' || $status === 'LIBUR KERJA');
            }
            
            // Apply styling
            if ($isLibur) {
                // Style untuk hari libur: text merah, background abu-abu muda
                $sheet->getStyle("A{$rowNumber}:I{$rowNumber}")->applyFromArray([
                    'font' => ['color' => ['rgb' => 'FF0000']], // Text merah
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'E8E8E8'] // Background abu-abu muda
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ]
                    ]
                ]);
            } else {
                // Style normal
                $sheet->getStyle("A{$rowNumber}:I{$rowNumber}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ]
                    ]
                ]);
            }
            
            $currentRow++;
        }

        // Summary section
        $summaryStart = $currentRow;
        
        // Row 1: Ket. (kosong di kolom G, H, I)
        $currentRow++;
        
        // Row 2: On Time dengan "Dibuat Oleh," dan "Diperiksa Oleh,"
    $sheet->getStyle("G{$currentRow}")->applyFromArray([
        'font' => ['size' => 9],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['rgb' => '000000']
            ]
        ]
    ]);
        
    $sheet->mergeCells("H{$currentRow}:I{$currentRow}");
    $sheet->getStyle("H{$currentRow}:I{$currentRow}")->applyFromArray([
        'font' => ['size' => 9],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['rgb' => '000000']
            ]
        ]
    ]);
        $currentRow++;
        $signatureStartRow = $currentRow;
        $signatureEndRow = $currentRow + 2;
        
        // Merge cells untuk signature area
        $sheet->mergeCells("G{$signatureStartRow}:G{$signatureEndRow}");
        $sheet->getStyle("G{$signatureStartRow}:G{$signatureEndRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
        ]);
        
        // Merge H2:I4 (3 baris) untuk area signature "Diperiksa Oleh"
        $sheet->mergeCells("H{$signatureStartRow}:I{$signatureEndRow}");
        $sheet->getStyle("H{$signatureStartRow}:I{$signatureEndRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
        ]);
        
        $sheet->mergeCells("H{$signatureStartRow}:I{$signatureEndRow}");
$sheet->getStyle("H{$signatureStartRow}:I{$signatureEndRow}")->applyFromArray([
    'borders' => [
        'allBorders' => [
            'borderStyle' => Border::BORDER_THIN,
            'color' => ['rgb' => '000000']
        ]
    ],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
]);

        // TULIS ULANG DATA HEADER "Dibuat Oleh," dan "Diperiksa Oleh," 
        // yang hilang karena merge cells
        $headerSignatureRow = $signatureStartRow - 1; // Baris "Dibuat Oleh," "Diperiksa Oleh,"
        $sheet->setCellValue("G{$headerSignatureRow}", "Dibuat Oleh,");
        $sheet->setCellValue("H{$headerSignatureRow}", "Diperiksa Oleh,");

        $currentRow += 3;
        $nameRowData = $signatureStartRow + 1; 
        $positionRowData = $signatureStartRow + 2; // Baris ketiga untuk jabatan
        
        $sheet->setCellValue("G{$nameRowData}", "Jack Sen");
        $sheet->setCellValue("H{$nameRowData}", "Jupiter");
        $sheet->setCellValue("G{$positionRowData}", "Staff HRD");
        $sheet->setCellValue("H{$positionRowData}", "Head of HRD");
        $currentRow += 3;
        $ketRow = $summaryStart;
        for ($i = 1; $i <= 13; $i++) {
            $row = $summaryStart + $i;
            $sheet->mergeCells("B{$row}:C{$row}");
            $sheet->getStyle("B{$row}:C{$row}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
        
            $sheet->getStyle("D{$row}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
        
            $sheet->getStyle("E{$row}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
            ]);
        }
        
        $nameRow = $summaryStart + 5;
        
        $sheet->getStyle("G{$nameRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 9],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);
        
        $sheet->mergeCells("H{$nameRow}:I{$nameRow}");
        $sheet->getStyle("H{$nameRow}:I{$nameRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 9],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        // Row 7: Jabatan (Staff HRD dan Head of HRD) - merge dulu
        $positionRow = $summaryStart + 6;

        // Staff HRD di kolom G (tidak merge)
        $sheet->getStyle("G{$positionRow}")->applyFromArray([
            'font' => ['size' => 9],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        // Head of HRD di kolom H-I (merge)
        $sheet->mergeCells("H{$positionRow}:I{$positionRow}");
        $sheet->getStyle("H{$positionRow}:I{$positionRow}")->applyFromArray([
            'font' => ['size' => 9],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        // TULIS ULANG SEMUA DATA SETELAH SEMUA MERGE SELESAI
        $sheet->setCellValue("G{$nameRow}", "Jack Sen");
        $sheet->setCellValue("H{$nameRow}", "Jupiter");
        $sheet->setCellValue("G{$positionRow}", "Staff HRD");
        $sheet->setCellValue("H{$positionRow}", "Head of HRD");

        $currentRow = $summaryStart + 14;

    }

    return [];
}
}