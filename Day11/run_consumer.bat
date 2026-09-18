@echo off
title Kafka Consumer
echo Starting Kafka Consumer...
cd /d "%~dp0"
python kafka_consumer.py
pause
