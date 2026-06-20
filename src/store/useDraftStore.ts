import { create } from "zustand";
import type { DraftResponse, Media } from "@/types";
import type { ProviderName } from "@/lib/llm/types";

interface DraftState {
  templateId: string;
  media: Media;
  provider: ProviderName;
  variables: Record<string, string>;
  result: DraftResponse | null;
  loading: boolean;
  error: string | null;

  setTemplate: (templateId: string, media: Media) => void;
  setProvider: (provider: ProviderName) => void;
  setVariable: (key: string, value: string) => void;
  setResult: (result: DraftResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  templateId: "tech-explainer",
  media: "zenn",
  provider: "ollama",
  variables: {},
  result: null,
  loading: false,
  error: null,

  setTemplate: (templateId, media) => set({ templateId, media }),
  setProvider: (provider) => set({ provider }),
  setVariable: (key, value) =>
    set((s) => ({ variables: { ...s.variables, [key]: value } })),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ variables: {}, result: null, error: null }),
}));
