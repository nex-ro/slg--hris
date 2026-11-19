<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pemberitahuan Status Claim Dinas</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f7fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: {{ $status === 'Disetujui' ? '#166534' : ($status === 'Ditolak' ? '#991b1b' : '#1e40af') }}; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">
                Pengajuan Claim Dinas {{ $status }}
            </h2>
            <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Nomor Klaim: {{ $nomorKlaim }}</p>
        </div>

        <div style="padding: 24px;">
            <p>Halo <strong>{{ $namaPegawai }}</strong>,</p>
            <p>
                Pengajuan formulir Realisasi Claim Dinas Anda telah diverifikasi oleh HRD dengan status akhir:
                <strong style="color: {{ $status === 'Disetujui' ? '#166534' : ($status === 'Ditolak' ? '#991b1b' : '#1e40af') }};">
                    {{ $status }}
                </strong>.
            </p>

            <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-top: 15px; border: 1px solid #e2e8f0; font-size: 13px;">
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="width: 35%; color: #475569;">Nomor Klaim</th>
                    <td><strong>{{ $nomorKlaim }}</strong></td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #475569;">Kegiatan</th>
                    <td>{{ $kegiatan }}</td>
                </tr>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #475569;">Total Realisasi Biaya</th>
                    <td><strong>{{ $totalRealisasi }}</strong></td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #475569;">Cash Advance (Panjar)</th>
                    <td>{{ $cashAdvance }}</td>
                </tr>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #475569;">Total Sisa Kurang</th>
                    <td><strong>{{ $sisaKurang }}</strong></td>
                </tr>
                @if(!empty($diperiksaOleh))
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #475569;">Diperiksa Oleh</th>
                    <td>{{ $diperiksaOleh }} (HRD)</td>
                </tr>
                @endif
                @if(!empty($catatanHrd))
                <tr style="background-color: #fef2f2; border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #991b1b;">Catatan HRD</th>
                    <td style="color: #991b1b;"><strong>{{ $catatanHrd }}</strong></td>
                </tr>
                @endif
            </table>

            @if($status === 'Disetujui')
                <div style="margin-top: 20px; padding: 12px; background-color: #f0fdf4; border-left: 4px solid #16a34a; font-size: 13px; color: #166534;">
                    Pengajuan klaim dinas Anda telah disetujui untuk diproses pembayarannya/penggantian biayanya. Dokumen tanda terima dan formulir resmi telah diverifikasi oleh tim HRD.
                </div>
            @elseif($status === 'Ditolak')
                <div style="margin-top: 20px; padding: 12px; background-color: #fef2f2; border-left: 4px solid #dc2626; font-size: 13px; color: #991b1b;">
                    Pengajuan klaim dinas Anda ditolak. Silakan periksa catatan dari HRD di atas atau hubungi tim HRD terkait kelengkapan berkas/nota.
                </div>
            @endif

            <p style="margin-top: 25px; font-size: 12px; color: #64748b;">
                Email ini dikirimkan secara otomatis oleh sistem <strong>MY-SLG</strong>. Harap tidak membalas langsung ke email ini.
            </p>
        </div>
    </div>
</body>
</html>
