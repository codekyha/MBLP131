# demo_lib.sh -- tiny helpers sourced by the Week 15 demo/answer scripts.
# p 'command'  prints the prompt and the command exactly as typed, then runs it.
# sec NAME     starts a new output section (capture.sh splits on these lines
#              into out_NAME.txt; the marker itself is not kept).
p() {
    local rc=$?                 # keep the exit status of the previous command for 'echo $?'
    local d=${PWD/#$HOME/\~}
    echo "student@okan-lab:$d\$ $*"
    ( exit $rc )
    eval "$@" 2>&1
}
sec() { echo "#### $1"; }
