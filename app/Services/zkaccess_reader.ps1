param (
    [string]$Action = "get_logs",
    [string]$Ip = "192.168.87.201",
    [int]$Port = 4370,
    [string]$Date = "",
    [string]$StartDate = "",
    [string]$EndDate = "",
    [int]$Limit = 1000,
    [string]$DbPath = "C:\Program Files (x86)\ZKTeco\ZKAccess3.5\access.mdb",
    [string]$Password = "pwd"
)

# 0. Jika dijalankan pada 64-bit PowerShell di Windows 64-bit, relaunch otomatis ke 32-bit PowerShell (SysWOW64)
# karena ZKAccess 3.5 SDK (zkemkeeper.dll) dan Microsoft.Jet.OLEDB.4.0 adalah komponen 32-bit (x86).
if ([IntPtr]::Size -eq 8 -and (Test-Path "$env:WINDIR\SysWOW64\WindowsPowerShell\v1.0\powershell.exe")) {
    $x86Ps = "$env:WINDIR\SysWOW64\WindowsPowerShell\v1.0\powershell.exe"
    $paramList = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$PSCommandPath`"")
    foreach ($key in $PSBoundParameters.Keys) {
        $paramList += "-$key"
        $paramList += "`"$($PSBoundParameters[$key])`""
    }
    & $x86Ps @paramList
    exit $LASTEXITCODE
}

$ErrorActionPreference = "SilentlyContinue"

# Helper untuk membuka koneksi ke database Access dengan fallback provider
function Open-AccessDbConnection {
    param([string]$Path, [string]$Pwd)
    $providers = @(
        "Microsoft.Jet.OLEDB.4.0",
        "Microsoft.ACE.OLEDB.12.0",
        "Microsoft.ACE.OLEDB.16.0"
    )
    foreach ($prov in $providers) {
        try {
            $c = New-Object -ComObject ADODB.Connection
            $cs = "Provider=$prov;Data Source=$Path;Jet OLEDB:Database Password=$Pwd;"
            $c.Open($cs)
            if ($c.State -eq 1) {
                return $c
            }
        } catch {}
    }
    return $null
}

# Helper untuk mengambil nama pegawai dari Access.mdb (sebagai mapping nama)
function Get-UserMapping {
    $userMap = @{}
    try {
        $conn = Open-AccessDbConnection -Path $DbPath -Pwd $Password
        if ($conn) {
            $rs = $conn.Execute("SELECT Badgenumber, Name FROM USERINFO")
            while (-not $rs.EOF) {
                $b = [string]$rs.Fields.Item('Badgenumber').Value
                $n = [string]$rs.Fields.Item('Name').Value
                if ($b) { $userMap[$b] = $n }
                $rs.MoveNext()
            }
            $conn.Close()
        }
    } catch {}
    return $userMap
}

# 1. Action: Test Connection
if ($Action -eq "test_connection") {
    $zkConnected = $false
    try {
        $zk = New-Object -ComObject zkemkeeper.ZKEM.1
        $null = $zk.SetCommPassword(0)
        $zkConnected = $zk.Connect_Net($Ip, $Port)
        if ($zkConnected) {
            $null = $zk.Disconnect()
        }
    } catch {}

    $devices = @(
        @{
            name = "Liberty Lt. 1 Front Office"
            ip = $Ip
            port = $Port
            online = $zkConnected
            mode = if ($zkConnected) { "Langsung ke Mesin (Direct Hardware)" } else { "Database ZKAccess 3.5" }
        }
    )

    @{
        status = "success"
        message = if ($zkConnected) { "Mesin fisik ${Ip}:${Port} ONLINE & terhubung langsung!" } else { "Terhubung melalui database ZKAccess 3.5 lokal" }
        devices = $devices
    } | ConvertTo-Json
    exit 0
}

# 1.5 Action: Clear Machine Logs (Hapus Log di Memori Mesin Fisik)
if ($Action -eq "clear_logs") {
    try {
        $zk = New-Object -ComObject zkemkeeper.ZKEM.1
        $null = $zk.SetCommPassword(0)
        $zkConnected = $zk.Connect_Net($Ip, $Port)
        if (-not $zkConnected) {
            @{
                status = "error"
                message = "Gagal terhubung ke mesin fisik ${Ip}:${Port}. Pastikan IP benar dan mesin dalam kondisi menyala."
            } | ConvertTo-Json
            exit 1
        }

        # Nonaktifkan sementara event pada mesin saat proses pembersihan berlangsung
        $null = $zk.EnableDevice(1, $false)
        $cleared = $zk.ClearGLog(1)
        $null = $zk.RefreshData(1)
        $null = $zk.EnableDevice(1, $true)
        $null = $zk.Disconnect()

        if ($cleared) {
            @{
                status = "success"
                message = "Seluruh log pada memori mesin fisik ${Ip}:${Port} berhasil dibersihkan!"
            } | ConvertTo-Json
            exit 0
        } else {
            @{
                status = "error"
                message = "Mesin fisik ${Ip}:${Port} terhubung, tetapi perintah penghapusan log (ClearGLog) tidak berhasil."
            } | ConvertTo-Json
            exit 1
        }
    } catch {
        @{
            status = "error"
            message = "Terjadi exception saat membersihkan log mesin: $_"
        } | ConvertTo-Json
        exit 1
    }
}

