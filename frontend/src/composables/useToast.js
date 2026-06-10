import { reactive } from "vue";

const state = reactive({
  toasts: [],
});

let nextId = 0;

function dismiss(id) {
  const idx = state.toasts.findIndex((t) => t.id === id);
  if (idx !== -1) state.toasts.splice(idx, 1);
}

function push(type, message, options = {}) {
  const id = ++nextId;
  const duration = options.duration ?? 4000;
  state.toasts.push({ id, type, message });
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

export const toast = {
  success: (msg, opts) => push("success", msg, opts),
  error: (msg, opts) => push("error", msg, opts),
  info: (msg, opts) => push("info", msg, opts),
  warning: (msg, opts) => push("warning", msg, opts),
  dismiss,
};

export function useToast() {
  return { toasts: state.toasts, toast };
}
