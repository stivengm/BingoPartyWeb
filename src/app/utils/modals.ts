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

export function infoModal({ title = "", html = "", confirmButtonText = "Entendido" }) {
    return Swal.fire({
        icon: "info",
        title,
        html,
        confirmButtonText,
        confirmButtonColor: "#8333C6",
        allowOutsideClick: false
    });
}
