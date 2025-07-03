function passwordview() {
  if (document.querySelector("input").type == "password") {
    document.querySelector("input").type = "text";
    document.querySelector("i").classList.remove('fa-eye');
    document.querySelector("i").classList.add('fa-eye-slash');
  } else {
    document.querySelector("input").type = "password";
    document.querySelector("i").classList.remove('fa-eye-slash');
    document.querySelector("i").classList.add('fa-eye');
  }
}