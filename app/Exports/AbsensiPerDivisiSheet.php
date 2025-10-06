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

            // Header Baris 1: Judul Utama
            $data[] = ['MONITORING KEHADIRAN KARYAWAN'];
            
            // Header Baris 2: Bulan dan Tahun
            $data[] = ['BULAN ' . strtoupper($namaBulan[$this->bulan]) . ' ' . $this->tahun];
            
            // Header Baris 3: Baris kosong
            $data[] = [''];
            
            // Header Baris 4: Nama Karyawan dan TMK
            $data[] = ['Nama *', $namaKaryawan, '', '', '', '', '', 'TMK * :', '21 August 2023'];
            
            // Header Baris 5: Header Tabel
            $data[] = [
                'ID',
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
                // Cari data absensi untuk tanggal ini
                $tanggalCari = Carbon::create($this->tahun, $this->bulan, $i)->format('Y-m-d');
                $absensi = collect($dataKehadiran)->firstWhere('tanggal', $tanggalCari);

                if ($absensi) {
                    $tanggalObj = Carbon::parse($absensi['tanggal']);
                    $data[] = [
                        $absensi['user']['id'], // TAMBAHKAN ID USER DI SINI
                        $no,
                        $tanggalObj->format('d-M-y'),
                        $tanggalObj->locale('id')->dayName,
                        $absensi['user']['name'],
                        $absensi['user']['divisi'],
                        $absensi['user']['jabatan'],
                        $absensi['jam_kedatangan'] ?? '-',
                        $absensi['jam_pulang'] ?? '-',
                        $absensi['status']
                    ];
                } else {
                    // Jika tidak ada data absensi untuk tanggal ini
                    $tanggalObj = Carbon::create($this->tahun, $this->bulan, $i);
                    $data[] = [
                        $karyawan['id'] ?? '', // TAMBAHKAN ID KARYAWAN DI SINI
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
            
            $data[] = ['Ket.', '', '', '', '', '', '', '', '', ''];
            $data[] = ['', '- On Time * :', '', '', (string)$statusCount['on_time'], 'Hari', '', 'Dibuat Oleh,', '', 'Diperiksa Oleh,'];
            $data[] = ['', '- Terlambat * :', '', '', (string)$statusCount['terlambat'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Sakit * :', '', '', (string)$statusCount['sakit'], 'Hari', '', '', '', ''];
            $data[] = ['', '- P1 (Ijin Full Day) * :', '', '', (string)$statusCount['p1'], 'Hari', '', '', '', ''];
            $data[] = ['', '- P2 (Ijin Setengah Hari) * :', '', '', (string)$statusCount['p2'], 'Hari', '', 'Jack Sen', '', 'Jupiter'];
            $data[] = ['', '- P3 (Ijin Keluar Kantor) * :', '', '', (string)$statusCount['p3'], 'Hari', '', 'Staff HRD', '', 'Head of HRD'];
            $data[] = ['', '- C1 (Cuti Full Day) * :', '', '', (string)$statusCount['c1'], 'Hari', '', '', '', ''];
            $data[] = ['', '- C2 (Cuti Setengah Hari) * :', '', '', (string)$statusCount['c2'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Mangkir * :', '', '', (string)$statusCount['mangkir'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Dinas Luar * :', '', '', (string)$statusCount['dinas_luar'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Work From Home * :', '', '', (string)$statusCount['wfh'], 'Hari', '', '', '', ''];
            $data[] = ['', '- FP Tidak Ter-Record * :', '', '', (string)$statusCount['fp_tidak_record'], 'Hari', '', '', '', ''];
            $data[] = ['', '- Libur Kerja * :', '', '', (string)$statusCount['libur'], 'Hari', '', '', '', ''];
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
            $status = strtolower($absensi['status'] ?? '');
            
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
            'A' => 8,   // ID
            'B' => 8,   // No.
            'C' => 12,  // Tanggal
            'D' => 12,  // Hari
            'E' => 25,  // Nama Karyawan
            'F' => 20,  // Department
            'G' => 35,  // Jabatan
            'H' => 12,  // Jam Masuk
            'I' => 12,  // Jam Pulang
            'J' => 25,  // Keterangan
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $currentRow = 1;

        foreach ($this->karyawanData as $karyawan) {
            $dataKehadiran = $karyawan['data'];
            $jumlahHari = Carbon::create($this->tahun, $this->bulan, 1)->daysInMonth;
            
            // Baris 1: MONITORING KEHADIRAN KARYAWAN (merge A-J, center, bold)
            $sheet->mergeCells("A{$currentRow}:J{$currentRow}");
            $sheet->getStyle("A{$currentRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 14],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ]);
            $currentRow++;

            // Baris 2: BULAN MARET 2025 (merge A-J, center, bold)
            $sheet->mergeCells("A{$currentRow}:J{$currentRow}");
            $sheet->getStyle("A{$currentRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ]);
            $currentRow++;

            // Baris 3: Kosong
            $currentRow++;

            // Baris 4: Nama dan TMK
            $sheet->getStyle("A{$currentRow}:J{$currentRow}")->applyFromArray([
                'font' => ['bold' => false],
            ]);
            $currentRow++;

            // Baris 5: Header tabel
            $headerRow = $currentRow;
            $sheet->getStyle("A{$headerRow}:J{$headerRow}")->applyFromArray([
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

            // Data rows (gunakan jumlah hari dari data karyawan ini)
            for ($i = 0; $i < $jumlahHari; $i++) {
                $sheet->getStyle("A{$currentRow}:J{$currentRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ]
                    ]
                ]);
                $currentRow++;
            }

            // Summary section
            $summaryStart = $currentRow;
            
            // Row 1: Ket. (kosong di kolom H, I, J)
            $currentRow++;
            
            // Row 2: On Time dengan "Dibuat Oleh," dan "Diperiksa Oleh,"
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
            
            $sheet->getStyle("J{$currentRow}")->applyFromArray([
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
            
            // Row 3-5: 3 baris kosong untuk signature (merge vertikal H2:H4 dan I2:I4, serta J2:J4)
            $signatureStartRow = $currentRow;
            $signatureEndRow = $currentRow + 2;
            
            // Merge H2:I4 (3 baris) untuk area signature "Dibuat Oleh"
            $sheet->mergeCells("H{$signatureStartRow}:I{$signatureEndRow}");
            $sheet->getStyle("H{$signatureStartRow}:I{$signatureEndRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ]
            ]);
            
            // Merge J2:J4 (3 baris) untuk area signature "Diperiksa Oleh"
            $sheet->mergeCells("J{$signatureStartRow}:J{$signatureEndRow}");
            $sheet->getStyle("J{$signatureStartRow}:J{$signatureEndRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ]
            ]);
            
            $currentRow += 3;
            
            // Merge cells untuk keterangan (B:D untuk label, E untuk angka, F untuk "Hari")
            $ketRow = $summaryStart;
            for ($i = 1; $i <= 13; $i++) {
                $row = $summaryStart + $i;
                // Merge B:D untuk label keterangan
                $sheet->mergeCells("B{$row}:D{$row}");
                $sheet->getStyle("B{$row}:D{$row}")->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
                ]);
                
                // Center untuk angka di kolom E
                $sheet->getStyle("E{$row}")->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
                ]);
                
                // Left untuk "Hari" di kolom F
                $sheet->getStyle("F{$row}")->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER]
                ]);
            }
            
            // Row 6: Nama (Jack Sen dan Jupiter)
            $nameRow = $summaryStart + 5;
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
            
            $sheet->getStyle("J{$nameRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 9],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ]
            ]);
            
            // Row 7: Jabatan (Staff HRD dan Head of HRD)
            $positionRow = $summaryStart + 6;
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
            
            $sheet->getStyle("J{$positionRow}")->applyFromArray([
                'font' => ['size' => 9],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ]
            ]);
            
            // Pindah ke baris setelah summary (14 baris summary)
            $currentRow = $summaryStart + 14;
        }

        return [];
    }
}