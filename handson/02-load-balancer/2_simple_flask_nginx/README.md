# Simple Flask backends with Nginx load balancer

This folder shows a minimal, local setup of two Flask backend services and an `nginx` load balancer configuration.

Files
- `backend_1.py`  — Flask app listening on port 5001
- `backend_2.py` — Flask app listening on port 5002
- `nginx.config` — Nginx configuration that proxies to the two backends and listens on port 8080

Prerequisites (Windows)
- Python 3.8+ installed and on `PATH`
- `pip` available
- Nginx for Windows (download and unzip official nginx build)

Quick run steps

1. Install Python dependencies:

```bash
python -m pip install --user flask
```

2. Start both backends in two separate terminals (from this folder):

```bash
python backend_1.py
# In a second terminal:
python backend_2.py
```

3. Start nginx using the included config. Update the `-c` path to point to this folder's `nginx.config` and use your nginx.exe location. Example (PowerShell):

```powershell
cd 'C:\path\to\nginx\folder'
.\nginx.exe -c "C:\Users\...\handson\02-load-balancer\2_simple_flask_nginx\nginx.config"
```

4. Test the load balancer (from any terminal):

```bash
curl http://localhost:8080/
# Repeat multiple times to see responses from backend1 and backend2
```

Notes and troubleshooting
- If `nginx` fails to start, check the `nginx` error log in the nginx folder and ensure the `nginx.config` path is correct.
- If ports 5001/5002/8080 are in use, stop the conflicting processes or change ports in the Python files and `nginx.config`.
- On Windows you may need to run PowerShell/Command Prompt as Administrator to bind to ports.

Optional improvements
- Add a `/health` route and configure health checks.
- Use `ip_hash` in the `upstream` block for sticky sessions.
- For production, run behind a process manager or in containers/orchestrator and enable TLS termination in `nginx`.

That's it—simple local setup to demonstrate nginx load balancing between two Python Flask backends.
