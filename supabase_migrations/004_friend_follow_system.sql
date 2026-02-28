-- 1. Create the follows table
create table public.follows (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references public.profiles(user_id) on delete cascade not null,
    following_id uuid references public.profiles(user_id) on delete cascade not null,
    status text check (status in ('pending', 'accepted', 'blocked')) default 'pending' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(follower_id, following_id)
);

-- 2. Add follower/following counts to profiles
alter table public.profiles 
  add column if not exists followers_count integer default 0 not null,
  add column if not exists following_count integer default 0 not null;

-- 3. Enable RLS
alter table public.follows enable row level security;

-- 4. RLS Policies
-- Users can see their own follows (either as follower or following)
create policy "Users can view their own follows" 
on public.follows for select 
using (auth.uid() = follower_id or auth.uid() = following_id);

-- Users can insert follow records where they are the follower
create policy "Users can insert their own follows" 
on public.follows for insert 
with check (auth.uid() = follower_id);

-- Only the user being followed (the following_id) can accept a follow request (change status to 'accepted')
create policy "Users can accept follow requests addressed to them" 
on public.follows for update
using (auth.uid() = following_id)
with check (status = 'accepted');

-- Users can delete a follow if they are the follower (unfollow) OR the following (decline/remove follower)
create policy "Users can delete their follows or decline requests" 
on public.follows for delete 
using (auth.uid() = follower_id or auth.uid() = following_id);

-- 5. Trigger to update follower/following counts
create or replace function public.update_follow_counts()
returns trigger
language plpgsql security definer
as $$
begin
  if (tg_op = 'INSERT' and new.status = 'accepted') or 
     (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted') then
    update public.profiles set followers_count = followers_count + 1 where user_id = new.following_id;
    update public.profiles set following_count = following_count + 1 where user_id = new.follower_id;
  elsif (tg_op = 'DELETE' and old.status = 'accepted') then
    update public.profiles set followers_count = followers_count - 1 where user_id = old.following_id;
    update public.profiles set following_count = following_count - 1 where user_id = old.follower_id;
  end if;
  return null;
end;
$$;

create trigger on_follow_status_change
after insert or update of status or delete on public.follows
for each row execute function public.update_follow_counts();
