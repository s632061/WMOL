/* Public release configuration. No keys, credentials, or purchase tokens here.
   Add the actual images before setting screenshotsReady/resultReady to true.
   Only set a download URL after checking that it serves the matching platform. */
window.WMOL_SHRM_CONFIG = Object.freeze({
  screenshotsReady: false,
  resultReady: false,
  assetBase: "/static/img/shrm/",
  resultFile: "shrm-result.png",
  downloads: Object.freeze({iPhone: "", Android: "", Windows: "", macOS: ""})
});
