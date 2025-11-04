#!/bin/bash

# Start FastAPI server with uvicorn as Python module
python -m uvicorn main:app --host 0.0.0.0 --port 8000
