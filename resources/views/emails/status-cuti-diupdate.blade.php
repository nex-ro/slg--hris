<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pemberitahuan Status Pengajuan Cuti</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: {{ strtolower($status) === 'disetujui' ? '#2e7d32' : '#c62828' }};">
        Pengajuan Cuti Anda Telah {{ $status }}
    </h2>
    <p>Halo <strong>{{ $namaPegawai }}</strong>,</p>
    <p>
        Pengajuan cuti yang Anda ajukan telah selesai ditinjau. Berikut adalah rincian status pengajuan Anda:
    </p>

    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px; border: 1px solid #e2e8f0;">
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left" style="width: 35%;">Status Akhir</th>
            <td>
                <strong style="color: {{ strtolower($status) === 'disetujui' ? '#2e7d32' : '#c62828' }};">
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
            <th align="left">Jumlah Hari</th>
            <td>{{ $jumlahHari }}</td>
        </tr>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Alasan</th>
            <td>{{ $alasan }}</td>
        </tr>
        @if(!empty($penerimaTugas))
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Penerima Tugas</th>
            <td>{{ $penerimaTugas }}</td>
        </tr>
        @endif
        @if(!empty($catatan))
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Catatan</th>
            <td>{!! nl2br(e($catatan)) !!}</td>
        </tr>
        @endif
    </table>

    @if(strtolower($status) === 'disetujui')
        <p style="margin-top: 15px; color: #2e7d32;">
            Pengajuan cuti Anda telah disetujui dan telah dicatat pada sistem kehadiran. Selamat beristirahat!
        </p>
    @else
        <p style="margin-top: 15px; color: #c62828;">
            Mohon maaf, pengajuan cuti Anda ditolak. Jatah cuti yang sebelumnya di-reserve telah dikembalikan ke saldo sisa cuti Anda.
        </p>
    @endif

    <p style="margin-top: 20px;">
        Terima kasih,<br>
        <strong>Sistem MY-SLG</strong>
    </p>
</body>
</html>
