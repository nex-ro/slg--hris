<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pemberitahuan Status Izin Sakit</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: {{ $status === 'Disetujui' ? '#2e7d32' : '#c62828' }};">
        Pengajuan Izin Sakit Anda Telah {{ $status }}
    </h2>
    <p>Halo <strong>{{ $namaPegawai }}</strong>,</p>
    <p>
        Pihak HRD / Manajemen telah meninjau pengajuan izin sakit yang Anda ajukan sebelumnya. 
        Berikut rincian status pengajuan Anda:
    </p>

    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px; border: 1px solid #e2e8f0;">
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left" style="width: 35%;">Status</th>
            <td>
                <strong style="color: {{ $status === 'Disetujui' ? '#2e7d32' : '#c62828' }};">
                    {{ $status }}
                </strong>
            </td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Tanggal Mulai</th>
            <td>{{ $tanggalMulai }}</td>
        </tr>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Tanggal Selesai</th>
            <td>{{ $tanggalSelesai }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Keterangan</th>
            <td>{{ $keterangan }}</td>
        </tr>
    </table>

    @if($status === 'Disetujui')
        <p style="margin-top: 15px; color: #2e7d32;">
            Pengajuan sakit Anda telah dicatat ke dalam rekap kehadiran kerja. Semoga lekas sembuh!
        </p>
    @else
        <p style="margin-top: 15px; color: #c62828;">
            Mohon maaf, pengajuan izin sakit Anda ditolak. Silakan hubungi bagian HRD untuk informasi lebih lanjut.
        </p>
    @endif

    <p style="margin-top: 20px;">
        Anda dapat melihat riwayat pengajuan ini di aplikasi <strong>My-SLG</strong> pada menu <strong>Sakit</strong>.
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;">
    <p style="font-size: 12px; color: #a0aec0;">Email ini dikirim otomatis oleh sistem MY-SLG.</p>
</body>
</html>
