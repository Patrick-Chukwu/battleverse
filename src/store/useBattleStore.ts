import { create } from "zustand";
import { createBattleActions, emptyBattle, type BattleState } from "@/store/liveBattle";

export type { Rival, BattleState } from "@/store/liveBattle";

export const useBattleStore = create<BattleState>((set, get) => ({
  ...emptyBattle,
  ...createBattleActions(set, get),
}));
