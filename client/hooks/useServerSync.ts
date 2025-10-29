import { useEffect } from "react";
import { apiGet, subscribe, apiPost, apiDelete } from "@/lib/api";
import { useLuna } from "@/store/store";

export default function useServerSync() {
  const hydrate = useLuna((s) => s.hydrateFromServer);
  const setSpin = useLuna((s) => s.setSpinSession);

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const { state } = await apiGet<{ team: string; state: any }>("/api/state");
        if (!stopped) hydrate(state);
      } catch {}
    })();

    const unsub = subscribe((ev) => {
      if (ev.type === "state") {
        hydrate(ev.state);
      } else if (ev.type === "spin") {
        setSpin(ev.payload);
      }
    });

    return () => {
      stopped = true;
      unsub();
    };
  }, [hydrate, setSpin]);
}