# 2. Action: Get Logs (Gabungkan Buffer Mesin Fisik + Riwayat Database Access)
$machineLogs = @()
$directConnected = $false
$userNames = Get-UserMapping

# A. Ambil log real-time dari Mesin Fisik jika perangkat online
try {
    $zk = New-Object -ComObject zkemkeeper.ZKEM.1
    $null = $zk.SetCommPassword(0)
    if ($zk.Connect_Net($Ip, $Port)) {
        $directConnected = $true
        if ($zk.ReadGeneralLogData(1)) {
            $enrollNumber = ""; $verifyMode = 0; $inOutMode = 0
            $year = 0; $month = 0; $day = 0; $hour = 0; $minute = 0; $second = 0; $workCode = 0

            while ($zk.SSR_GetGeneralLogData(1, [ref]$enrollNumber, [ref]$verifyMode, [ref]$inOutMode, [ref]$year, [ref]$month, [ref]$day, [ref]$hour, [ref]$minute, [ref]$second, [ref]$workCode)) {
                $logDate = ("{0:D4}-{1:D2}-{2:D2}" -f $year, $month, $day)
                
                # Filter tanggal: rentang StartDate-EndDate ATAU single Date
                $isMatch = $true
                if ($StartDate -ne "" -and $EndDate -ne "") {
                    if ($logDate -lt $StartDate -or $logDate -gt $EndDate) {
                        $isMatch = $false
                    }
                } elseif ($Date -ne "") {
                    if ($logDate -ne $Date) {
                        $isMatch = $false
                    }
                }

                if (-not $isMatch) {
                    continue
                }

                $formattedTime = ("{0:D4}-{1:D2}-{2:D2} {3:D2}:{4:D2}:{5:D2}" -f $year, $month, $day, $hour, $minute, $second)
                $pinStr = [string]$enrollNumber

                # Jam 17:00 ke atas dihitung sebagai Pulang (O)
                $machineLogs += [PSCustomObject]@{
                    pin = $pinStr
                    name = if ($userNames.ContainsKey($pinStr)) { $userNames[$pinStr] } else { "" }
                    checktime = $formattedTime
                    checktype = if ($inOutMode -eq 1 -or $inOutMode -eq 2 -or $inOutMode -eq 5 -or $hour -ge 17) { "O" } else { "I" }
                    verifycode = [string]$verifyMode
                    source = "direct_machine"
                }
            }
        }
        $null = $zk.Disconnect()
    }
} catch {
    $directConnected = $false
}

