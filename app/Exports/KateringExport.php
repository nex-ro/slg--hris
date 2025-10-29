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
    protected $tidakMakan;

    public function __construct($kehadiran, $tower, $tanggal, $tidakMakan = [])
    {
        $this->kehadiran = $kehadiran;
        $this->tower = $tower;
        $this->tanggal = $tanggal;
        $this->tidakMakan = is_array($tidakMakan) ? array_map('intval', $tidakMakan) : [];
        
        // Debug log untuk melihat struktur data
        \Log::info('TidakMakan IDs:', $this->tidakMakan);
        if (!empty($kehadiran)) {
            \Log::info('Sample Kehadiran Structure:', [
                'first_item' => $kehadiran[0] ?? 'empty'
            ]);
        }
    }

    public function collection()
    {
        $data = [];
        
        // Filter kehadiran: hadir DAN tidak ada di daftar tidakMakan
        $hadirCollection = collect($this->kehadiran)->filter(function($user) {
            $status = strtolower(trim($user['status'] ?? ''));
            $isHadir = in_array($status, [
                'ontime', 
                'on time', 
                'hadir', 
                'terlambat',
                'late',
                'telat',
                'FP-TR',
                'fp-tr',
                'c2',
                'p2',
            ]);
            
            // User ID ada di $user['user']['id'] berdasarkan struktur log
            $userId = isset($user['user']['id']) ? intval($user['user']['id']) : null;
            
            if ($userId === null) {
                return $isHadir; // Jika tidak ada user ID, tetap masukkan jika hadir
            }
            
            // Hanya masukkan jika hadir DAN tidak ada di daftar tidakMakan
            $tidakMakanList = $this->tidakMakan;
            $notInTidakMakan = !in_array($userId, $tidakMakanList, true);
            
            // Debug log
            if ($isHadir && !$notInTidakMakan) {
                \Log::info('Excluded from Hadir (TidakMakan):', [
                    'user_id' => $userId,
                    'name' => $user['user']['name'] ?? 'unknown'
                ]);
            }
            
            return $isHadir && $notInTidakMakan;
        });
        
        \Log::info('Hadir Collection Count:', ['count' => $hadirCollection->count()]);

        // Group semua data by tower
        $allGrouped = collect($this->kehadiran)->groupBy('tower')->sortKeys();
        $hadirGrouped = $hadirCollection->groupBy('tower')->sortKeys();

        // Ambil data untuk Eifel dan Liberty
        $eifelHadir = $hadirGrouped->get('Eiffel', collect());
        $libertyHadir = $hadirGrouped->get('Liberty', collect());
        
        $eifelAll = $allGrouped->get('Eiffel', collect());
        $libertyAll = $allGrouped->get('Liberty', collect());

        // Fungsi untuk mendapatkan data berdasarkan status
        $getByStatus = function($collection, $statuses) {
            return $collection->filter(function($user) use ($statuses) {
                $status = strtolower(trim($user['status'] ?? ''));
                $statusesLower = array_map('strtolower', $statuses);
                return in_array($status, $statusesLower);
            });
        };

        // Fungsi untuk mendapatkan data tidak makan berdasarkan tower
        $getTidakMakan = function($collection) {
            $result = $collection->filter(function($user) {
                // User ID ada di $user['user']['id']
                $userId = isset($user['user']['id']) ? intval($user['user']['id']) : null;
                
                if ($userId === null) {
                    return false;
                }
                
                $tidakMakanList = $this->tidakMakan;
                $isInList = in_array($userId, $tidakMakanList, true);
                
                // Debug log untuk setiap user yang cocok
                if ($isInList) {
                    \Log::info('Found TidakMakan User:', [
                        'user_id' => $userId,
                        'name' => $user['user']['name'] ?? 'unknown',
                        'tower' => $user['tower'] ?? 'unknown'
                    ]);
                }
                
                return $isInList;
            });
            
            \Log::info('TidakMakan Filter Result Count:', ['count' => $result->count()]);
            return $result;
        };

        // Data Eifel
        $eifelSakit = $getByStatus($eifelAll, ['sakit']);
        $eifelCuti = $getByStatus($eifelAll, ['c1','c3', 'cuti']);
        $eifelWFH = $getByStatus($eifelAll, ['wfh']);
        $eifelDinasLuar = $getByStatus($eifelAll, ['dinas_luar', 'dinas luar','dl']);
        $eifelKeluar = $getByStatus($eifelAll, ['p1', 'p3', 'keluar_kantor', 'keluar kantor']);
        $eifelTidakMakan = $getTidakMakan($eifelAll);

        // Data Liberty
        $libertySakit = $getByStatus($libertyAll, ['sakit']);
        $libertyCuti = $getByStatus($libertyAll, ['c1', 'c3', 'cuti']);
        $libertyWFH = $getByStatus($libertyAll, ['wfh']);
        $libertyDinasLuar = $getByStatus($libertyAll, ['dinas_luar', 'dinas luar','dl']);
        $libertyKeluar = $getByStatus($libertyAll, ['p1', 'p3', 'keluar_kantor', 'keluar kantor']);
        $libertyTidakMakan = $getTidakMakan($libertyAll);

        // Total keseluruhan
        $eifelTotal = $eifelAll->count();
        $libertyTotal = $libertyAll->count();

        // Total hadir (yang makan katering)
        $eifelHadirTotal = $eifelHadir->count();
        $libertyHadirTotal = $libertyHadir->count();

        // Buat array data untuk Eifel (hadir) - minimal 45 baris
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
        
        // Tambahkan baris kosong hingga minimal 45
        while (count($eifelData) < 45) {
            $eifelData[] = [count($eifelData) + 1, ''];
        }

        // Buat array data untuk Liberty (hadir) - minimal 45 baris
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
        
        // Tambahkan baris kosong hingga minimal 45
        while (count($libertyData) < 45) {
            $libertyData[] = [count($libertyData) + 1, ''];
        }

        // Buat keterangan untuk Eifel
        $eifelKeterangan = [];
        $eifelKeterangan[] = ['Keterangan :', '', ''];
        $eifelKeterangan[] = ['tower Eifel', '', ''];
        $eifelKeterangan[] = ['', '', ''];
        $eifelKeterangan[] = ['TOTAL ', $eifelTotal, 'Orang'];
        
        // Sakit
        $sakitCount = $eifelSakit->count();
        $sakitArray = $eifelSakit->values()->all();
        if ($sakitCount > 0) {
            $nama = $sakitArray[0]['user']['name'] ?? $sakitArray[0]['nama'] ?? $sakitArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Sakit', $sakitCount, $nama];
            for ($i = 1; $i < $sakitCount; $i++) {
                $nama = $sakitArray[$i]['user']['name'] ?? $sakitArray[$i]['nama'] ?? $sakitArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Sakit', "0", ''];
        }
        
        // Cuti
        $cutiCount = $eifelCuti->count();
        $cutiArray = $eifelCuti->values()->all();
        if ($cutiCount > 0) {
            $nama = $cutiArray[0]['user']['name'] ?? $cutiArray[0]['nama'] ?? $cutiArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Cuti', $cutiCount, $nama];
            for ($i = 1; $i < $cutiCount; $i++) {
                $nama = $cutiArray[$i]['user']['name'] ?? $cutiArray[$i]['nama'] ?? $cutiArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Cuti', "0", ''];
        }
        
        // WFH
        $wfhCount = $eifelWFH->count();
        $wfhArray = $eifelWFH->values()->all();
        if ($wfhCount > 0) {
            $nama = $wfhArray[0]['user']['name'] ?? $wfhArray[0]['nama'] ?? $wfhArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['WFH', $wfhCount, $nama];
            for ($i = 1; $i < $wfhCount; $i++) {
                $nama = $wfhArray[$i]['user']['name'] ?? $wfhArray[$i]['nama'] ?? $wfhArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['WFH', "0", ''];
        }
        
        // Dinas Luar
        $dinasCount = $eifelDinasLuar->count();
        $dinasArray = $eifelDinasLuar->values()->all();
        if ($dinasCount > 0) {
            $nama = $dinasArray[0]['user']['name'] ?? $dinasArray[0]['nama'] ?? $dinasArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Dinas Luar', $dinasCount, $nama];
            for ($i = 1; $i < $dinasCount; $i++) {
                $nama = $dinasArray[$i]['user']['name'] ?? $dinasArray[$i]['nama'] ?? $dinasArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Dinas Luar', '0', ''];
        }
        
        // Keluar kantor
        $keluarCount = $eifelKeluar->count();
        $keluarArray = $eifelKeluar->values()->all();
        if ($keluarCount > 0) {
            $nama = $keluarArray[0]['user']['name'] ?? $keluarArray[0]['nama'] ?? $keluarArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Keluar kantor', $keluarCount, $nama];
            for ($i = 1; $i < $keluarCount; $i++) {
                $nama = $keluarArray[$i]['user']['name'] ?? $keluarArray[$i]['nama'] ?? $keluarArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Keluar kantor', "0", ''];
        }

        // Tidak Makan
        $tidakMakanCount = $eifelTidakMakan->count();
        $tidakMakanArray = $eifelTidakMakan->values()->all();
        if ($tidakMakanCount > 0) {
            $nama = $tidakMakanArray[0]['user']['name'] ?? $tidakMakanArray[0]['nama'] ?? $tidakMakanArray[0]['name'] ?? '';
            $eifelKeterangan[] = ['Tidak Makan', $tidakMakanCount, $nama];
            for ($i = 1; $i < $tidakMakanCount; $i++) {
                $nama = $tidakMakanArray[$i]['user']['name'] ?? $tidakMakanArray[$i]['nama'] ?? $tidakMakanArray[$i]['name'] ?? '';
                $eifelKeterangan[] = ['', '', $nama];
            }
        } else {
            $eifelKeterangan[] = ['Tidak Makan', "0", ''];
        }

        $eifelHadirTotals = $eifelAll->count() - ($sakitCount + $cutiCount + $wfhCount + $dinasCount + $keluarCount + $tidakMakanCount);
        $eifelKeterangan[] = ['', '', ''];
        if($eifelHadirTotals > 0){
            $eifelKeterangan[] = ['Total', $eifelHadirTotals, ''];
        } else {
            $eifelKeterangan[] = ['Total', '0', ''];
        }

        // Buat keterangan untuk Liberty
        $libertyKeterangan = [];
        $libertyKeterangan[] = ['Keterangan :', '', ''];
        $libertyKeterangan[] = ['tower liberty', '', ''];
        $libertyKeterangan[] = ['', '', ''];
        $libertyKeterangan[] = ['TOTAL ' , $libertyTotal, 'Orang'];
        
        // Sakit
        $sakitCountL = $libertySakit->count();
        $sakitArrayL = $libertySakit->values()->all();
        if ($sakitCountL > 0) {
            $nama = $sakitArrayL[0]['user']['name'] ?? $sakitArrayL[0]['nama'] ?? $sakitArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Sakit', $sakitCountL, $nama];
            for ($i = 1; $i < $sakitCountL; $i++) {
                $nama = $sakitArrayL[$i]['user']['name'] ?? $sakitArrayL[$i]['nama'] ?? $sakitArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Sakit', "0", ''];
        }
        
        // Cuti
        $cutiCountL = $libertyCuti->count();
        $cutiArrayL = $libertyCuti->values()->all();
        if ($cutiCountL > 0) {
            $nama = $cutiArrayL[0]['user']['name'] ?? $cutiArrayL[0]['nama'] ?? $cutiArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Cuti', $cutiCountL, $nama];
            for ($i = 1; $i < $cutiCountL; $i++) {
                $nama = $cutiArrayL[$i]['user']['name'] ?? $cutiArrayL[$i]['nama'] ?? $cutiArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Cuti', "0", ''];
        }
        
        // WFH
        $wfhCountL = $libertyWFH->count();
        $wfhArrayL = $libertyWFH->values()->all();
        if ($wfhCountL > 0) {
            $nama = $wfhArrayL[0]['user']['name'] ?? $wfhArrayL[0]['nama'] ?? $wfhArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['WFH', $wfhCountL, $nama];
            for ($i = 1; $i < $wfhCountL; $i++) {
                $nama = $wfhArrayL[$i]['user']['name'] ?? $wfhArrayL[$i]['nama'] ?? $wfhArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['WFH', "0", ''];
        }
        
        // Dinas Luar
        $dinasCountL = $libertyDinasLuar->count();
        $dinasArrayL = $libertyDinasLuar->values()->all();
        if ($dinasCountL > 0) {
            $nama = $dinasArrayL[0]['user']['name'] ?? $dinasArrayL[0]['nama'] ?? $dinasArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Dinas Luar', $dinasCountL, $nama];
            for ($i = 1; $i < $dinasCountL; $i++) {
                $nama = $dinasArrayL[$i]['user']['name'] ?? $dinasArrayL[$i]['nama'] ?? $dinasArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Dinas Luar', "0", ''];
        }
        
        // Keluar kantor
        $keluarCountL = $libertyKeluar->count();
        $keluarArrayL = $libertyKeluar->values()->all();
        if ($keluarCountL > 0) {
            $nama = $keluarArrayL[0]['user']['name'] ?? $keluarArrayL[0]['nama'] ?? $keluarArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Keluar kantor', $keluarCountL, $nama];
            for ($i = 1; $i < $keluarCountL; $i++) {
                $nama = $keluarArrayL[$i]['user']['name'] ?? $keluarArrayL[$i]['nama'] ?? $keluarArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Keluar kantor', "0", ''];
        }

        // Tidak Makan
        $tidakMakanCountL = $libertyTidakMakan->count();
        $tidakMakanArrayL = $libertyTidakMakan->values()->all();
        if ($tidakMakanCountL > 0) {
            $nama = $tidakMakanArrayL[0]['user']['name'] ?? $tidakMakanArrayL[0]['nama'] ?? $tidakMakanArrayL[0]['name'] ?? '';
            $libertyKeterangan[] = ['Tidak Makan', $tidakMakanCountL, $nama];
            for ($i = 1; $i < $tidakMakanCountL; $i++) {
                $nama = $tidakMakanArrayL[$i]['user']['name'] ?? $tidakMakanArrayL[$i]['nama'] ?? $tidakMakanArrayL[$i]['name'] ?? '';
                $libertyKeterangan[] = ['', '', $nama];
            }
        } else {
            $libertyKeterangan[] = ['Tidak Makan', "0", ''];
        }

        $libertyHadirTotals = $libertyAll->count() - ($sakitCountL + $cutiCountL + $wfhCountL + $dinasCountL + $keluarCountL + $tidakMakanCountL);
        $libertyKeterangan[] = ['', '', ''];
        if($libertyHadirTotals > 0){
            $libertyKeterangan[] = ['Total', $libertyHadirTotals, ''];
        } else {
            $libertyKeterangan[] = ['Total', '0', ''];
        }

        // Hitung total untuk akumulasi (yang makan katering)
        $totalLantai19 = $eifelHadirTotal;
        $totalLantai1 = $libertyHadirTotal;
        $totalMarein = 0;
        $totalAkumulasi = $totalLantai19 + $totalLantai1 + $totalMarein;

        // Tambahkan tabel akumulasi
        $akumulasiTable = [];
        $akumulasiTable[] = ['', '', ''];
        $akumulasiTable[] = ['', '', ''];
        $akumulasiTable[] = ['Akumulasi', '', ''];
        $akumulasiTable[] = ['Lantai 19', '', $totalLantai19];
        $akumulasiTable[] = ['Lantai 1', '', $totalLantai1];
        $akumulasiTable[] = ['Marein', '', $totalMarein];
        $akumulasiTable[] = ['Total', '', $totalAkumulasi];

        // Gabungkan semua keterangan
        $allKeterangan = array_merge($eifelKeterangan, [['', '', '']], $libertyKeterangan, $akumulasiTable);

        // Tentukan jumlah baris maksimal (minimal 45 atau sesuai keterangan)
        $maxDataRows = max(45, count($eifelData), count($libertyData));
        $keteranganRows = count($allKeterangan);

        // Pastikan tinggi tabel sama dengan keterangan
        $totalRows = max($maxDataRows, $keteranganRows);

        // Gabungkan data hadir Eifel dan Liberty dengan keterangan di kolom kanan
        for ($i = 0; $i < $totalRows; $i++) {
            $row = [
                $eifelData[$i][0] ?? '',
                $eifelData[$i][1] ?? '',
                $libertyData[$i][0] ?? '',
                $libertyData[$i][1] ?? '',
                '', // Kolom pemisah
                $allKeterangan[$i][0] ?? '',
                $allKeterangan[$i][1] ?? '',
                $allKeterangan[$i][2] ?? '',
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
            ['', '', '', '', '', '', '', ''],
            ['Eifel', '', 'Liberty', '', '', '', '', ''],
            ['No', 'Nama', 'No', 'Nama', '', '', '', '']
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
                
                // Dapatkan jumlah baris terakhir
                $highestRow = $sheet->getHighestRow();
                // Pengaturan Page Setup untuk Print
                $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_PORTRAIT);
                $sheet->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
                $sheet->getPageSetup()->setFitToPage(true);
                $sheet->getPageSetup()->setFitToWidth(1);
                $sheet->getPageSetup()->setFitToHeight(1);
                
                // Set Print Area agar semua data terprint
                $sheet->getPageSetup()->setPrintArea('A1:H' . $highestRow);
                
                // Pengaturan Margin (dalam inches) - diperkecil agar lebih banyak konten
                $sheet->getPageMargins()->setTop(0.5);
                $sheet->getPageMargins()->setRight(0.5);
                $sheet->getPageMargins()->setLeft(0.5);
                $sheet->getPageMargins()->setBottom(0.5);
                
                // Set scale agar semua konten fit dalam 1 halaman
                $sheet->getPageSetup()->setScale(85); // 85% dari ukuran normal, bisa disesuaikan
                
                // Merge cells for title
                $sheet->mergeCells('A1:D1');
                
                // Merge cells untuk header Tower
                $sheet->mergeCells('A3:B3');
                $sheet->mergeCells('C3:D3');
                
                // Cari dan merge baris tower (line 6 dan seterusnya untuk tower liberty)
                for ($row = 5; $row <= $highestRow; $row++) {
                    $cellValueF = $sheet->getCell('F' . $row)->getValue();
                    if (strpos($cellValueF, 'tower') === 0) {
                        $sheet->mergeCells('F' . $row . ':H' . $row);
                    }
                }
                
                // Apply borders to all data columns (A-D) - semua baris termasuk yang kosong
                $sheet->getStyle('A4:D' . $highestRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000']
                        ],
                    ],
                ]);

                // Apply borders hanya untuk sel yang berisi data di kolom F-H
                for ($row = 5; $row <= $highestRow; $row++) {
                    $cellValueF = trim($sheet->getCell('F' . $row)->getValue());
                    $cellValueG = trim($sheet->getCell('G' . $row)->getValue());
                    $cellValueH = trim($sheet->getCell('H' . $row)->getValue());
                    
                    // Cek apakah ada isi di salah satu sel F, G, atau H
                    if ($cellValueF !== '' || $cellValueG !== '' || $cellValueH !== '') {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => Border::BORDER_THIN,
                                    'color' => ['rgb' => '000000']
                                ],
                            ],
                        ]);
                    } else {
                        // Hapus border untuk baris kosong
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => Border::BORDER_NONE
                                ],
                            ],
                        ]);
                    }
                }

                // Center align untuk kolom nomor dan jumlah
                $sheet->getStyle('A:A')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('C:C')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('G:G')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                
                // Left align untuk kolom nama
                $sheet->getStyle('B:B')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('D:D')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('H:H')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // Highlight specific rows dan tambahkan border pada baris di atas dan di bawah
                $towerRows = [];
                $totalRows = [];
                
                // Cari semua baris tower dan Total
                for ($row = 5; $row <= $highestRow; $row++) {
                    $cellValueF = $sheet->getCell('F' . $row)->getValue();
                    
                    if (strpos($cellValueF, 'tower') === 0) {
                        $towerRows[] = $row;
                    }
                    if ($cellValueF === 'Total') {
                        $totalRows[] = $row;
                    }
                }
                
                // Apply styling
                for ($row = 5; $row <= $highestRow; $row++) {
                    $cellValueF = $sheet->getCell('F' . $row)->getValue();
                    
                    // Highlight untuk "Keterangan :"
                    if ($cellValueF === 'Keterangan :') {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true]
                        ]);
                    }
                    
                    // Highlight untuk baris "tower ..."
                    if (strpos($cellValueF, 'tower') === 0) {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true],
                            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
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

                    // Highlight untuk "Akumulasi"
                    if ($cellValueF === 'Akumulasi') {
                        $sheet->getStyle('F' . $row . ':H' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FFFF00']
                            ],
                            'font' => ['bold' => true]
                        ]);
                    }
                }
                
                // Tambahkan border pada baris setelah tower (baris dibawah tower)
                foreach ($towerRows as $towerRow) {
                    $borderRow = $towerRow + 1;
                    if ($borderRow <= $highestRow) {
                        $sheet->getStyle('F' . $borderRow . ':H' . $borderRow)->applyFromArray([
                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => Border::BORDER_THIN,
                                    'color' => ['rgb' => '000000']
                                ],
                            ],
                        ]);
                    }
                }
                foreach ($totalRows as $totalRow) {
                    $borderRow = $totalRow - 1; // Baris di atas Total
                    if ($borderRow >= 5) { // Pastikan tidak kurang dari baris 5
                        $sheet->getStyle('F' . $borderRow . ':H' . $borderRow)->applyFromArray([
                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => Border::BORDER_THIN,
                                    'color' => ['rgb' => '000000']
                                ],
                            ],
                        ]);
                    }
                }

            },
        ];
    }
}