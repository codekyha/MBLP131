# Docker route

For any computer with Docker (Linux, or Docker Desktop on Windows / macOS) - no virtual machine needed.

| What | Command (run in this folder) |
|---|---|
| Services only: PostgreSQL, Redis, nginx | `docker compose up -d` |
| + local LLM server (Ollama) | `docker compose --profile ollama up -d` |
| + lab container (JupyterLab, FastAPI, Streamlit) and MLflow | `docker compose --profile lab up -d --build` |
| Shell in the lab container | `docker compose exec lab bash` |
| Stop / stop and delete the data | `docker compose down` / `docker compose down -v` |

Copy `.env.example` to `.env` first if you want to change the passwords or the Jupyter token.

* The lab container is built with the same installer as the VM image (`../lab_install.sh`), so both contain the
  same tools. The first build downloads several GB (PyTorch, Hugging Face, ...) and takes 10-30 minutes.
  A smaller image: `docker build -f Dockerfile --build-arg LAB_PROFILE=full -t labvm/lab:lite ..`
  (build context = the kit folder, i.e. the parent of this folder).
* JupyterLab: http://localhost:8888 (token from `.env`, default `mbbo205`), FastAPI 8000, Streamlit 8501,
  MLflow 5000, nginx 8080, Ollama 11434, PostgreSQL 5432, Redis 6379.
* On a machine that also has PostgreSQL and Redis as *system services* (the VM image, the WSL "Ubuntu Lab") the
  installer writes `POSTGRES_PORT=15432` and `REDIS_PORT=16379` into `.env`: a container cannot publish a port that a
  service on the same machine already uses. Set the ports in `.env` to anything else if you need to
  (`POSTGRES_PORT`, `REDIS_PORT`, `NGINX_PORT`).
* The lab container mounts the host's Docker socket so that `docker` works inside it. That is root-equivalent
  access to the host: use it in a closed training environment only.
* Work files live in `./work`. The nginx container serves `./work/nginx/html` (a placeholder `index.html` is there; put
  your own pages next to it). When the installer copies this folder to `~/labstack` again, it keeps everything that
  is already in `work/`.

Installing the same toolchain directly on an Ubuntu 22.04/24.04 or Debian 12 machine (no container):

    sudo ../lab_install.sh --profile ai --gui        # see "../lab_install.sh --help"

Other Linux distributions: use the container route above.
