# Course scripts

Every `*.sh` file in this folder is embedded in the VM image (or in the Docker image) and run **once, as the lab
user, at the end of the installation** - after the packages, the Python environment and Docker are in place.
Use them for course material that has to exist on every lab machine, for example the `~/lab` practice folder of
the Linux/Bash course.

* The scripts run with `bash`, without a terminal, with the lab user's home directory as the working directory.
* A script must be idempotent (safe to run twice) and must exit with status 0 when it succeeded.
* The exit status is stored in `/var/lib/lab_course/<name>.status`; `verify_lab` reports a non-zero status as a
  failure and `lab_install.sh` lists the script among the failed items.
* Other files in this folder (data sets, templates, archives) are copied to `/opt/lab/courses/` as well; scripts can read
  them from there. (`lab_install.sh` run by hand from another folder copies them there before it runs the scripts.)

`opsys_code.sh` + `opsys-code.tar.gz` are an example of such a pair: the course code base of MCMP117 / MBLP131
(Fundamentals of Operating Systems, Weeks 2-15, English and Turkish) is unpacked into `~/opsys`; existing files are never
overwritten, `bash /opt/lab/courses/opsys_code.sh --reset` restores the originals. See the main README, section "Course
scripts".

`Build-LabVM.ps1` also picks up `mcmp117_lab_setup.sh` (the MCMP117 / MBLP131 practice-folder generator)
automatically when it is found next to this README, or in a sibling `MBLP131\_build` folder; see the main
README, section "Course scripts".
