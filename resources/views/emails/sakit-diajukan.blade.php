<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pengajuan Izin Sakit Baru</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2b6cb0;">Pemberitahuan Pengajuan Izin Sakit Baru</h2>
    <p>Halo Tim HRD,</p>
    <p>Ada pengajuan izin sakit baru dari karyawan yang membutuhkan peninjauan dan persetujuan Anda:</p>

    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px; border: 1px solid #e2e8f0;">
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left" style="width: 35%;">Nama Karyawan</th>
            <td>{{ $namaPegawai }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Email</th>
            <td>{{ $emailPegawai }}</td>
        </tr>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Divisi</th>
            <td>{{ $divisiPegawai }}</td>
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
            <th align="left">Keterangan / Diagnosa</th>
            <td>{{ $keterangan }}</td>
        </tr>
        <tr style="background-color: #f7fafc;">
            <th align="left">Lampiran Surat Dokter / Bukti</th>
            <td>{{ $adaBukti ? 'Tersedia di sistem' : 'Tidak ada lampiran' }}</td>
        </tr>
    </table>

    <p style="margin-top: 20px;">
        Silakan masuk ke Website MY-SLG pada menu <strong>Perizinan &rarr; Sakit</strong> untuk memeriksa dan memproses pengajuan ini.
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;">
    <p style="font-size: 12px; color: #a0aec0;">Email ini dikirim otomatis oleh sistem MY-SLG.</p>
</body>
</html>
