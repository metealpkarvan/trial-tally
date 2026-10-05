export const $ = (id) => document.getElementById(id);
export const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let language = "tr";
if (typeof window !== "undefined")
  try {
    language =
      localStorage.getItem("portfolio:language") === "en" ? "en" : "tr";
  } catch {}
export const lang = () => language;
export const t = (tr, en) => (language === "tr" ? tr : en);
export const uid = () => crypto.randomUUID();
export function notify(message) {
  $("toast").textContent = message;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => ($("toast").textContent = ""), 7000);
}
export function init(render = () => {}) {
  const translate = () => {
    document.documentElement.lang = language;
    if ($("import"))
      $("import").setAttribute("aria-label", t("Yedek yükle", "Import backup"));
    document
      .querySelectorAll("[data-tr]")
      .forEach((el) => (el.textContent = el.dataset[language]));
    $("language").textContent = language === "tr" ? "EN" : "TR";
    $("language").setAttribute(
      "aria-label",
      t("Switch to English", "Türkçeye geç"),
    );
    render();
  };
  $("language").onclick = () => {
    language = language === "tr" ? "en" : "tr";
    try {
      localStorage.setItem("portfolio:language", language);
    } catch {}
    translate();
  };
  translate();
  if ("serviceWorker" in navigator && location.protocol !== "file:")
    navigator.serviceWorker.register("./sw.js").catch(() => {});
}
export function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    notify(
      t(
        "Yerel kayıt başarısız. Yedek indir; bu oturumdaki verin hâlâ kullanılabilir.",
        "Local save failed. Download a backup; your session data is still available.",
      ),
    );
    return false;
  }
}
export function load(key, fallback, validate) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return validate(JSON.parse(raw));
  } catch {
    notify(
      t(
        "Kayıt okunamadı; bozuk verinin üzerine yazılmadı. Önce dışa aktar veya sil.",
        "Saved data could not be read; it has not been overwritten. Export or clear it first.",
      ),
    );
    return fallback;
  }
}
export function download(name, text, type = "text/plain;charset=utf-8") {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function copy(text) {
  if (!text.trim())
    return notify(t("Önce içerik oluştur.", "Create some content first."));
  try {
    await navigator.clipboard.writeText(text);
    notify(t("Panoya kopyalandı.", "Copied to clipboard."));
  } catch {
    notify(
      t(
        "Pano izni yok. Çıktıyı seçip elle kopyalayabilirsin.",
        "Clipboard unavailable. Select the output and copy it manually.",
      ),
    );
  }
}
export function backup(kind, data) {
  download(
    `${kind}-backup.json`,
    JSON.stringify({ kind, version: 1, data }, null, 2),
    "application/json",
  );
}
export async function readBackup(file, kind, validate) {
  if (!file || file.size > 1000000)
    throw new Error(
      t("En fazla 1 MB JSON dosyası seç.", "Choose a JSON file up to 1 MB."),
    );
  const parsed = JSON.parse(await file.text());
  if (parsed.kind !== kind || parsed.version !== 1)
    throw new Error(
      t(
        "Bu uygulamaya ait sürüm 1 yedeği gerekli.",
        "A version 1 backup for this app is required.",
      ),
    );
  return validate(parsed.data);
}
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function text(value, limit = 10000) {
  if (typeof value !== "string" || value.length > limit)
    throw new Error("Invalid text field");
  return value;
}
export function array(value, max = 200) {
  if (!Array.isArray(value) || value.length > max)
    throw new Error("Invalid record list");
  return value;
}
export function bindImport(kind, validate, apply) {
  const input = $("import");
  if (!input) return;
  input.onchange = async () => {
    try {
      const next = await readBackup(input.files[0], kind, validate);
      if (
        confirm(
          t(
            "Bu yedek mevcut kayıtların yerini alacak. Devam?",
            "This backup will replace your current records. Continue?",
          ),
        )
      ) {
        apply(next);
        notify(t("Yedek yüklendi.", "Backup restored."));
      }
    } catch (error) {
      notify(error.message);
    } finally {
      input.value = "";
    }
  };
}
