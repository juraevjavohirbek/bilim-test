import { useCallback, useEffect, useRef, useState } from "react";

// O‘yin va uning ichidagi modal bir paytda kattalashtirilishi mumkin.
const expandedViews = new Set();
let managedNativeFullscreen = false;

function release(owner) {
  expandedViews.delete(owner);
  if (!expandedViews.size && managedNativeFullscreen && document.fullscreenElement) {
    managedNativeFullscreen = false;
    document.exitFullscreen().catch(() => {});
  }
}

export default function useFullscreen() {
  const owner = useRef(Symbol("fullscreen-view"));
  const active = useRef(false);
  const wasNative = useRef(false);
  const escapeCancelledAt = useRef(0);
  const [expanded, setExpanded] = useState(false);

  const collapse = useCallback((fromEscape = false) => {
    if (fromEscape && active.current) escapeCancelledAt.current = Date.now();
    active.current = false;
    wasNative.current = false;
    setExpanded(false);
    release(owner.current);
  }, []);

  function toggle() {
    if (active.current) { collapse(); return; }
    active.current = true;
    wasNative.current = Boolean(document.fullscreenElement);
    expandedViews.add(owner.current);
    setExpanded(true);
    // Dialogning o‘zini requestFullscreen qilish mumkin emas; html ishlatiladi.
    // Qo‘llamaydigan telefonlarda ham CSS butun ko‘rinadigan ekranni to‘ldiradi.
    if (!document.fullscreenElement && document.fullscreenEnabled) {
      managedNativeFullscreen = true;
      document.documentElement.requestFullscreen().then(() => {
        if (!expandedViews.size) release(owner.current);
      }).catch(() => { managedNativeFullscreen = false; });
    }
  }

  useEffect(() => {
    const id = owner.current;
    function changed() {
      if (!document.fullscreenElement) managedNativeFullscreen = false;
      if (!active.current) return;
      if (document.fullscreenElement) wasNative.current = true;
      else if (wasNative.current) collapse(true);
    }
    function escape(event) {
      if (event.key !== "Escape" || !active.current) return;
      // Ichkaridagi kattalashtirilgan modal birinchi bo‘lib yopishsin.
      if ([...expandedViews].at(-1) !== id) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      collapse(true);
    }
    document.addEventListener("fullscreenchange", changed);
    document.addEventListener("keydown", escape, true);
    return () => {
      active.current = false;
      document.removeEventListener("fullscreenchange", changed);
      document.removeEventListener("keydown", escape, true);
      release(id);
    };
  }, [collapse]);

  function consumeEscape() {
    const recent = Date.now() - escapeCancelledAt.current < 400;
    escapeCancelledAt.current = 0;
    return recent;
  }

  return { expanded, toggle, collapse, consumeEscape };
}
