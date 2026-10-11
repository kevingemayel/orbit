-- 234: a signature request that carries the document and reaches the signer.
--
-- Sign could list who should sign and nothing else: no document was attached to
-- the request, "Send for signature" only changed a status, and the signature
-- itself could be drawn by whoever had the Orbit login open. So the one thing
-- the module is for, getting a named person to sign a document and having proof
-- of it, could not happen.
--
-- The pieces, following the same shape as the approve-from-email links that
-- already work: a token per signer, hashed in the database and never stored in
-- the clear, carried in a link that opens one page on any device.
--
--   mint_sign_token(signature)   staff side, needs rights in the company
--   sign_lookup(token)           what the signer sees: the document and who they are
--   sign_record(token, name, data)   the signature itself
--   sign_decline(token, reason)  the other answer, which matters just as much
--
-- A token lasts 30 days, dies the moment it is used, and carries nothing but a
-- random 32 bytes: it names no company, no document and no person, so a link
-- that leaks tells the finder nothing until they open it, and tells them
-- nothing at all once it is spent.
alter table public.sign_signatures
  add column if not exists signer_email text,
  add column if not exists token_hash text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists decline_reason text;
alter table public.sign_requests
  add column if not exists sent_at timestamptz;
create index if not exists sign_signatures_token_idx on public.sign_signatures (token_hash) where token_hash is not null;

-- staff side: mint a link for one signer
create or replace function public.mint_sign_token(p_signature uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $fn$
declare sg record; req public.sign_requests; raw text; comp text;
begin
  select * into sg from public.sign_signatures where id = p_signature;
  if sg.id is null then return jsonb_build_object('error', 'That signer no longer exists.'); end if;
  select * into req from public.sign_requests where id = sg.request_id;
  if req.id is null then return jsonb_build_object('error', 'That request no longer exists.'); end if;
  if auth.uid() is not null and not public.can_write_app(req.company_id, '{documents,projects,site,settings}'::text[]) then
    return jsonb_build_object('error', 'Your role cannot send a document for signature.');
  end if;
  if sg.signed_at is not null then return jsonb_build_object('error', 'That person has already signed.'); end if;

  raw := encode(gen_random_bytes(32), 'hex');
  update public.sign_signatures
     set token_hash = encode(digest(raw, 'sha256'), 'hex'),
         token_expires_at = now() + interval '30 days'
   where id = p_signature;
  select name into comp from public.companies where id = req.company_id;
  return jsonb_build_object('token', raw, 'signer_name', sg.signer_name, 'signer_email', sg.signer_email,
                            'title', req.title, 'number', req.number, 'company', comp);
end $fn$;

-- the signer's side: no login, just the token
create or replace function public.sign_lookup(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $fn$
declare sg record; req public.sign_requests; comp text; docs jsonb;
begin
  if coalesce(p_token, '') = '' then return jsonb_build_object('error', 'This link is incomplete.'); end if;
  select * into sg from public.sign_signatures where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if sg.id is null then return jsonb_build_object('error', 'This link is not valid any more.'); end if;
  if sg.token_expires_at is not null and sg.token_expires_at < now() then
    return jsonb_build_object('error', 'This link has expired. Ask for a new one.');
  end if;
  select * into req from public.sign_requests where id = sg.request_id;
  select name into comp from public.companies where id = req.company_id;
  select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'name', coalesce(m.caption, m.path), 'mime', m.mime) order by m.created_at), '[]'::jsonb)
    into docs from public.media m where m.entity = 'sign_request' and m.entity_id = req.id;
  return jsonb_build_object(
    'ok', true, 'company', comp, 'title', req.title, 'number', req.number, 'doc_type', req.doc_type,
    'notes', req.notes, 'signer_name', sg.signer_name, 'signer_role', sg.signer_role,
    'signed_at', sg.signed_at, 'declined_at', sg.declined_at, 'documents', docs);
end $fn$;

create or replace function public.sign_record(p_token text, p_name text, p_data text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $fn$
declare sg record; left_to_sign int;
begin
  select * into sg from public.sign_signatures where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if sg.id is null then return jsonb_build_object('error', 'This link is not valid any more.'); end if;
  if sg.token_expires_at is not null and sg.token_expires_at < now() then
    return jsonb_build_object('error', 'This link has expired. Ask for a new one.');
  end if;
  if sg.signed_at is not null then return jsonb_build_object('error', 'You have already signed this.'); end if;
  if coalesce(p_data, '') = '' then return jsonb_build_object('error', 'Draw your signature first.'); end if;

  update public.sign_signatures
     set signed_at = now(),
         signature_data = p_data,
         signer_name = coalesce(nullif(btrim(coalesce(p_name, '')), ''), sg.signer_name),
         token_hash = null                              -- one signature per link
   where id = sg.id;

  select count(*) into left_to_sign from public.sign_signatures
   where request_id = sg.request_id and signed_at is null and declined_at is null;
  update public.sign_requests
     set status = case when left_to_sign = 0 then 'signed' else 'pending' end
   where id = sg.request_id;
  return jsonb_build_object('ok', true, 'all_signed', left_to_sign = 0);
end $fn$;

create or replace function public.sign_decline(p_token text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $fn$
declare sg record;
begin
  select * into sg from public.sign_signatures where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if sg.id is null then return jsonb_build_object('error', 'This link is not valid any more.'); end if;
  if sg.signed_at is not null then return jsonb_build_object('error', 'You have already signed this.'); end if;
  update public.sign_signatures
     set declined_at = now(), decline_reason = nullif(btrim(coalesce(p_reason, '')), ''), token_hash = null
   where id = sg.id;
  update public.sign_requests set status = 'declined' where id = sg.request_id;
  return jsonb_build_object('ok', true);
end $fn$;

revoke execute on function public.mint_sign_token(uuid) from anon;
grant execute on function public.mint_sign_token(uuid) to authenticated;
grant execute on function public.sign_lookup(text) to anon, authenticated;
grant execute on function public.sign_record(text, text, text) to anon, authenticated;
grant execute on function public.sign_decline(text, text) to anon, authenticated;

select 'sign functions ready' as done;
