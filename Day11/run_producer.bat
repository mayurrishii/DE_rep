@echo off
title Kafka Producer
echo Starting Kafka Producer...
cd /d "%~dp0"
python kafka_producer.py
pause
