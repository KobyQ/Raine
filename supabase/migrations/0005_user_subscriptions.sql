create table public.user_subscriptions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    paystack_customer_code text,
    paystack_subscription_code text,
    plan_tier text not null default 'free',
    status text not null default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id)
);

-- Turn on RLS
alter table public.user_subscriptions enable row level security;

-- Policies
create policy "Users can view their own subscription status"
    on public.user_subscriptions for select
    to authenticated
    using ( auth.uid() = user_id );

-- Grants
grant select, insert, update, delete on public.user_subscriptions to authenticated, service_role;

-- Create trigger to automatically create a subscription row when a user signs up
create or replace function public.handle_new_user_subscription()
returns trigger as $$
begin
  insert into public.user_subscriptions (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_subscription();
