<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pemberitahuan Status Perizinan Keluar Kantor</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: {{ $status === 'Disetujui' ? '#2e7d32' : '#c62828' }};">
        Pengajuan Perizinan Keluar Kantor Anda Telah {{ $status }}
    </h2>
    <p>Halo <strong>{{ $namaPegawai }}</strong>,</p>
    <p>
        Pengajuan perizinan keluar kantor yang Anda ajukan telah ditinjau dan diperbarui. 
        Berikut adalah rincian status perizinan Anda:
    </p>

    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px; border: 1px solid #e2e8f0;">
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left" style="width: 35%;">Status Akhir</th>
            <td>
                <strong style="color: {{ $status === 'Disetujui' ? '#2e7d32' : '#c62828' }};">
                    {{ $status }}
                </strong>
            </td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Jenis Perizinan</th>
            <td>{{ $jenisPerizinan }}</td>
        </tr>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Tanggal</th>
            <td>{{ $tanggal }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Jam Keluar - Kembali</th>
            <td>{{ $jamKeluar }} - {{ $jamKembali }}</td>
        </tr>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Keperluan</th>
            <td>{{ $keperluan }}</td>
        </tr>
        @if(!empty($catatan))
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Catatan</th>
            <td>{{ $catatan }}</td>
        </tr>
        @endif
    </table>

    @if($status === 'Disetujui')
        <p style="margin-top: 15px; color: #2e7d32;">
            Pengajuan perizinan keluar kantor Anda telah disetujui. Pastikan untuk selalu mematuhi jam keluar dan jam kembali yang telah ditentukan.
        </p>
    @else
        <p style="margin-top: 15px; color: #c62828;">
            Mohon maaf, pengajuan perizinan keluar kantor Anda ditolak. Silakan hubungi atasan atau HRD untuk informasi lebih lanjut.
        </p>
    @endif

    <p style="margin-top: 20px;">
        Terima kasih,<br>
        <strong>Sistem MY-SLG</strong>
    </p>
</body>
</html>
