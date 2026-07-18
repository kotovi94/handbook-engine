$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), 5174)
$listener.Start()

function Write-Response($stream, $status, $contentType, $bytes) {
  $reason = if ($status -eq 200) { "OK" } else { "Not Found" }
  $header = "HTTP/1.1 $status $reason`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($bytes, 0, $bytes.Length)
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $requestLine = $reader.ReadLine()

    if (-not $requestLine) {
      $client.Close()
      continue
    }

    $parts = $requestLine.Split(" ")
    $path = [Uri]::UnescapeDataString($parts[1].Split("?")[0]).TrimStart("/")

    if ([string]::IsNullOrWhiteSpace($path)) {
      $path = "index.html"
    }

    $candidate = Join-Path $root $path
    $resolved = Resolve-Path -LiteralPath $candidate -ErrorAction SilentlyContinue

    if (-not $resolved -and $path -like "campaigns/*" -and -not [System.IO.Path]::HasExtension($path)) {
      $candidate = Join-Path $root "campaigns/index.html"
      $resolved = Resolve-Path -LiteralPath $candidate -ErrorAction SilentlyContinue
    }

    if (-not $resolved -or -not $resolved.Path.StartsWith($root.Path)) {
      Write-Response $stream 404 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Not found"))
      $client.Close()
      continue
    }

    $file = $resolved.Path

    if (Test-Path -LiteralPath $file -PathType Container) {
      $file = Join-Path $file "index.html"
    }

    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
      Write-Response $stream 404 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Not found"))
      $client.Close()
      continue
    }

    $extension = [System.IO.Path]::GetExtension($file)
    $contentType = switch ($extension) {
      ".html" { "text/html; charset=utf-8" }
      ".css" { "text/css; charset=utf-8" }
      ".js" { "text/javascript; charset=utf-8" }
      ".json" { "application/json; charset=utf-8" }
      default { "text/plain; charset=utf-8" }
    }

    $bytes = [System.IO.File]::ReadAllBytes($file)
    Write-Response $stream 200 $contentType $bytes
    $client.Close()
  }
}
finally {
  $listener.Stop()
}
