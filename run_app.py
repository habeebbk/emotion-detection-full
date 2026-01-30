import subprocess
import time
import os
import sys

def run_backend():
    print("Starting Backend...")
    return subprocess.Popen([sys.executable, "app.py"], cwd="backend")

def run_frontend():
    print("Starting Frontend...")
    return subprocess.Popen(["npm", "run", "dev"], cwd="frontend", shell=True)

if __name__ == "__main__":
    backend_proc = run_backend()
    time.sleep(5)  # Wait for backend to initialize
    frontend_proc = run_frontend()
    
    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("Backend stopped. Exiting.")
                break
            if frontend_proc.poll() is not None:
                print("Frontend stopped. Exiting.")
                break
    except KeyboardInterrupt:
        print("Stopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()
