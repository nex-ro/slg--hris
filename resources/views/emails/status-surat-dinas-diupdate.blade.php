<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pemberitahuan Status Surat Perjalanan Dinas</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f7fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: {{ $status === 'Disetujui' ? '#166534' : ($status === 'Ditolak' ? '#991b1b' : '#1e40af') }}; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">
                Pengajuan Surat Perjalanan Dinas {{ $status }}
            </h2>
            <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Nomor Surat: {{ $nomorSurat }}</p>
        </div>

        <div style="padding: 24px;">
            <p>Halo <strong>{{ $namaPegawai }}</strong>,</p>
            <p>
                Pengajuan Surat Perjalanan Dinas (SPD) Anda telah ditinjau oleh HRD dengan status akhir:
                <strong style="color: {{ $status === 'Disetujui' ? '#166534' : ($status === 'Ditolak' ? '#991b1b' : '#1e40af') }};">
                    {{ $status }}
                </strong>.
            </p>

            <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-top: 15px; border: 1px solid #e2e8f0; font-size: 13px;">
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="width: 35%; color: #475569;">Nomor SPD</th>
                    <td><strong>{{ $nomorSurat }}</strong></td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #475569;">Tujuan</th>
                    <td>{{ $tujuan }}</td>
                </tr>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #475569;">Keperluan</th>
                    <td>{{ $keperluan }}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #475569;">Periode Dinas</th>
                    <td>{{ $tanggalBerangkat }} s/d {{ $tanggalKembali }}</td>
                </tr>
                @if(!empty($catatan))
                <tr style="background-color: #fef2f2; border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="color: #991b1b;">Catatan HRD</th>
                    <td style="color: #991b1b;"><strong>{{ $catatan }}</strong></td>
                </tr>
                @endif
            </table>

            @if($status === 'Disetujui')
                <div style="margin-top: 20px; padding: 12px; background-color: #f0fdf4; border-left: 4px solid #16a34a; font-size: 13px; color: #166534;">
                    Pengajuan perjalanan dinas Anda telah disetujui. Anda dapat mengunduh berkas Surat Perjalanan Dinas (SPD) resmi melalui sistem MY-SLG.
                </div>
            @elseif($status === 'Ditolak')
                <div style="margin-top: 20px; padding: 12px; background-color: #fef2f2; border-left: 4px solid #dc2626; font-size: 13px; color: #991b1b;">
                    Pengajuan dinas Anda ditolak. Silakan cek catatan di atas atau hubungi HRD untuk informasi lebih lanjut.
                </div>
            @endif

            <p style="margin-top: 25px; font-size: 12px; color: #64748b;">
                Email ini dikirimkan secara otomatis oleh sistem <strong>MY-SLG</strong>. Harap tidak membalas langsung ke email ini.
            </p>
        </div>
    </div>
</body>
</html>
