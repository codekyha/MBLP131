# LabVM lab container - the same toolchain as the VM image, for any Linux host (or Docker Desktop) with Docker.
#
# The container is built by the same installer as the VM (lab_install.sh), so there is one package list.
# The build context is the kit folder (the parent of docker/), because the installer lives there:
#
#     docker build -f docker/Dockerfile -t labvm/lab:2026 .
#     docker build -f docker/Dockerfile --build-arg LAB_PROFILE=full -t labvm/lab:lite .       # no Python/AI
#     docker build -f docker/Dockerfile --build-arg LAB_INSTALL_ARGS="--skip-docker --skip-ollama --skip-torch" .
#
# Or let Compose do it:  docker compose --profile lab up -d --build   (see docker/README.md)
FROM ubuntu:24.04

ARG LAB_PROFILE=ai
ARG LAB_INSTALL_ARGS="--skip-docker --skip-ollama"
ARG USERNAME=user
ARG USER_UID=1000
ARG USER_GID=1000

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/opt/lab/venv \
    PATH=/opt/lab/venv/bin:$PATH

# The Ubuntu base image ships an "ubuntu" account with UID 1000; the lab account takes its place.
RUN (userdel -r ubuntu 2>/dev/null || true) \
 && groupadd -g "${USER_GID}" "${USERNAME}" \
 && useradd -m -u "${USER_UID}" -g "${USER_GID}" -s /bin/bash "${USERNAME}" \
 && mkdir -p /work && chown "${USER_UID}:${USER_GID}" /work

COPY lab_install.sh verify_lab.sh /opt/lab/
COPY courses/ /opt/lab/courses/
COPY docker/ /opt/lab/docker/

# LAB_IMAGE_BUILD=1: services are not started while packages are installed. LAB_CONTAINER=1: no Docker engine,
# hypervisor guest tools or system services. ENABLE_SSH=0: no sshd in a container.
RUN chmod +x /opt/lab/*.sh \
 && LAB_IMAGE_BUILD=1 LAB_CONTAINER=1 ENABLE_SSH=0 LAB_USER="${USERNAME}" LAB_PROFILE="${LAB_PROFILE}" \
    /opt/lab/lab_install.sh ${LAB_INSTALL_ARGS} \
 && rm -rf /var/lib/apt/lists/* /tmp/* /root/.cache

USER ${USERNAME}
WORKDIR /work

EXPOSE 8888 8000 8501 5000

# Default: JupyterLab. The token comes from the JUPYTER_TOKEN environment variable.
CMD ["bash", "-lc", "jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --ServerApp.token=\"${JUPYTER_TOKEN:-lab}\" --ServerApp.root_dir=/work"]
