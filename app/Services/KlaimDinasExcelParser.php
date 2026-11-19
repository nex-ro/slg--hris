<?php

namespace App\Services;

use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class KlaimDinasExcelParser
{
    /**
     * Parse file Excel Template Klaim Dinas dan mengembalikan array data terstruktur
     * 
     * @param string $filePath
     * @return array
     */
    public function parse(string $filePath): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();

        // 1. Ekstrak Judul Kegiatan dari C3 (atau C2 jika ada)
        $kegiatanRaw = (string)$sheet->getCell('C3')->getValue();
        $kegiatan = trim($kegiatanRaw);
        if (empty($kegiatan) || strtolower($kegiatan) === 'kegiatan') {
            // Cek C2 atau baris lain jika ada
            $kegiatan = trim((string)$sheet->getCell('C2')->getValue()) ?: 'Realisasi Perjalanan Dinas';
            if (strtolower($kegiatan) === 'realisasi klaim dinas') {
                $kegiatan = 'Realisasi Perjalanan Dinas';
            }
        }

        // 2. Ekstrak Periode Dinas dari C4
        // Format contoh: "Periode dinas: 11 Oktober 2023 - 12 Oktober 2023" atau tanggal langsung
        $periodeRaw = (string)$sheet->getCell('C4')->getValue();
        $periodeAwal = null;
        $periodeAkhir = null;

        if (!empty($periodeRaw)) {
            $cleaned = preg_replace('/^periode\s*dinas\s*:\s*/i', '', trim($periodeRaw));
            if (str_contains($cleaned, '-')) {
                $parts = explode('-', $cleaned, 2);
                $p1 = trim($parts[0]);
                $p2 = trim($parts[1]);
                $periodeAwal = $this->tryParseDate($p1);
                $periodeAkhir = $this->tryParseDate($p2);
            } else {
                $periodeAwal = $this->tryParseDate($cleaned);
            }
        }

        // 3. Ekstrak Rincian Biaya (Mulai baris 6 sampai sebelum 'Total Realisasi Biaya')
        $items = [];
        $highestRow = $sheet->getHighestRow();
        $totalRowIndex = null;

        for ($r = 6; $r <= $highestRow; $r++) {
            $colB = trim((string)$sheet->getCell('B' . $r)->getValue());
            $colA = trim((string)$sheet->getCell('A' . $r)->getValue());
            $colC = trim((string)$sheet->getCell('C' . $r)->getValue());
            $colE = $sheet->getCell('E' . $r)->getValue();

            // Cek apakah sudah masuk ke baris ringkasan 'Total Realisasi Biaya'
            if (
                stripos($colB, 'total realisasi') !== false || 
                stripos($colA, 'total realisasi') !== false ||
                stripos($colC, 'total realisasi') !== false
            ) {
                $totalRowIndex = $r;
                break;
            }

            // Jika rincian biaya (C) atau nominal (E) ada isi
            if (!empty($colC) || ($colE !== null && $colE !== '')) {
                // Parse tanggal dari B atau A
                $tglVal = $sheet->getCell('B' . $r)->getValue();
                if ($tglVal === null || $tglVal === '') {
                    $tglVal = $sheet->getCell('A' . $r)->getValue();
                }
                $itemDate = $this->parseExcelOrStringDate($tglVal);

                // Nominal
                $nominal = is_numeric($colE) ? (float)$colE : 0;

                $items[] = [
                    'tanggal' => $itemDate,
                    'rincian_biaya' => $colC ?: 'Rincian Pengeluaran',
                    'nominal' => $nominal,
                    'keterangan' => '',
                ];
            }
        }

        // 4. Ekstrak Cash Advance (Panjar)
        $cashAdvance = 0;
        for ($r = ($totalRowIndex ?: 6); $r <= min($highestRow, ($totalRowIndex ? $totalRowIndex + 10 : 35)); $r++) {
            $colA = trim((string)$sheet->getCell('A' . $r)->getValue());
            $colB = trim((string)$sheet->getCell('B' . $r)->getValue());
            if (stripos($colA, 'cash advance') !== false || stripos($colB, 'cash advance') !== false) {
                $val = $sheet->getCell('E' . $r)->getValue();
                if (is_numeric($val)) {
                    $cashAdvance = (float)$val;
                }
                break;
            }
        }

        // 5. Ekstrak Tanggal Pengajuan & Kota
        // Contoh di B15: "Jakarta, 16 Oktober 2023"
        $kota = 'Jakarta';
        $tanggalPengajuan = now()->toDateString();
        for ($r = 14; $r <= min($highestRow, 35); $r++) {
            $valB = (string)$sheet->getCell('B' . $r)->getValue();
            $valA = (string)$sheet->getCell('A' . $r)->getValue();
            $val = !empty($valB) ? $valB : $valA;

            if (!empty($val) && str_contains($val, ',')) {
                $parts = explode(',', $val, 2);
                $possibleCity = trim($parts[0]);
                $possibleDate = trim($parts[1]);
                $parsed = $this->tryParseDate($possibleDate);
                if ($parsed) {
                    $kota = $possibleCity;
                    $tanggalPengajuan = $parsed;
                    break;
                }
            }
        }

        // 6. Ekstrak Nama Pemohon & Jabatan ("Dibuat oleh," -> baris bawahnya B21, B22)
        $namaLengkap = '';
        $jabatan = '';
        $dibuatOlehRow = null;

        for ($r = 15; $r <= min($highestRow, 35); $r++) {
            $valB = trim((string)$sheet->getCell('B' . $r)->getValue());
            if (stripos($valB, 'dibuat oleh') !== false) {
                $dibuatOlehRow = $r;
                break;
            }
        }

        if ($dibuatOlehRow) {
            // Di template asli: B16 adalah 'Dibuat oleh,', B21 adalah Nama, B22 adalah Jabatan
            $namaLengkap = trim((string)$sheet->getCell('B' . ($dibuatOlehRow + 5))->getValue());
            $jabatan = trim((string)$sheet->getCell('B' . ($dibuatOlehRow + 6))->getValue());
            
            // Jaga-jaga jika pembuat mengisi di baris lebih dekat
            if (empty($namaLengkap)) {
                for ($check = $dibuatOlehRow + 1; $check <= $dibuatOlehRow + 6; $check++) {
                    $v = trim((string)$sheet->getCell('B' . $check)->getValue());
                    if (!empty($v) && stripos($v, 'FORMHR') === false) {
                        $namaLengkap = $v;
                        $jabatan = trim((string)$sheet->getCell('B' . ($check + 1))->getValue());
                        break;
                    }
                }
            }
        }

        // 7. Ekstrak Rekening Transfer
        // Baris: Transfer ke : (B25), C25: No Rek : 5380.139.776, C26: Bank BCA, C27: An. Melissa
        $noRekening = '';
        $namaBank = '';
        $namaRekening = '';

        for ($r = 20; $r <= min($highestRow, 40); $r++) {
            $valC = trim((string)$sheet->getCell('C' . $r)->getValue());
            $valB = trim((string)$sheet->getCell('B' . $r)->getValue());

            if (stripos($valC, 'no rek') !== false || stripos($valB, 'no rek') !== false) {
                $targetStr = !empty($valC) ? $valC : $valB;
                $noRekening = trim(preg_replace('/^no\s*rek\s*:\s*/i', '', $targetStr));
                
                // Bank biasanya di baris berikutnya
                $next1 = trim((string)$sheet->getCell('C' . ($r + 1))->getValue());
                $namaBank = trim(preg_replace('/^bank\s*/i', '', $next1));

                // An. biasanya di baris berikutnya lagi
                $next2 = trim((string)$sheet->getCell('C' . ($r + 2))->getValue());
                $namaRekening = trim(preg_replace('/^an\.?\s*/i', '', $next2));
                break;
            }
        }

        return [
            'kegiatan' => $kegiatan ?: 'Realisasi Perjalanan Dinas',
            'periode_awal' => $periodeAwal,
            'periode_akhir' => $periodeAkhir,
            'items' => $items,
            'cash_advance' => $cashAdvance,
            'kota_penandatangan' => $kota ?: 'Jakarta',
            'tanggal_pengajuan' => $tanggalPengajuan ?: now()->toDateString(),
            'nama_lengkap' => $namaLengkap,
            'jabatan' => $jabatan,
            'no_rekening' => $noRekening,
            'nama_bank' => $namaBank,
            'nama_rekening' => $namaRekening,
        ];
    }

    /**
     * Konversi nilai sel (Excel numeric serial date atau string biasa) menjadi 'Y-m-d'
     */
    private function parseExcelOrStringDate($value): ?string
    {
        if ($value === null || $value === '' || $value === '-') {
            return null;
        }

        if (is_numeric($value)) {
            try {
                $dateTime = ExcelDate::excelToDateTimeObject((float)$value);
                return $dateTime->format('Y-m-d');
            } catch (\Throwable $e) {
                // fall through
            }
        }

        return $this->tryParseDate((string)$value);
    }

    /**
     * Coba parse string tanggal dengan format Indonesia atau internasional
     */
    private function tryParseDate(string $str): ?string
    {
        $str = trim($str);
        if (empty($str) || $str === '-') {
            return null;
        }

        // Kamus bulan bahasa Indonesia
        $months = [
            'januari' => '01', 'jan' => '01',
            'februari' => '02', 'feb' => '02',
            'maret' => '03', 'mar' => '03',
            'april' => '04', 'apr' => '04',
            'mei' => '05', 'may' => '05',
            'juni' => '06', 'jun' => '06',
            'juli' => '07', 'jul' => '07',
            'agustus' => '08', 'agt' => '08', 'aug' => '08',
            'september' => '09', 'sep' => '09',
            'oktober' => '10', 'okt' => '10', 'oct' => '10',
            'november' => '11', 'nov' => '11',
            'desember' => '12', 'des' => '12', 'dec' => '12',
        ];

        // Format: "11 Oktober 2023" atau "11 Okt 2023"
        if (preg_match('/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/', $str, $m)) {
            $day = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $monthName = strtolower($m[2]);
            $year = $m[3];

            if (isset($months[$monthName])) {
                return "{$year}-{$months[$monthName]}-{$day}";
            }
        }

        // Format standar: d/m/Y atau d-m-Y atau Y-m-d
        try {
            return Carbon::parse($str)->toDateString();
        } catch (\Throwable $e) {
            return null;
        }
    }
}
