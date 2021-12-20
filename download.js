let download_path = "./4_ky2_2021_2022.xlsx";
let download_name = "4_ky2_2021_2022.xlsx";

let download_link = document.getElementById("download-link");
download_link.setAttribute("href", download_path);
download_link.setAttribute("download", download_name);