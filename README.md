# Cloud Secure — Frontend Preview

This repository contains the frontend-only preview of the AWS Cloud Security Dashboard.

What changed
- The project was trimmed to keep only the `frontend/` folder for a quick static preview.
- A small mock API fallback was added to `frontend/static/js/api-client.js` so the dashboard works without a backend.

Run locally
1. Start a static server from the repository root:

```bash
python3 -m http.server 8000 --directory frontend --bind 0.0.0.0
```

2. Open the dashboard in your browser:

- Locally: `http://localhost:8000/`
- Codespaces / forwarded port: use the forwarded URL provided by your IDE (set port visibility to Public if required).

Notes
- The frontend expects API endpoints under `/api/*`. When no backend is reachable, the client falls back to built-in mock data so charts and lists render.
- To remove the mock behavior, edit `frontend/static/js/api-client.js` and restore the original `request` behavior.

Stopping the server

Press `Ctrl+C` in the terminal running the server or run:

```bash
pkill -f "http.server" || true
```

Commit
- Changes are committed and pushed to `main`.

If you want me to restore the full project (backend, configs, docs), I can revert the deletion or create a branch and re-add files — tell me how you'd like to proceed.

---
Generated and committed by repository maintainer actions.
