import Swal from 'sweetalert2'

export function errorModal({ title = "", html = "" }) {
    return Swal.mixin({
        toast: true,
        position: "top",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    }).fire({
        icon: "error",
        html: html,
        title: title
    })
}