<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pengajuan Perizinan Keluar Kantor</title>
</head>
<body>
    <h2>Pengajuan Perizinan Keluar Kantor</h2>
    <p>Halo, ada pengajuan perizinan baru yang membutuhkan perhatian Anda.</p>

    <table cellpadding="6" cellspacing="0">
        <tr>
            <th align="left">Pegawai</th>
            <td>{{ $namaPegawai }}</td>
        </tr>
        <tr>
            <th align="left">Jenis perizinan</th>
            <td>{{ $jenisPerizinan }}</td>
        </tr>
        <tr>
            <th align="left">Tanggal</th>
            <td>{{ $tanggal }}</td>
        </tr>
        <tr>
            <th align="left">Jam keluar</th>
            <td>{{ $jamKeluar }}</td>
        </tr>
        <tr>
            <th align="left">Jam kembali</th>
            <td>{{ $jamKembali }}</td>
        </tr>
        <tr>
            <th align="left">Keperluan</th>
            <td>{{ $keperluan }}</td>
        </tr>
    </table>

    <p>Silakan masuk ke aplikasi HRIS untuk meninjau pengajuan ini.</p>
</body>
</html>
