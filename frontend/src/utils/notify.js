let container = null;
const activeToasts = new Set();
const MAX_TOASTS = 4;

function ensureContainer() {
  if (container && document.body.contains(container)) {
    return container;
  }

  container = document.createElement("div");
  container.id = "app-toast-container";
  container.style.position = "fixed";
  container.style.top = "18px";
  container.style.left = "50%";
  container.style.transform = "translateX(-50%)";
  container.style.zIndex = "99999";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.gap = "10px";
  container.style.width = "min(92vw, 620px)";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);
  return container;
}

function tone(type) {
  if (type === "success") {
    return {
      icon: "CHECK",
      bg: "#ecfdf5",
      color: "#065f46",
      border: "#6ee7b7",
      bar: "#10b981"
    };
  }

  if (type === "error") {
    return {
      icon: "ERROR",
      bg: "#fef2f2",
      color: "#991b1b",
      border: "#fca5a5",
      bar: "#ef4444"
    };
  }

  return {
    icon: "INFO",
    bg: "#eff6ff",
    color: "#1e3a8a",
    border: "#93c5fd",
    bar: "#3b82f6"
  };
}

function removeToast(toast) {
  if (!toast || !toast.parentElement) return;

  toast.style.opacity = "0";
  toast.style.transform = "translateY(-8px) scale(0.98)";
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
    activeToasts.delete(toast);
  }, 180);
}

export function notify(message, type = "info", options = {}) {
  if (!message || typeof document === "undefined") return;

  const root = ensureContainer();
  const colors = tone(type);
  const duration = Number.isFinite(options.duration) ? options.duration : 3200;

  if (activeToasts.size >= MAX_TOASTS) {
    const first = root.firstChild;
    if (first) removeToast(first);
  }

  const toast = document.createElement("div");
  activeToasts.add(toast);

  toast.setAttribute("role", "status");
  toast.style.pointerEvents = "auto";
  toast.style.width = "100%";
  toast.style.background = colors.bg;
  toast.style.color = colors.color;
  toast.style.border = `1px solid ${colors.border}`;
  toast.style.borderRadius = "14px";
  toast.style.padding = "12px 14px 10px";
  toast.style.boxShadow = "0 14px 34px rgba(15, 23, 42, 0.18)";
  toast.style.backdropFilter = "blur(6px)";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-10px) scale(0.98)";
  toast.style.transition = "all 180ms ease";

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "flex-start";
  row.style.justifyContent = "space-between";
  row.style.gap = "12px";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.gap = "10px";
  left.style.alignItems = "flex-start";
  left.style.minWidth = "0";

  const icon = document.createElement("div");
  icon.textContent = colors.icon;
  icon.style.fontSize = "11px";
  icon.style.fontWeight = "700";
  icon.style.letterSpacing = "0.04em";
  icon.style.paddingTop = "2px";
  icon.style.flexShrink = "0";

  const text = document.createElement("div");
  text.textContent = String(message);
  text.style.fontSize = "14px";
  text.style.fontWeight = "500";
  text.style.lineHeight = "1.35";
  text.style.wordBreak = "break-word";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "x";
  closeBtn.setAttribute("aria-label", "Dismiss notification");
  closeBtn.style.border = "none";
  closeBtn.style.background = "transparent";
  closeBtn.style.color = colors.color;
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.lineHeight = "1";
  closeBtn.style.opacity = "0.75";
  closeBtn.style.padding = "0";
  closeBtn.onclick = () => removeToast(toast);

  const progress = document.createElement("div");
  progress.style.height = "3px";
  progress.style.borderRadius = "999px";
  progress.style.background = colors.bar;
  progress.style.marginTop = "10px";
  progress.style.width = "100%";
  progress.style.transformOrigin = "left center";
  progress.style.transform = "scaleX(1)";
  progress.style.transition = `transform ${duration}ms linear`;

  left.appendChild(icon);
  left.appendChild(text);
  row.appendChild(left);
  row.appendChild(closeBtn);
  toast.appendChild(row);
  toast.appendChild(progress);
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0) scale(1)";
    progress.style.transform = "scaleX(0)";
  });

  setTimeout(() => removeToast(toast), duration + 60);
}
