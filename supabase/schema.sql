-- WF Lava Car — schema inicial
--
-- Como rodar: no painel do Supabase, vá em "SQL Editor" (menu lateral) →
-- "New query" → cole este arquivo inteiro → "Run".
--
-- O projeto foi criado com "Enable automatic RLS", então toda tabela nova já
-- nasce travada (ninguém lê/escreve nada até uma policy liberar). E como
-- "Automatically expose new tables" ficou desmarcado, também precisamos dar
-- GRANT explícito — por isso os dois blocos abaixo, não só as policies.

create table if not exists lavagens (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  cliente text,
  modelo text not null,
  placa text,
  servico text,
  valor numeric(10,2) not null check (valor >= 0),
  created_at timestamptz not null default now()
);

create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(10,2) not null check (valor >= 0),
  tipo text not null check (tipo in ('diario', 'mensal')),
  categoria text not null default 'geral' check (categoria in ('geral', 'funcionario')),
  data date,
  competencia text,
  created_at timestamptz not null default now(),
  constraint gasto_tem_data_ou_competencia check (
    (tipo = 'diario' and data is not null) or
    (tipo = 'mensal' and competencia is not null)
  )
);

create table if not exists valores_padrao (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric(10,2) not null check (valor >= 0),
  created_at timestamptz not null default now()
);

create table if not exists funcionarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  salario numeric(10,2) not null check (salario >= 0),
  periodicidade text not null check (periodicidade in ('mensal', 'semanal', 'diario')),
  created_at timestamptz not null default now()
);

-- Privilégio de tabela (GRANT) — sem isso, mesmo com policy liberando,
-- o papel "authenticated" não tem permissão de tentar a operação.
grant select, insert, update, delete on lavagens to authenticated;
grant select, insert, update, delete on gastos to authenticated;
grant select, insert, update, delete on valores_padrao to authenticated;
grant select, insert, update, delete on funcionarios to authenticated;

-- Row Level Security — redundante com o "Enable automatic RLS" do projeto,
-- mas explícito aqui para o schema não depender de configuração externa.
alter table lavagens enable row level security;
alter table gastos enable row level security;
alter table valores_padrao enable row level security;
alter table funcionarios enable row level security;

-- Ferramenta de uso interno de um único negócio: qualquer pessoa logada
-- (authenticated) tem acesso completo às 4 tabelas. Quem não logou (anon)
-- não enxerga nada — nem GRANT, nem policy pra esse papel.
create policy "Autenticado tem acesso total" on lavagens
  for all to authenticated using (true) with check (true);

create policy "Autenticado tem acesso total" on gastos
  for all to authenticated using (true) with check (true);

create policy "Autenticado tem acesso total" on valores_padrao
  for all to authenticated using (true) with check (true);

create policy "Autenticado tem acesso total" on funcionarios
  for all to authenticated using (true) with check (true);
