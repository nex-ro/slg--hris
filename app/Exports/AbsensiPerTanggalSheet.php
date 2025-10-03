<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class AbsensiPerTanggalSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithColumnWidths
{
    protected $data;
    protected $tanggal;
    protected $hari;
    protected $isHoliday;
    protected $sheetName;

    public function __construct($data, $tanggal, $hari, $isHoliday, $sheetName)
    {
        $this->data = $data;
        $this->tanggal = $tanggal;
        $this->hari = $hari;
        $this->isHoliday = $isHoliday;
        $this->sheetName = $sheetName;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return collect($this->data)->map(function ($item, $index) {
            return [
                'no' => $index + 1,
                'tower' => $item['tower'],
                'tmk' => $item['tmk'],
                'nama' => $item['nama'],
                'divisi' => $item['divisi'],
                'jabatan' => $item['jabatan'],
                'jam_kedatangan' => $item['jam_kedatangan'],
                'jam_pulang' => $item['jam_pulang'],
                'keterangan' => $item['status'],
            ];
        });
    }

    /**
     * @return array
     */
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
                'Keterangan'
            ]
        ];
    }

    /**
     * @return string
     */
    public function title(): string
    {
        // Sheet name max 31 characters
        return Carbon::parse($this->tanggal)->format('d M Y');
    }

    /**
     * @return array
     */
    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No
            'B' => 15,  // Tower
            'C' => 15,  // TMK
            'D' => 25,  // Nama
            'E' => 20,  // Divisi
            'F' => 20,  // Jabatan
            'G' => 12,  // Jam Datang
            'H' => 12,  // Jam Pulang
            'I' => 20,  // Keterangan
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        // Merge cells untuk judul
        $sheet->mergeCells('A1:I1');
        $sheet->mergeCells('A2:I2');

        $styles = [
            // Style untuk judul (baris 1)
            1 => [
                'font' => ['bold' => true, 'size' => 14],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ]
            ],
            // Style untuk tanggal (baris 2)
            2 => [
                'font' => ['bold' => true],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ]
            ],
            // Style untuk header tabel (baris 4)
            4 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E0E0E0']
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ],
        ];

        // Styling untuk baris data berdasarkan status
        $rowNumber = 5; // Mulai dari baris 5 (setelah header)
        foreach ($this->data as $item) {
            $status = $item['status'];
            
            // Border untuk semua baris data
            $styles[$rowNumber] = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ]
            ];

            // Warna merah untuk Terlambat
            if ($status === 'Terlambat') {
                $styles[$rowNumber]['fill'] = [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FFB3B3'] // Merah muda
                ];
            }
            // Warna kuning untuk DL, C1, C2, C3, P1, P2, P3, FP-TR
            elseif (in_array($status, ['DL', 'C1', 'C2', 'C3', 'P1', 'P2', 'P3', 'FP-TR'])) {
                $styles[$rowNumber]['fill'] = [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FFFF99'] // Kuning muda
                ];
            }
            // Warna kuning untuk Libur Kerja
            elseif ($status === 'Libur Kerja') {
                $styles[$rowNumber]['fill'] = [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FFF2CC'] // Kuning muda
                ];
            }
            
            $rowNumber++;
        }

        // Center alignment untuk kolom tertentu
        $lastRow = count($this->data) + 4; // +4 karena ada 3 baris header + 1 baris kosong
        $sheet->getStyle('A5:A' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('B5:B' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('C5:C' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('G5:G' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('H5:H' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('I5:I' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        return $styles;
    }
}