# B. Ambil log riwayat dari database access.mdb (CHECKINOUT + acc_monitor_log)
$dbLogs = @()
try {
    $conn = Open-AccessDbConnection -Path $DbPath -Pwd $Password
    if ($conn) {
        # B1. Query tabel CHECKINOUT (Log Presensi Formal ZKAccess)
        $sql1 = "SELECT "
        if ($Limit -gt 0) {
            $sql1 += "TOP $Limit "
        }
        $sql1 += "u.Badgenumber as pin, u.Name as name, c.CHECKTIME as checktime, c.CHECKTYPE as checktype, c.VERIFYCODE as verifycode "
        $sql1 += "FROM CHECKINOUT c "
        $sql1 += "INNER JOIN USERINFO u ON c.USERID = u.USERID "

        if ($StartDate -ne "" -and $EndDate -ne "") {
            $s = "$StartDate 00:00:00"
            $e = "$EndDate 23:59:59"
            $sql1 += "WHERE c.CHECKTIME >= #$s# AND c.CHECKTIME <= #$e# "
        } elseif ($Date -ne "") {
            $dStart = "$Date 00:00:00"
            $dEnd = "$Date 23:59:59"
            $sql1 += "WHERE c.CHECKTIME >= #$dStart# AND c.CHECKTIME <= #$dEnd# "
        }
        $sql1 += "ORDER BY c.CHECKTIME DESC"

        $rs1 = $conn.Execute($sql1)
        while (-not $rs1.EOF) {
            $checkTimeVal = $rs1.Fields.Item('checktime').Value
            $formattedTime = if ($checkTimeVal) { (Get-Date $checkTimeVal).ToString('yyyy-MM-dd HH:mm:ss') } else { "" }
            
            $rawType = [string]$rs1.Fields.Item('checktype').Value
            $hourVal = 0
            try {
                if ($checkTimeVal) { $hourVal = (Get-Date $checkTimeVal).Hour }
            } catch {}
            $finalType = if ($rawType -eq "O" -or $rawType -eq "1" -or $hourVal -ge 17) { "O" } else { "I" }

            $dbLogs += [PSCustomObject]@{
                pin = [string]$rs1.Fields.Item('pin').Value
                name = [string]$rs1.Fields.Item('name').Value
                checktime = $formattedTime
                checktype = $finalType
                verifycode = [string]$rs1.Fields.Item('verifycode').Value
                source = "access_db"
            }
            $rs1.MoveNext()
        }
        $rs1.Close()

        # B2. Query tabel acc_monitor_log (Log Real-Time Event & Door Access)
        $sql2 = "SELECT "
        if ($Limit -gt 0) {
            $sql2 += "TOP $Limit "
        }
        $sql2 += "[time] as checktime, pin, state, event_type, device_name "
        $sql2 += "FROM acc_monitor_log "
        $sql2 += "WHERE pin IS NOT NULL AND pin <> '' "

        if ($StartDate -ne "" -and $EndDate -ne "") {
            $s = "$StartDate 00:00:00"
            $e = "$EndDate 23:59:59"
            $sql2 += "AND [time] >= #$s# AND [time] <= #$e# "
        } elseif ($Date -ne "") {
            $dStart = "$Date 00:00:00"
            $dEnd = "$Date 23:59:59"
            $sql2 += "AND [time] >= #$dStart# AND [time] <= #$dEnd# "
        }
        $sql2 += "ORDER BY [time] DESC"

        $rs2 = $conn.Execute($sql2)
        while (-not $rs2.EOF) {
            $checkTimeVal = $rs2.Fields.Item('checktime').Value
            $formattedTime = if ($checkTimeVal) { (Get-Date $checkTimeVal).ToString('yyyy-MM-dd HH:mm:ss') } else { "" }
            $p = [string]$rs2.Fields.Item('pin').Value
            $stateVal = 0
            try { $stateVal = [int]$rs2.Fields.Item('state').Value } catch {}
            
            $hourVal = 0
            try {
                if ($checkTimeVal) { $hourVal = (Get-Date $checkTimeVal).Hour }
            } catch {}

            # State 11 = Pulang (Out), State 10 = Masuk (In)
            $finalType = if ($stateVal -eq 11 -or $stateVal -eq 13 -or $hourVal -ge 17) { "O" } else { "I" }

            $dbLogs += [PSCustomObject]@{
                pin = $p
                name = if ($userNames.ContainsKey($p)) { $userNames[$p] } else { "" }
                checktime = $formattedTime
                checktype = $finalType
                verifycode = [string]$rs2.Fields.Item('event_type').Value
                source = "acc_monitor_log"
            }
            $rs2.MoveNext()
        }
        $rs2.Close()

        $conn.Close()
    }
} catch {}

# C. Gabungkan log mesin langsung + database access.mdb (De-duplikasi by pin + checktime)
$combinedMap = @{}

# Masukkan log dari mesin langsung (real-time)
foreach ($log in $machineLogs) {
    $key = "$($log.pin)_$($log.checktime)"
    $combinedMap[$key] = $log
}

# Tambahkan log dari database riwayat yang belum ada di mesin langsung, atau update type jika 'O'
foreach ($log in $dbLogs) {
    $key = "$($log.pin)_$($log.checktime)"
    if (-not $combinedMap.ContainsKey($key)) {
        $combinedMap[$key] = $log
    } else {
        # Jika salah satu sumber mendeteksi Check-Out ('O'), utamakan 'O'
        if ($log.checktype -eq "O") {
            $combinedMap[$key].checktype = "O"
        }
        if (-not $combinedMap[$key].name -and $log.name) {
            $combinedMap[$key].name = $log.name
        }
    }
}

# Urutkan berdasarkan checktime DESC (terbaru paling atas)
$sortedLogs = @($combinedMap.Values | Sort-Object -Property checktime -Descending)
if ($Limit -gt 0 -and $sortedLogs.Count -gt $Limit) {
    $sortedLogs = @($sortedLogs | Select-Object -First $Limit)
}

$displayDate = if ($StartDate -ne "") { "$StartDate sd $EndDate" } elseif ($Date -ne "") { $Date } else { "Semua" }

@{
    status = "success"
    source = if ($directConnected) { "direct_machine_and_db" } else { "access_db" }
    device = "Liberty Lt. 1 Front Office (${Ip}:${Port})"
    count = $sortedLogs.Count
    date = $displayDate
    data = @($sortedLogs)
} | ConvertTo-Json -Depth 4
exit 0
