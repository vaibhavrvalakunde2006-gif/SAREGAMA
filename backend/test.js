
const { Innertube, Platform } = require("youtubei.js");
Platform.shim.eval = (data, env) => {
  const code = data.output + "\nreturn { ...env }";
  return new Function("env", code)(env);
};
async function run() {
  try {
    const yt = await Innertube.create({ clientType: "ANDROID", generate_session_locally: true });
    const id = "8ckDmB63Y6w";
    const info = await yt.music.getInfo(id);
    const format = info.chooseFormat({ type: "audio", quality: "best", format: "mp4" });
    const url = await format.decipher(yt.session.player);
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "com.google.android.youtube/18.43.45 (Linux; U; Android 13; en_US; Pixel 7 Pro Build/TQ3A.230901.001)"
      }
    });
    console.log("Fetch status with Android UA:", res.status);
  } catch (e) {
    console.error(e);
  }
}
run();

