import { getSupabase } from "@/lib/supabase";
import type { AgeBand } from "@/lib/database.types";
import type { Subject } from "@/data/quizData";
import type { SearchKind } from "@/lib/invite-search";

export type PresenceStatus = "online" | "idle" | "in_battle" | "offline";
export type InviteStatus = "pending" | "accepted" | "declined" | "expired" | "queued_offline";

export interface SearchUserDto {
  found: boolean;
  id?: string;
  username?: string;
  avatar?: string;
  presence?: PresenceStatus;
  kind?: SearchKind;
}

export interface InviteDto {
  id: string;
  from_id: string;
  to_id: string | null;
  subject_id: Subject;
  age_band: AgeBand;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
  battle_id: string | null;
  code: string | null;
  from_username: string | null;
  from_avatar: string | null;
  to_username: string | null;
  to_avatar: string | null;
  from_presence: PresenceStatus | null;
  to_presence: PresenceStatus | null;
}

export interface InviteListDto {
  incoming: InviteDto[];
  outgoing: InviteDto[];
}

function requireClient() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function rpcSearchUsers(query: string, kind: SearchKind | "auto" = "auto"): Promise<SearchUserDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("search_users", {
    p_query: query,
    p_kind: kind,
  });
  if (error) throw error;
  return data as SearchUserDto;
}

export async function rpcSendInvite(toId: string, subject: Subject, ageBand: AgeBand): Promise<InviteDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("send_invite", {
    p_to_id: toId,
    p_subject_id: subject,
    p_age_band: ageBand,
  });
  if (error) throw error;
  return data as InviteDto;
}

export async function rpcCreateInviteCode(subject: Subject, ageBand: AgeBand): Promise<InviteDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("create_invite_code", {
    p_subject_id: subject,
    p_age_band: ageBand,
  });
  if (error) throw error;
  return data as InviteDto;
}

export async function rpcAcceptInvite(inviteId: string): Promise<InviteDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_invite_id: inviteId });
  if (error) throw error;
  return data as InviteDto;
}

export async function rpcRedeemInviteCode(code: string): Promise<InviteDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("redeem_invite_code", { p_code: code });
  if (error) throw error;
  return data as InviteDto;
}

export async function rpcDeclineInvite(inviteId: string): Promise<InviteDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("decline_invite", { p_invite_id: inviteId });
  if (error) throw error;
  return data as InviteDto;
}

export async function rpcCancelInvite(inviteId: string): Promise<InviteDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("cancel_invite", { p_invite_id: inviteId });
  if (error) throw error;
  return data as InviteDto;
}

export async function rpcListMyInvites(): Promise<InviteListDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("list_my_invites");
  if (error) throw error;
  const raw = (data ?? { incoming: [], outgoing: [] }) as InviteListDto;
  return {
    incoming: raw.incoming ?? [],
    outgoing: raw.outgoing ?? [],
  };
}

export async function rpcGetInvite(inviteId: string): Promise<InviteDto> {
  const supabase = requireClient();
  const { data, error } = await supabase.rpc("get_invite", { p_invite_id: inviteId });
  if (error) throw error;
  return data as InviteDto;
}

export async function rpcHeartbeatPresence(status: PresenceStatus = "online"): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.rpc("heartbeat_presence", { p_status: status });
  if (error) throw error;
}

export async function rpcSetFindablePhone(phone: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.rpc("set_findable_phone", { p_phone: phone });
  if (error) throw error;
}
