if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").then(function (reg) {
      if (reg.update) reg.update();
    }).catch(function () {});
  });
}
