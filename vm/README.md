# MCMP117 / MBLP131 Lab VM Kit

One minimal Ubuntu Server 24.04 virtual machine for Oracle VirtualBox that contains everything needed for the Linux/Bash practical (weeks 9-14), delivered as a ready-to-use `.vdi` disk (and, as an alternative, a single `.ova` file), with a one-double-click deployment to every lab machine.

The finished images are already in this folder (built and tested on 22 October 2026; see "Validation status"). The build only has to be repeated when the software list or the account settings change.

## Quick start for a lab machine

1. Install Oracle VirtualBox (7.x) on the machine.
2. Copy these files to the machine (USB stick or network share): `MCMP117-Lab.vdi`, `MCMP117-Lab.vdi.sha256`, `MCMP117-Lab.config`, `Deploy-LabVM.cmd`, `Deploy-LabVM.ps1`, `Reset-LabVM.cmd`.
3. Double-click `Deploy-LabVM.cmd`. After about a minute the VM window shows a login prompt `lab-xxxx login:`.
4. Log in with user `user`, password `1234`. On the first machine, run `verify_lab` once (acceptance test).

To bring a machine back to the pristine state later, double-click `Reset-LabVM.cmd` (it deletes the existing lab VM and creates a fresh one).

## Contents

| File | Purpose |
|---|---|
| `MCMP117-Lab.vdi`, `MCMP117-Lab.vdi.sha256`, `MCMP117-Lab.config` | The finished lab disk (about 2.5 GB, 20 GB virtual size), its checksum, and the VM settings that belong to it |
| `MCMP117-Lab.ova`, `MCMP117-Lab.ova.sha256` | The same machine as one appliance file (about 0.85 GB); alternative route |
| `Deploy-LabVM.cmd`, `Deploy-LabVM.ps1` | Double-click launcher and script: creates the VM from the VDI (default) or the OVA, sets the network mode, starts the VM and checks that it comes up |
| `Reset-LabVM.cmd` | Replaces the lab VM on this computer with a fresh copy; everything stored in the old VM is lost |
| `Build-LabVM.cmd`, `Build-LabVM.ps1` | Rebuilds the images: downloads the official Ubuntu cloud image, provisions it unattended, exports VDI and OVA; progress is logged to `Build-LabVM.log` |
| `lab_install.sh` | Package and configuration installer (runs inside the VM during the build; can also be run by hand on any Ubuntu) |
| `verify_lab.sh` | Acceptance test; embedded in the image as `verify_lab` |
| `seed/user-data.template`, `seed/meta-data` | cloud-init configuration used by the build (account, password, hostname, clone safety) |
| `lab-seed.iso` | Prebuilt seed ISO (fallback; see Troubleshooting) |
| `mcmp117_lab_setup.sh` | Not stored here. The course lab-folder generator is taken from `..\_build\mcmp117_lab_setup.sh` (or from this folder, or from `-LabSetupScript`) and embedded into the image during the build |

## Requirements

- Lab machines: Windows with Oracle VirtualBox 7.x, 4 GB RAM or more (the VM uses 2 GB by default), about 6 GB free disk space (the VM disk grows on demand up to 20 GB). No internet access is needed.
- Build machine (only for rebuilding): Windows 10/11, Windows PowerShell 5.1 or later, Oracle VirtualBox 6.1 or later (7.x recommended), internet access, about 10 GB free disk space. Working files (several GB) are kept in `%LOCALAPPDATA%\MCMP117-LabBuild`.
- Prefer running the kit from a local folder. If it lies inside a OneDrive-synchronised folder, the multi-gigabyte images are uploaded to OneDrive.

## 1. Deploy to each lab machine

Double-click `Deploy-LabVM.cmd`, or run in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Deploy-LabVM.ps1
```

The script verifies the checksum, creates a new VM with its own copy of the disk (new disk UUID and MAC address) in VirtualBox's default machine folder, so the original VDI stays untouched and can be reused for the next machine, starts it, and then waits (up to 150 s) until the guest has an address and its SSH server answers. It reports `Guest is up and sshd answers on port 2222: SSH-2.0-OpenSSH_...` or, if the machine is slow, a warning to look at the VM window. No login is attempted by the script.

| Option | Effect |
|---|---|
| `-Source Auto\|Vdi\|Ova` | Disk source; `Auto` uses the VDI when present, otherwise the OVA |
| `-VMName <name>` | VM name (default `MCMP117-Lab-<COMPUTERNAME>`) |
| `-VMFolder <path>` | Folder for the new VM (default: VirtualBox's machine folder) |
| `-MemoryMB`, `-Cpus` | Resources (default 2048 MB, 2 CPUs) |
| `-SshPort <n>` | Host port forwarded to guest SSH in NAT mode (default 2222) |
| `-BridgeAdapter "<name>"` | Bridged networking on the lab LAN; list names with `-ListAdapters` |
| `-Headless`, `-NoStart` | Start without a window / do not start |
| `-NoWait`, `-WaitSeconds <n>` | Skip the start-up check / change its time limit (default 150) |
| `-Force` | Replace an existing VM of the same name (`Reset-LabVM.cmd` uses this) |

SSH from the host in NAT mode: `ssh -p 2222 user@127.0.0.1`. In bridged mode the script prints the guest address when the guest utilities report it; otherwise use `ip -br a` on the VM console.

Manual alternative: VirtualBox, File > Import Appliance, select the OVA. In that case NAT is used without port forwarding; add a rule in Settings > Network > Advanced > Port Forwarding if SSH is needed.

## 2. Acceptance test (once, on the first machine)

Log in as `user` / `1234` and run:

```bash
verify_lab
```

The test is installed in the image (`/usr/local/bin/verify_lab`). It checks the commands, manual pages, locales, SSH, network, the `ptrace` setting, free disk space, the unique hostname and, if present, the status of the course lab script; the exit status is 0 only when every check passes.

## 3. Rebuild the images (optional)

Needed only after changing `lab_install.sh`, `seed/user-data.template` or the course lab script. Double-click `Build-LabVM.cmd`, or run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Build-LabVM.ps1
```

