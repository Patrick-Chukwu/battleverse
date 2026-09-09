import { getSupabase } from "@/lib/supabase";
import type { AgeBand, BattleStatus } from "@/lib/database.types";
import type { Subject } from "@/data/quizData";

export interface BattlePlayerDto {
  user_id: string;
  username: string;
  avatar: string;
  score: number;
  connected: boolean;
  last_correct: boolean | null;
  last_seen_at: string;
  disconnected_at: string | null;
}

export interface BattleQuestionDto {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  position: number;
  correct_index: number | null;
  explanation: string | null;
}

export interface BattleMyAnswerDto {
  question_id: string;
  chosen_index: number;
  is_correct: boolean;
  explanation: string;
  correct_index: number;
  xp: number;
}

export interface BattleStateDto {
  battle_id: string;
  status: BattleStatus;
  current_index: number;
  question_started_at: string;
  question_duration_ms: number;
  reveal_ms: number;
  server_now: string;
  question_count: number;
  forfeit_user_id: string | null;
  xp_awarded: boolean;
  players: BattlePlayerDto[];
  questions: BattleQuestionDto[];
  my_answer: BattleMyAnswerDto | null;
  all_answered: boolean;
  answering_over: boolean;
  duplicate?: boolean;
}

export interface MatchmakingStartDto {
  queued: boolean;
  battle_id?: string;
  queue_id?: string;
}

export interface MatchmakingStatusDto {
  status: "idle" | "queued" | "matched";
  battle_id?: string;
  queue_id?: string;
}

function requireClient() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function rpcStartMatchmaking(subject: Subject, ageBand: AgeBand): Promise<MatchmakingStartDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("start_matchmaking", {
    p_subject_id: subject,
    p_age_band: ageBand,
  });
  if (error) throw error;
  return data as MatchmakingStartDto;
}

export async function rpcCancelMatchmaking(): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.rpc("cancel_matchmaking");
  if (error) throw error;
}

export async function rpcMatchmakingStatus(): Promise<MatchmakingStatusDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_matchmaking_status");
  if (error) throw error;
  return data as MatchmakingStatusDto;
}

export async function rpcGetBattleState(battleId: string): Promise<BattleStateDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_battle_state", { p_battle_id: battleId });
  if (error) throw error;
  return data as BattleStateDto;
}

export async function rpcSubmitBattleAnswer(
  battleId: string,
  questionId: string,
  optionIndex: number
): Promise<BattleStateDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("submit_battle_answer", {
    p_battle_id: battleId,
    p_question_id: questionId,
    p_option_index: optionIndex,
  });
  if (error) throw error;
  return data as BattleStateDto;
}

export async function rpcTickBattle(battleId: string): Promise<BattleStateDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("tick_battle", { p_battle_id: battleId });
  if (error) throw error;
  return data as BattleStateDto;
}

export async function rpcBattleHeartbeat(battleId: string): Promise<BattleStateDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("battle_heartbeat", { p_battle_id: battleId });
  if (error) throw error;
  return data as BattleStateDto;
}
