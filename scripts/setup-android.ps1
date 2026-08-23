param(
    [string]$ApiBaseUrl = ""
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

function Find-LanIPv4 {
    $defaultRoute = Get-NetRoute `
        -AddressFamily IPv4 `
        -DestinationPrefix "0.0.0.0/0" `
        -ErrorAction SilentlyContinue |
        Where-Object {
            $_.NextHop -ne "0.0.0.0"
        } |
        Sort-Object RouteMetric, InterfaceMetric |
        Select-Object -First 1

    if ($null -ne $defaultRoute) {
        $address = Get-NetIPAddress `
            -AddressFamily IPv4 `
            -InterfaceIndex $defaultRoute.InterfaceIndex `
            -ErrorAction SilentlyContinue |
            Where-Object {
                $_.IPAddress -notmatch "^127\." -and
                $_.IPAddress -notmatch "^169\.254\."
            } |
            Select-Object -First 1

        if ($null -ne $address) {
            return $address.IPAddress
        }
    }

    $fallback = Get-NetIPAddress `
        -AddressFamily IPv4 `
        -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notmatch "^127\." -and
            $_.IPAddress -notmatch "^169\.254\." -and
            $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL|VMware|VirtualBox"
        } |
        Select-Object -First 1

    if ($null -ne $fallback) {
        return $fallback.IPAddress
    }

    return $null
}

if ([string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    if (Test-Path ".env.android") {
        $existing = Get-Content ".env.android" |
            Where-Object {
                $_ -match "^VITE_API_BASE_URL="
            } |
            Select-Object -First 1

        if ($existing) {
            $ApiBaseUrl = $existing.Substring(
                "VITE_API_BASE_URL=".Length
            ).Trim()
        }
    }
}

if ([string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
    $lanIp = Find-LanIPv4

    if ([string]::IsNullOrWhiteSpace($lanIp)) {
        throw 'LAN IPv4 not found. Run: .\scripts\setup-android.ps1 -ApiBaseUrl "http://YOUR_PC_IP:3000"'
    }

    $ApiBaseUrl = "http://${lanIp}:3000"
}

$ApiBaseUrl = $ApiBaseUrl.TrimEnd("/")

Write-Host ""
Write-Host "Android API: $ApiBaseUrl"
Write-Host ""

Set-Content `
    -Path ".env.android" `
    -Value "VITE_API_BASE_URL=$ApiBaseUrl" `
    -Encoding ASCII

if ($ApiBaseUrl.StartsWith("http://")) {
    $env:CAPACITOR_ALLOW_MIXED_CONTENT = "true"
}
else {
    $env:CAPACITOR_ALLOW_MIXED_CONTENT = "false"
}

Write-Host "[1/5] Installing dependencies..."
npm install

if ($LASTEXITCODE -ne 0) {
    throw "npm install failed."
}

Write-Host "[2/5] Building Android web assets..."
npm run build:android

if ($LASTEXITCODE -ne 0) {
    throw "Android web build failed."
}

if (-not (Test-Path "android")) {
    Write-Host "[3/5] Creating Android project..."
    npx cap add android

    if ($LASTEXITCODE -ne 0) {
        throw "Capacitor Android project creation failed."
    }
}
else {
    Write-Host "[3/5] Android project already exists."
}

if ($ApiBaseUrl.StartsWith("http://")) {
    $manifestPath = "android/app/src/main/AndroidManifest.xml"

    if (Test-Path $manifestPath) {
        $manifest = Get-Content $manifestPath -Raw

        if ($manifest -notmatch 'android:usesCleartextTraffic=') {
            $manifest = $manifest -replace `
                "<application", `
                '<application android:usesCleartextTraffic="true"'

            Set-Content `
                -Path $manifestPath `
                -Value $manifest `
                -Encoding UTF8
        }
    }
}

Write-Host "[4/5] Syncing Capacitor..."
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    throw "Capacitor sync failed."
}

Write-Host "[5/5] Opening Android Studio..."
npx cap open android

if ($LASTEXITCODE -ne 0) {
    throw "Could not open Android Studio."
}

Write-Host ""
Write-Host "Android setup complete."
Write-Host "Keep the tablet and PC on the same LAN while using the local API."
Write-Host "If the API cannot be reached, check Windows Firewall port 3000."
