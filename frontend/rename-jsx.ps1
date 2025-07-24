# Script para renomear arquivos .js que contêm JSX para .jsx
# Executa apenas no diretório src para evitar renomear arquivos de configuração

param(
    [string]$SourcePath = ".\src",
    [switch]$DryRun = $false
)

Write-Host "Iniciando renomeação de arquivos .js para .jsx..." -ForegroundColor Green
Write-Host "Diretório: $SourcePath" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "MODO DRY RUN - Nenhum arquivo será renomeado" -ForegroundColor Cyan
}

# Função para verificar se um arquivo contém JSX
function Test-ContainsJSX {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        
        # Padrões que indicam JSX
        $jsxPatterns = @(
            'return\s*<',           # return <Component>
            'return\s*\(',          # return (
            '>\s*<',                # ><
            'React\.createElement', # React.createElement
            'jsx',                  # jsx literal
            'import.*from.*react', # import from react
            'export.*React',       # export React component
            '<[A-Z][a-zA-Z]*',     # <ComponentName
            'className=',          # className prop
            'onClick=',            # onClick prop
            'onChange='            # onChange prop
        )
        
        foreach ($pattern in $jsxPatterns) {
            if ($content -match $pattern) {
                return $true
            }
        }
        
        return $false
    }
    catch {
        Write-Warning "Erro ao ler arquivo $FilePath : $_"
        return $false
    }
}

# Função para verificar se é um arquivo que deve permanecer .js
function Test-ShouldStayJS {
    param([string]$FileName)
    
    $jsOnlyFiles = @(
        'api.js',
        'socket.js',
        'socket_backup.js',
        'socketManager.js',
        'security.js',
        'theme.config.js',
        'helpers.js',
        'masks.js',
        'logger.js',
        'tokenManager.js',
        'toastManager.js',
        'authUtils.js',
        'colorGenerator.js',
        'inputValidation.js',
        'i18n.js',
        'systemStats.js',
        'rules.js'
    )
    
    $fileName = Split-Path $FileName -Leaf
    return $jsOnlyFiles -contains $fileName
}

# Encontrar todos os arquivos .js no diretório src
$jsFiles = Get-ChildItem -Path $SourcePath -Filter "*.js" -Recurse | Where-Object { 
    -not $_.PSIsContainer 
}

Write-Host "Encontrados $($jsFiles.Count) arquivos .js" -ForegroundColor Yellow

$renamedCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($file in $jsFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path, ".")
    
    try {
        # Verificar se deve permanecer .js
        if (Test-ShouldStayJS -FileName $file.Name) {
            Write-Host "  SKIP: $relativePath (arquivo de configuração/utilitário)" -ForegroundColor Gray
            $skippedCount++
            continue
        }
        
        # Verificar se contém JSX
        if (Test-ContainsJSX -FilePath $file.FullName) {
            $newName = $file.FullName -replace '\.js$', '.jsx'
            
            if ($DryRun) {
                Write-Host "  WOULD RENAME: $relativePath -> $($newName.Replace((Get-Location).Path, '.'))" -ForegroundColor Cyan
            } else {
                Rename-Item -Path $file.FullName -NewName $newName -ErrorAction Stop
                Write-Host "  RENAMED: $relativePath -> $($newName.Replace((Get-Location).Path, '.'))" -ForegroundColor Green
            }
            $renamedCount++
        } else {
            Write-Host "  SKIP: $relativePath (não contém JSX)" -ForegroundColor Gray
            $skippedCount++
        }
    }
    catch {
        Write-Error "Erro ao processar $relativePath : $_"
        $errorCount++
    }
}

Write-Host "`nResumo:" -ForegroundColor Yellow
Write-Host "  Arquivos renomeados: $renamedCount" -ForegroundColor Green
Write-Host "  Arquivos ignorados: $skippedCount" -ForegroundColor Gray
Write-Host "  Erros: $errorCount" -ForegroundColor Red

if ($DryRun) {
    Write-Host "`nPara executar a renomeação, execute novamente sem o parâmetro -DryRun" -ForegroundColor Cyan
} else {
    Write-Host "`nRenomeação concluída!" -ForegroundColor Green
}

# Verificar se há arquivos de importação que precisam ser atualizados
Write-Host "`nVerificando importações que podem precisar ser atualizadas..." -ForegroundColor Yellow

$allFiles = Get-ChildItem -Path $SourcePath -Filter "*.jsx" -Recurse
$importIssues = @()

foreach ($file in $allFiles) {
    try {
        $content = Get-Content $file.FullName -Raw
        
        # Procurar por importações que ainda referenciam .js
        $importMatches = [regex]::Matches($content, 'import.*from.*\.js')
        
        foreach ($match in $importMatches) {
            $importPath = $match.Groups[1].Value
            $importIssues += @{
                File = $file.FullName.Replace((Get-Location).Path, ".")
                Import = $importPath
            }
        }
    }
    catch {
        # Ignorar erros de leitura
    }
}

if ($importIssues.Count -gt 0) {
    Write-Host "`nImportações que podem precisar ser atualizadas:" -ForegroundColor Yellow
    foreach ($issue in $importIssues) {
        Write-Host "  $($issue.File): $($issue.Import)" -ForegroundColor Cyan
    }
    Write-Host "`nVerifique se esses arquivos importados foram renomeados para .jsx" -ForegroundColor Yellow
}