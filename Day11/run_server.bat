@echo off
title Kafka Server
echo Starting Kafka Server (KRaft mode)...
cd /d "%~dp0kafka_2.13-3.8.0"
.\bin\windows\kafka-server-start.bat .\config\kraft\server.properties
pause