The script downloads the Ubuntu image (about 550 MB, cached afterwards) and verifies its SHA-256, builds the cloud-init seed ISO, imports the image into VirtualBox, enlarges the disk to 20 GB, boots the VM, waits until cloud-init has installed the software and powered the VM off, then writes `MCMP117-Lab.vdi` (with `.sha256` and `MCMP117-Lab.config`) and `MCMP117-Lab.ova` next to the script and deletes the temporary VM. In the test run the provisioning took about 7 minutes; allow 10-25 minutes depending on the connection. The launcher shows the VM console (`-ShowGui`), which stays on kernel messages for the whole run (Ubuntu cloud images log to the serial port); this is normal.

Other switches: `-NoOva` (VDI only), `-NoPause`, `-DiskGB 30`, `-MemoryMB 4096`, `-Cpus 4`, `-LabSetupScript <path>`, `-KeepVM`, `-Force` (replace a leftover build VM), `-Series jammy` (Ubuntu 22.04 instead).

The VM powers itself off only if `lab_install.sh` and the clone-preparation step both succeeded. If it is still running after the timeout, provisioning failed; see Troubleshooting.

## Defaults

| Item | Value |
|---|---|
| Base image | Ubuntu Server 24.04 LTS cloud image (text console, no desktop) |
| Account | `user` / `1234`, member of `sudo` with passwordless sudo (root login stays locked) |
| Hostname | `mcmp117-lab` in the base image; each deployed copy renames itself to `lab-<last 4 hex digits of its MAC>` on first boot |
| Time zone, locales | `Europe/Istanbul`; `en_US.UTF-8` (default) and `tr_TR.UTF-8` generated; US keyboard layout |
| Network | NAT with DHCP; host port 2222 forwarded to guest SSH |
| SSH | Enabled, password login allowed |
| Debugging | `kernel.yama.ptrace_scope = 0` so that `gdb` and `strace` can attach to the user's own processes |
| VM hardware | 2 GB RAM, 2 CPUs, 20 GB dynamic disk on SATA, VBoxSVGA display, BIOS firmware, RTC in UTC |

The password is shared and trivial by design for the lab. Change it in `seed/user-data.template` (and rebuild), or run `passwd` inside a machine.

## Installed software (profile `core`)

`bash` and the GNU core utilities (`coreutils`, `findutils`, `grep`, `sed`, `gawk`, `diffutils`, `tar`, `gzip`, `bzip2`, `xz`, `zip`, `unzip`, `rsync`), `less`, `file`, `tree`, `bc`, `jq`, `vim`, `nano`, `tmux`, `man-db` with `manpages-dev` (manual pages are restored if the image shipped without them), `build-essential`, `gdb`, `strace`, `procps`, `psmisc`, `lsof`, `htop`, `sysstat`, network basics (`iproute2`, `net-tools`, `ping`, `dig`, `curl`, `wget`, `netcat`, `traceroute`), `git`, `python3`, and the VirtualBox guest utilities. The course lab folder (`~/lab`, created by `mcmp117_lab_setup.sh`) is part of the image.

The `full` profile (`LAB_PROFILE=full`, the default when `lab_install.sh` is run by hand) adds `g++`, `cmake`, `valgrind`, `ltrace`, POSIX manual pages, `shellcheck`, `dos2unix`, `stress-ng`, `iotop`, `iftop`, `cpulimit`, `screen`, `moreutils`, `pv`, `perf` tooling and `pip`/`venv`. To use it in the VM, change `LAB_PROFILE=core` to `LAB_PROFILE=full` in the `runcmd` line of `seed/user-data.template` and rebuild.

## Customisation

- Packages: edit the lists at the top of `lab_install.sh`.
- Account, password, hostname, time zone, Turkish keyboard (`SET_TR_KEYMAP=1` in the `runcmd` line): edit `seed/user-data.template`.
- Both files are re-embedded on every build, so no manual encoding is needed. Keep LF line endings (the script normalises them).

## How the clones stay distinct

