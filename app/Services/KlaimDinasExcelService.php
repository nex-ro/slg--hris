<?php

namespace App\Services;

use App\Models\KlaimDinas;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class KlaimDinasExcelService
{
    /**
     * Generate file Excel Klaim Dinas berdasarkan data KlaimDinas
     */
    public function generate(KlaimDinas $klaim): string
    {
        $templatePath = storage_path('app/templates/Template_Klaim_SDinas.xlsx');
        
        if (file_exists($templatePath)) {
            $spreadsheet = IOFactory::load($templatePath);
            $sheet = $spreadsheet->getActiveSheet();
        } else {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Klaim Dinas');
        }

        // Title & Header info
        $sheet->setCellValue('C2', 'Realisasi Klaim Dinas');
        $sheet->setCellValue('C3', $klaim->kegiatan ?: 'Kegiatan Perjalanan Dinas');

        // Periode Dinas
        $periodeText = 'Periode dinas: ';
        if ($klaim->periode_awal && $klaim->periode_akhir) {
            $periodeText .= Carbon::parse($klaim->periode_awal)->translatedFormat('d F Y') . ' - ' . Carbon::parse($klaim->periode_akhir)->translatedFormat('d F Y');
        } elseif ($klaim->periode_awal) {
            $periodeText .= Carbon::parse($klaim->periode_awal)->translatedFormat('d F Y');
        } else {
            $periodeText .= '-';
        }
        $sheet->setCellValue('C4', $periodeText);

        // Header Table at Row 5
        $sheet->setCellValue('B5', 'Tanggal');
        $sheet->setCellValue('C5', 'Rincian Biaya');
        $sheet->setCellValue('E5', 'Nominal');

        // Tulis Item Baris Rincian Biaya mulai baris 6
        $items = $klaim->items;
        $startRow = 6;
        $currentRow = $startRow;

        if ($items->count() > 0) {
            foreach ($items as $index => $item) {
                $currentRow = $startRow + $index;
                
                // Format tanggal item
                $tgl = $item->tanggal ? Carbon::parse($item->tanggal)->format('d/m/Y') : '-';
                $sheet->setCellValue('B' . $currentRow, $tgl);
                $sheet->setCellValue('C' . $currentRow, $item->rincian_biaya);
                
                // Merge C & D agar tampilan rapi sesuai template
                $sheet->mergeCells("C{$currentRow}:D{$currentRow}");
                
                $sheet->setCellValue('E' . $currentRow, (float)$item->nominal);
                $sheet->getStyle('E' . $currentRow)->getNumberFormat()->setFormatCode('#,##0');
            }
        } else {
            // Default row kosong jika belum ada item
            $sheet->setCellValue('B6', '-');
            $sheet->setCellValue('C6', 'Tidak ada rincian biaya');
            $sheet->mergeCells("C6:D6");
            $sheet->setCellValue('E6', 0);
            $currentRow = 6;
        }

        $endItemRow = $currentRow;

        // Baris Ringkasan Total
        $totalRow = $endItemRow + 1;
        $caRow = $totalRow + 1;
        $sisaRow = $caRow + 1;

        $sheet->setCellValue('B' . $totalRow, 'Total Realisasi Biaya');
        $sheet->mergeCells("B{$totalRow}:D{$totalRow}");
        $sheet->setCellValue('E' . $totalRow, "=SUM(E{$startRow}:E{$endItemRow})");
        $sheet->getStyle('E' . $totalRow)->getNumberFormat()->setFormatCode('#,##0');

        $sheet->setCellValue('B' . $caRow, 'Cash Advance');
        $sheet->mergeCells("B{$caRow}:D{$caRow}");
        $sheet->setCellValue('E' . $caRow, (float)$klaim->cash_advance);
        $sheet->getStyle('E' . $caRow)->getNumberFormat()->setFormatCode('#,##0');

        $sheet->setCellValue('B' . $sisaRow, 'Total Sisa Kurang');
        $sheet->mergeCells("B{$sisaRow}:D{$sisaRow}");
        $sheet->setCellValue('E' . $sisaRow, "=E{$totalRow}-E{$caRow}");
        $sheet->getStyle('E' . $sisaRow)->getNumberFormat()->setFormatCode('#,##0');

        // Tanggal & Tanda Tangan
        $dateRow = $sisaRow + 2;
        $labelRow = $dateRow + 1;
        $signSpace = $labelRow + 5;
        $titleRow = $signSpace + 1;
        $codeRow = $titleRow + 1;
        $transferStart = $codeRow + 2;

        // Tanggal pengajuan kota
        $tglPengajuanStr = Carbon::parse($klaim->tanggal_pengajuan ?: now())->translatedFormat('d F Y');
        $kotaTgl = ($klaim->kota_penandatangan ?: 'Jakarta') . ', ' . $tglPengajuanStr;
        $sheet->setCellValue('B' . $dateRow, $kotaTgl);

        // Header Tanda Tangan: Dibuat oleh (User) & Diperiksa oleh (HRD)
        $sheet->setCellValue('B' . $labelRow, 'Dibuat oleh,');
        $sheet->setCellValue('D' . $labelRow, 'Diperiksa oleh,');

        // Nama & Jabatan Pemohon
        $sheet->setCellValue('B' . $signSpace, $klaim->nama_lengkap);
        $sheet->setCellValue('B' . $titleRow, $klaim->jabatan ?: ($klaim->divisi ?: 'Pegawai'));

        // Nama & Jabatan HRD yang memeriksa
        // Jika sudah disetujui / diproses HRD, nama pemeriksa terisi, jika belum tertulis ( .................... )
        $pemeriksaNama = $klaim->diperiksa_oleh_nama ?: (in_array($klaim->status, ['Disetujui', 'Diproses']) ? 'Jupiter' : 'Jupiter ');
        $pemeriksaJabatan = $klaim->diperiksa_oleh_jabatan ?: 'Head Of HRD';
        $sheet->setCellValue('D' . $signSpace, $pemeriksaNama);
        $sheet->setCellValue('D' . $titleRow, $pemeriksaJabatan);

        // Center alignment untuk kolom tanda tangan pemohon (B) dan pemeriksa HRD (D atau D:E)
        $sheet->getStyle("B{$labelRow}:B{$titleRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$labelRow}:D{$titleRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Form Code
        $sheet->setCellValue('B' . $codeRow, 'FORMHR02/OFL/III/2022');
        $sheet->mergeCells("B{$codeRow}:E{$codeRow}");

        // Info Rekening Transfer
        $sheet->setCellValue('B' . $transferStart, 'Transfer ke :');
        $sheet->setCellValue('C' . $transferStart, 'No Rek : ' . ($klaim->no_rekening ?: '-'));
        $sheet->setCellValue('C' . ($transferStart + 1), 'Bank ' . ($klaim->nama_bank ?: '-'));
        $sheet->setCellValue('C' . ($transferStart + 2), 'An. ' . ($klaim->nama_rekening ?: $klaim->nama_lengkap));

        // Format borders & styling untuk tabel rincian
        $tableRange = "B5:E{$sisaRow}";
        $sheet->getStyle($tableRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle("B5:E5")->getFont()->setBold(true);
        $sheet->getStyle("B{$totalRow}:E{$sisaRow}")->getFont()->setBold(true);

        // Save ke temporary file
        $tempDir = storage_path('app/temp_excel');
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $safeNum = str_replace(['/', '\\'], '_', $klaim->nomor_klaim ?: 'Klaim_Dinas_' . $klaim->id);
        $filePath = $tempDir . '/' . $safeNum . '.xlsx';

        $writer = new Xlsx($spreadsheet);
        $writer->save($filePath);

        return $filePath;
    }
}
