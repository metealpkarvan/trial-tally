import {
  $,
  esc,
  t,
  uid,
  lang,
  init,
  notify,
  load,
  save,
  backup,
  bindImport,
  download,
  safeUrl,
} from "./ui.js";
import {
  empty,
  validate,
  validateTrial,
  localToday,
  decisionDate,
  urgency,
  twelveMonths,
  calendar,
  shiftDate,
} from "./core.js";
const KEY = "trial-tally:v1";
let state = load(KEY, empty(), validate),
  editing = null;
const money = (c) =>
  new Intl.NumberFormat(lang() === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: c.currency,
  }).format(twelveMonths(c));
const label = (c) =>
  ({
    upcoming: t("Karar günü yaklaşacak", "Upcoming"),
    "decide-now": t("Karar zamanı", "Decision time"),
    "past-deadline": t(
      "Tarih geçti; koşulları kontrol et",
      "Date passed; check terms",
    ),
    cancelled: t("İptali sen doğruladın", "Cancellation verified by you"),
    kept: t("Devam etmeyi seçtin", "You chose to keep it"),
  })[urgency(c, localToday())];
function render() {
  const active = state.trials.filter((c) => c.status === "active");
  $("active-count").textContent = active.length;
  $("due-count").textContent = active.filter((c) =>
    ["decide-now", "past-deadline"].includes(urgency(c, localToday())),
  ).length;
  $("trials").innerHTML =
    [...state.trials]
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .map(
        (c) =>
          '<article class="record"><div class="bar"><h3>' +
          esc(c.name) +
          '</h3><span class="tag">' +
          label(c) +
          '</span></div><div class="row"><div><span class="hint">' +
          t("Karar günün", "Your review date") +
          "</span><h2>" +
          decisionDate(c) +
          '</h2></div><div><span class="hint">' +
          t("Kaydettiğin son tarih", "Recorded deadline") +
          "</span><h2>" +
          c.deadline +
          "</h2></div></div><p>" +
          t("12 ay bu sabit fiyatla: ", "12 months at this fixed price: ") +
          "<strong>" +
          money(c) +
          '</strong></p><p class="hint">' +
          t("Taahhüt: ", "Commitment: ") +
          {
            unknown: t("Kontrol edilmedi", "Not checked"),
            monthly: t("Aylık", "Monthly"),
            "annual-monthly": t(
              "Yıllık, aylık ödemeli",
              "Annual, paid monthly",
            ),
            annual: t("Yıllık", "Annual"),
          }[c.commitment] +
          '</p><div class="stack">' +
          ["terms", "route", "proof"]
            .map(
              (key) =>
                '<label class="check"><input type="checkbox" data-check="' +
                key +
                '" data-id="' +
                esc(c.id) +
                '" ' +
                (c.checks[key] ? "checked" : "") +
                " " +
                (c.status !== "active" ? "disabled" : "") +
                ">" +
                {
                  terms: t(
                    "Süre, saat dilimi ve taahhüt koşullarını okudum",
                    "I checked the deadline, time zone and commitment",
                  ),
                  route: t(
                    "İptal yolunu buldum",
                    "I located the cancellation route",
                  ),
                  proof: t(
                    "İptal onayı/makbuzunu kaydettim",
                    "I saved cancellation confirmation or a receipt",
                  ),
                }[key] +
                "</label>",
            )
            .join("") +
          '</div><p class="hint">' +
          esc(c.note) +
          "</p>" +
          (safeUrl(c.url)
            ? '<a href="' +
              esc(safeUrl(c.url)) +
              '" target="_blank" rel="noopener noreferrer">' +
              t("Hesap sayfasını aç", "Open account page") +
              " ↗</a>"
            : "") +
          '<div class="toolbar"><button data-edit="' +
          esc(c.id) +
          '">' +
          t("Düzenle / onay notu ekle", "Edit / add confirmation note") +
          "</button>" +
          (c.status === "active"
            ? '<button data-status="cancelled" data-id="' +
              esc(c.id) +
              '">' +
              t("İptali doğrula", "Verify cancellation") +
              '</button><button data-status="kept" data-id="' +
              esc(c.id) +
              '">' +
              t("Devam edeceğim", "Keep subscription") +
              "</button>"
            : '<button data-status="active" data-id="' +
              esc(c.id) +
              '">' +
              t("Tekrar aç", "Reopen") +
              "</button>") +
          '<button class="quiet danger" data-delete="' +
          esc(c.id) +
          '">' +
          t("Sil", "Delete") +
          "</button></div></article>",
      )
      .join("") ||
    '<div class="empty">' +
      t(
        "Henüz deneme yok. Son tarih ve bir karar tamponu ekle.",
        "No trials yet. Add a deadline and a decision buffer.",
      ) +
      "</div>";
}
$("trials").onchange = (event) => {
  const key = event.target.dataset.check,
    id = event.target.dataset.id;
  if (!key) return;
  const c = state.trials.find((c) => c.id === id);
  c.checks[key] = event.target.checked;
  save(KEY, state);
};
$("trials").onclick = (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  if (b.dataset.delete) {
    state.trials = state.trials.filter((c) => c.id !== b.dataset.delete);
    if (editing === b.dataset.delete) reset();
    save(KEY, state);
    render();
  }
  if (b.dataset.edit) {
    const c = state.trials.find((c) => c.id === b.dataset.edit);
    editing = c.id;
    for (const key of [
      "name",
      "deadline",
      "buffer",
      "price",
      "currency",
      "billing",
      "commitment",
      "url",
      "note",
    ])
      $(key).value = c[key];
    $("cancel-edit").hidden = false;
    $("add").textContent = t("Kiti güncelle", "Update kit");
    $("name").focus();
  }
  if (b.dataset.status) {
    const c = state.trials.find((c) => c.id === b.dataset.id);
    try {
      const updated = validateTrial({ ...c, status: b.dataset.status });
      state.trials = state.trials.map((c) =>
        c.id === updated.id ? updated : c,
      );
      save(KEY, state);
      render();
    } catch (error) {
      notify(
        t(
          "İptali doğrulamak için onay/makbuz kutusunu işaretle ve düzenleyerek bir onay notu ekle.",
          "To verify cancellation, check the confirmation box and add a receipt note using Edit.",
        ),
      );
    }
  }
};
function reset() {
  editing = null;
  $("trial-form").reset();
  $("cancel-edit").hidden = true;
  $("add").textContent = t("Çıkış kiti oluştur", "Create exit kit");
}
$("cancel-edit").onclick = reset;
$("trial-form").onsubmit = (event) => {
  event.preventDefault();
  try {
    if (!editing && state.trials.length >= 100)
      throw new Error("Maximum 100 trials");
    const old = state.trials.find((c) => c.id === editing);
    const fields = {};
    for (const key of [
      "name",
      "deadline",
      "currency",
      "billing",
      "commitment",
      "url",
      "note",
    ])
      fields[key] = $(key).value.trim();
    fields.buffer = Number($("buffer").value);
    fields.price = Number($("price").value);
    const c = validateTrial({
      ...fields,
      id: editing || uid(),
      status: old?.status || "active",
      checks: old?.checks || { terms: false, route: false, proof: false },
    });
    if (editing)
      state.trials = state.trials.map((old) => (old.id === editing ? c : old));
    else state.trials.push(c);
    save(KEY, state);
    reset();
    render();
  } catch (error) {
    notify(error.message);
  }
};
$("calendar").onclick = () =>
  state.trials.some((c) => c.status === "active")
    ? download(
        "trial-tally.ics",
        calendar(state.trials),
        "text/calendar;charset=utf-8",
      )
    : notify(t("Önce aktif bir deneme ekle.", "Add an active trial first."));
$("backup").onclick = () => backup("trial-tally", state);
function apply(next) {
  state = next;
  reset();
  save(KEY, state);
  render();
}
bindImport("trial-tally", validate, apply);
$("clear").onclick = () => {
  if (
    confirm(
      t(
        "Tüm yerel deneme kayıtları silinsin mi?",
        "Clear all local trial records?",
      ),
    )
  )
    apply(empty());
};
$("demo").onclick = () => {
  if (
    state.trials.length &&
    !confirm(
      t(
        "Kurgusal örnekle değiştirilsin mi?",
        "Replace with a fictional sample?",
      ),
    )
  )
    return;
  apply({
    trials: [
      validateTrial({
        id: uid(),
        name: "Fictional Design Studio",
        deadline: shiftDate(localToday(), 5),
        buffer: 2,
        price: 15,
        currency: "USD",
        billing: "monthly",
        commitment: "annual-monthly",
        url: "",
        note: "Fictional sample. Verify the provider time zone and keep a receipt before marking cancellation.",
        status: "active",
        checks: { terms: false, route: false, proof: false },
      }),
    ],
  });
};
init(render);
