<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pemberitahuan Izin Keluar Kantor Disetujui Atasan</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #1e40af;">Pengajuan Izin Keluar Kantor Telah Disetujui Atasan</h2>
    <p>Halo Tim HRD,</p>
    <p>
        Pengajuan izin keluar kantor untuk pegawai berikut telah disetujui oleh atasan langsung / yang mengetahui (<strong>{{ $diketahuiOleh }}</strong>) dan menunggu peninjauan / persetujuan dari HRD.
    </p>

    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px; border: 1px solid #e2e8f0;">
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left" style="width: 35%;">Nama Pegawai</th>
            <td><strong>{{ $namaPegawai }}</strong></td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Disetujui Oleh</th>
            <td>{{ $diketahuiOleh }}</td>
        </tr>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Jenis Perizinan</th>
            <td>{{ $jenisPerizinan }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Tanggal</th>
            <td>{{ $tanggal }}</td>
        </tr>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Jam Keluar - Kembali</th>
            <td>{{ $jamKeluar }} - {{ $jamKembali }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Keperluan</th>
            <td>{{ $keperluan }}</td>
        </tr>
        @if(!empty($catatan))
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Catatan Atasan</th>
            <td>{{ $catatan }}</td>
        </tr>
        @endif
    </table>

    <p style="margin-top: 15px;">
        Silakan masuk ke Website MY-SLG pada menu <strong>Perizinan Keluar Kantor</strong> untuk meninjau dan memberikan persetujuan akhir.
    </p>

    <p style="margin-top: 20px;">
        Terima kasih,<br>
        <strong>Website MY-SLG</strong>
    </p>
</body>
</html>
