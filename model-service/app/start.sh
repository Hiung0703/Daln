#!/bin/bash

# Start OCR Model Service
cd "$(dirname "$0")"

echo "🚀 Starting OCR Model Service..."

# Activate venv and run Flask
/home/dunhiung/Desktop/APP/model/.venv/bin/python main.py
