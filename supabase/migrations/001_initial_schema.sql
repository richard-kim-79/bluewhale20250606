-- 한국형 뉴스레터 플랫폼 초기 스키마
-- Supabase SQL Editor에서 실행

-- 1. profiles 테이블
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  bio text,
  avatar_url text,
  is_writer boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "프로필은 누구나 조회 가능"
  on public.profiles for select using (true);

create policy "본인만 프로필 수정 가능"
  on public.profiles for update using (auth.uid() = id);

-- auth.users 생성 시 자동으로 profiles에 추가
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. newsletters 테이블
create table public.newsletters (
  id uuid default gen_random_uuid() primary key,
  writer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  cover_image_url text,
  is_paid boolean default false,
  price_monthly integer default 0,
  created_at timestamptz default now()
);

alter table public.newsletters enable row level security;

create policy "뉴스레터는 누구나 조회 가능"
  on public.newsletters for select using (true);

create policy "작가만 뉴스레터 생성 가능"
  on public.newsletters for insert
  with check (auth.uid() = writer_id);

create policy "작가만 본인 뉴스레터 수정 가능"
  on public.newsletters for update
  using (auth.uid() = writer_id);

create policy "작가만 본인 뉴스레터 삭제 가능"
  on public.newsletters for delete
  using (auth.uid() = writer_id);

-- 3. posts 테이블
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  newsletter_id uuid references public.newsletters(id) on delete cascade not null,
  writer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text default '',
  excerpt text,
  is_premium boolean default false,
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "발행된 글은 누구나 조회 가능"
  on public.posts for select
  using (is_published = true or auth.uid() = writer_id);

create policy "작가만 글 생성 가능"
  on public.posts for insert
  with check (auth.uid() = writer_id);

create policy "작가만 본인 글 수정 가능"
  on public.posts for update
  using (auth.uid() = writer_id);

create policy "작가만 본인 글 삭제 가능"
  on public.posts for delete
  using (auth.uid() = writer_id);

-- 4. subscriptions 테이블
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  subscriber_id uuid references public.profiles(id) on delete cascade not null,
  newsletter_id uuid references public.newsletters(id) on delete cascade not null,
  is_paid boolean default false,
  status text default 'active' check (status in ('active', 'cancelled', 'expired')),
  created_at timestamptz default now(),
  expires_at timestamptz,
  unique(subscriber_id, newsletter_id)
);

alter table public.subscriptions enable row level security;

create policy "본인 구독 조회 가능"
  on public.subscriptions for select
  using (auth.uid() = subscriber_id);

create policy "뉴스레터 작가도 구독자 조회 가능"
  on public.subscriptions for select
  using (
    newsletter_id in (
      select id from public.newsletters where writer_id = auth.uid()
    )
  );

create policy "누구나 구독 가능"
  on public.subscriptions for insert
  with check (auth.uid() = subscriber_id);

create policy "본인만 구독 해지 가능"
  on public.subscriptions for update
  using (auth.uid() = subscriber_id);

-- 5. payments 테이블
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  subscriber_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  payment_key text,
  order_id text not null,
  status text default 'ready' check (status in ('ready', 'done', 'cancelled')),
  paid_at timestamptz
);

alter table public.payments enable row level security;

create policy "본인 결제 내역 조회 가능"
  on public.payments for select
  using (auth.uid() = subscriber_id);

create policy "결제 생성 가능"
  on public.payments for insert
  with check (auth.uid() = subscriber_id);

-- 인덱스
create index idx_newsletters_writer on public.newsletters(writer_id);
create index idx_posts_newsletter on public.posts(newsletter_id);
create index idx_posts_writer on public.posts(writer_id);
create index idx_posts_published on public.posts(is_published, published_at desc);
create index idx_subscriptions_subscriber on public.subscriptions(subscriber_id);
create index idx_subscriptions_newsletter on public.subscriptions(newsletter_id);
create index idx_payments_subscriber on public.payments(subscriber_id);