A cloud image normally configures itself once. For an image that is copied many times the build therefore also:

1. replaces cloud-init's MAC-pinned network profile with a generic DHCP profile (otherwise a copy with a new MAC has no network);
2. empties `/etc/machine-id` and deletes the SSH host keys, so each copy generates its own (a small `ssh.service` drop-in creates missing host keys before `sshd` starts; this also prevents duplicate DHCP client identities on a bridged network);
3. installs a one-shot service that assigns the unique hostname;
4. disables cloud-init afterwards, so it does not recreate its default `ubuntu` user.

## Troubleshooting

| Symptom | Action |
|---|---|
| "running scripts is disabled" | Run with `-ExecutionPolicy Bypass` as shown (the `.cmd` launchers do this), and `Unblock-File .\*.ps1` once |
| `VBoxManage.exe not found` | Install VirtualBox (`winget install Oracle.VirtualBox`) or add its folder to `PATH` |
| Deploy: "No answer from the guest yet" | The first boot can take a minute longer; look at the VM window. If there is no login prompt, run `Reset-LabVM.cmd` once. If the prompt is there, SSH may be blocked by a firewall or the port is in use: use another `-SshPort` |
| Deploy: "A VM named ... already exists" | Use `Reset-LabVM.cmd` (or `-Force`) to replace it, or `-VMName` for a second copy |
| Port 2222 already used by another VM | Deploy with another `-SshPort` |
| Build: warning "Could not build the seed ISO" | The build falls back to `lab-seed.iso`, which lacks `mcmp117_lab_setup.sh`. To regenerate a complete one on Linux or WSL: render `seed/user-data.template` (replace the `@@...@@` tokens with the base64 of the corresponding scripts, or an empty string for the optional lab script), then `genisoimage -output lab-seed.iso -volid cidata -joliet -rock user-data meta-data` |
| Build times out (VM never powers off) | Re-run with `-ShowGui -Force`, log in as `user`, read `/var/log/lab_firstboot.log` and `/var/log/cloud-init-output.log`. A common cause is no internet access from the NAT adapter |
| Build: download is interrupted | Re-run; the cached file is checked against the published SHA-256 and replaced when it differs |
| VM is very slow, or VirtualBox reports a native-API (NEM) message | Hyper-V/WSL2 is active on the host. Use VirtualBox 7.1 or later, or disable "Windows Hypervisor Platform" and "Virtual Machine Platform" |
| Copy has no network | Check `ip -br a` and `ls /etc/netplan` (expect `01-lab-dhcp.yaml`); `sudo netplan apply` |
| Turkish characters or keys wrong | `sudo localectl set-keymap tr`; for UTF-8 output use `export LANG=tr_TR.UTF-8` |

## Validation status

Executed on 22 October 2026 on a Windows 11 machine with Oracle VirtualBox 7.2.22 and Windows PowerShell 5.1:

- Complete build: download and SHA-256 verification of the Ubuntu image, seed ISO creation (Windows IMAPI2), import, disk enlargement, unattended provisioning (7 minutes), export of the VDI and the OVA with checksums, removal of the temporary VM. The VM powered itself off, which by construction means `lab_install.sh` and the clone preparation succeeded.
- Offline inspection of the finished VDI: GPT layout with the root file system grown to 19 GB; account `user` (UID 1000, group `sudo`) whose password hash matches `1234`; root locked and no `ubuntu` account; 719 installed packages, including all packages of the core profile (the install log lists no skipped package); `en_US` and `tr_TR` locales in the locale archive; `ptrace_scope = 0` configuration; SSH drop-ins (`PasswordAuthentication yes` is read first); no SSH host keys and an empty machine-id; generic DHCP network profile; first-boot service enabled; the course lab folder created with `lab_setup.status` = 0.
- Deployment from the VDI with `Deploy-LabVM.cmd` and replacement with `Reset-LabVM.cmd` (`-Force`): the copy boots, shows its own hostname (`lab-504e`, then `lab-3695` for the second copy), obtains an address by DHCP, and its SSH server answers on the forwarded port with `SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.20`.
- Before the runs: PowerShell syntax (PowerShell 7.4), seed rendering, YAML, `shellcheck` on all shell scripts including those embedded in the seed, and the ISO structure.

Defects found by these runs and corrected in this version: the `.config` file was written on one line (now one setting per line; `Deploy-LabVM.ps1` accepts both forms), and the VMSVGA display adapter made the Ubuntu kernel print `vmwgfx` error lines on the console (the deployed VM now uses VBoxSVGA).

Not executed: `verify_lab` inside the running VM (it needs an interactive login; run it once after the first deployment), the OVA deployment route, bridged networking, UEFI firmware, other VirtualBox versions, and a machine other than the build machine. The VirtualBox guest utilities are installed, but cloud images use a minimal kernel; shared folders and clipboard integration are not guaranteed, and the course does not depend on them.

## References

- https://documentation.ubuntu.com/public-images/public-images-how-to/run-an-ova-using-virtualbox
- https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.ova
- https://docs.cloud-init.io/en/latest/reference/datasources/nocloud.html
