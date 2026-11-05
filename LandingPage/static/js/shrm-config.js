/* Public release configuration. No keys, credentials, or purchase tokens here.
   Eight supplied carousel screenshots are installed. Keep resultReady false until the certification image is supplied.
   Only set a download URL after checking that it serves the matching platform. */
window.WMOL_SHRM_CONFIG = Object.freeze({
  screenshotsReady: true,
  resultReady: false,
  assetBase: "/static/img/shrm/",
  resultFile: "shrm-result.png",
  downloads: Object.freeze({iPhone: "https://apps.apple.com/us/app/wmol-shrm/id6808857064", Android: "", Windows: "https://apps.microsoft.com/detail/9N73MTW43T3K?hl=en-us&gl=US&ocid=pdpshare", macOS: "https://apps.apple.com/us/app/wmol-shrm/id6808857064"})
});
