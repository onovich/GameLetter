param(
  [int]$Port = 4318,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$candidatePorts = @($Port, 4319, 4320, 4321, 4322, 5178, 5179, 5188, 5189) | Select-Object -Unique

function Test-CmsOnPort {
  param([int]$PortToCheck)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$PortToCheck/api/inbox" -TimeoutSec 2
    if ($response.StatusCode -ne 200) {
      return $false
    }

    $payload = $response.Content | ConvertFrom-Json
    return $null -ne $payload.files
  } catch {
    return $false
  }
}

function Test-PortAvailable {
  param([int]$PortToCheck)

  $listener = $null
  try {
    $address = [System.Net.IPAddress]::Parse('127.0.0.1')
    $listener = [System.Net.Sockets.TcpListener]::new($address, $PortToCheck)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($listener) {
      $listener.Stop()
    }
  }
}

function Select-CmsPort {
  foreach ($candidatePort in $candidatePorts) {
    if (Test-CmsOnPort -PortToCheck $candidatePort) {
      return [pscustomobject]@{
        Port = $candidatePort
        Existing = $true
      }
    }

    if (Test-PortAvailable -PortToCheck $candidatePort) {
      return [pscustomobject]@{
        Port = $candidatePort
        Existing = $false
      }
    }
  }

  throw "No available Prompt CMS port found. Tried: $($candidatePorts -join ', ')"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm was not found in PATH. Install Node.js or open this from a shell where npm is available.'
}

$selection = Select-CmsPort
$url = "http://127.0.0.1:$($selection.Port)/"

if ($DryRun) {
  Write-Host "Project root: $projectRoot"
  Write-Host "Prompt CMS URL: $url"
  Write-Host "Existing CMS server: $($selection.Existing)"
  if (-not $selection.Existing) {
    Write-Host "Server command: set PROMPT_CMS_PORT=$($selection.Port) && npm run cms"
  }
  exit 0
}

if (-not $selection.Existing) {
  $serverCommand = "title GameLetter Prompt CMS && cd /d `"$projectRoot`" && set `"PROMPT_CMS_PORT=$($selection.Port)`" && npm run cms"
  Start-Process -FilePath 'cmd.exe' -ArgumentList @('/k', $serverCommand) -WorkingDirectory $projectRoot

  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    if (Test-CmsOnPort -PortToCheck $selection.Port) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    throw "Prompt CMS did not start on $url within the expected time. Check the server window for details."
  }
}

Start-Process $url
Write-Host "Prompt CMS opened: $url"
