<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pengajuan Cuti Baru</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #1e40af;">Pengajuan Cuti Baru Membutuhkan Persetujuan</h2>
    <p>Halo <strong>{{ $namaApprover }}</strong>,</p>
    <p>
        Ada pengajuan cuti baru dari <strong>{{ $namaPegawai }}</strong> yang membutuhkan peninjauan dan persetujuan Anda sebagai <strong>{{ $roleApproverText }}</strong>.
    </p>

    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px; border: 1px solid #e2e8f0;">
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left" style="width: 35%;">Nama Pegawai</th>
            <td><strong>{{ $namaPegawai }}</strong></td>
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
            <th align="left">Alasan Cuti</th>
            <td>{{ $alasan }}</td>
        </tr>
        @if(!empty($penerimaTugas))
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Penerima Tugas</th>
            <td>{{ $penerimaTugas }}</td>
        </tr>
        @endif
        @if(!empty($tugas))
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Tugas yang Dilimpahkan</th>
            <td>{!! nl2br(e($tugas)) !!}</td>
        </tr>
        @endif
    </table>

    <p style="margin-top: 20px;">
        Silakan masuk ke Website MY-SLG untuk meninjau dan memberikan persetujuan pengajuan cuti ini.
    </p>

    <p style="margin-top: 20px;">
        Terima kasih,<br>
        <strong>Sistem HRIS MY-SLG</strong>
    </p>
</body>
</html>
