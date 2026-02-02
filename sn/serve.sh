#!/bin/bash
# Quick server for Security Now! Explorer
echo "Starting Security Now! Explorer at http://localhost:8080"
echo "Press Ctrl+C to stop"
python3 -m http.server 8080
