@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo       Kafka Local Setup ^& Configuration Tool
echo ========================================================

set KAFKA_DIR=kafka_2.13-3.8.0
set KAFKA_TGZ=kafka_2.13-3.8.0.tgz
set KAFKA_URL=https://archive.apache.org/dist/kafka/3.8.0/kafka_2.13-3.8.0.tgz

:: Step 1: Download Kafka if not present
if not exist "%KAFKA_DIR%" (
    echo [1/4] Kafka directory not found. Downloading Kafka 3.8.0...
    powershell -Command "Invoke-WebRequest -Uri '%KAFKA_URL%' -OutFile '%KAFKA_TGZ%'"
    
    echo [2/4] Extracting %KAFKA_TGZ%...
    tar -xzf "%KAFKA_TGZ%"
    del "%KAFKA_TGZ%"
) else (
    echo [1/4] Kafka folder %KAFKA_DIR% already exists.
)

:: Step 2: Patch kafka-run-class.bat for Windows "input line too long" fix
echo [2/4] Applying Windows CLASSPATH fix to kafka-run-class.bat...
set "RUN_CLASS=%KAFKA_DIR%\bin\windows\kafka-run-class.bat"
python -c "import sys; path = r'%RUN_CLASS%'; text = open(path).read(); old = 'for %%%%i in (\"%%BASE_DIR%%\\\\libs\\\\*\") do (\n\tcall :concat \"%%%%i\"\n)'; new = 'call :concat \"%%BASE_DIR%%\\\\libs\\\\*\"\n'; open(path, 'w').write(text.replace(old, new) if old in text else text)"

:: Step 3: Install Python dependencies
echo [3/4] Installing Python Kafka package...
pip install kafka-python-ng

:: Step 4: Format storage for KRaft mode
echo [4/4] Formatting Kafka storage...
cd /d "%~dp0%KAFKA_DIR%"
call .\bin\windows\kafka-storage.bat format -t MkU3OEVEMDk0RDU4NEI1Q --ignore-formatted -c .\config\kraft\server.properties
cd /d "%~dp0"

echo.
echo ========================================================
echo                SETUP COMPLETE!
echo.
echo To start Kafka Server:   Run run_server.bat
echo To start Producer:       Run run_producer.bat
echo To start Consumer:       Run run_consumer.bat
echo ========================================================
echo.
pause
