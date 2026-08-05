insert into public.permissions (key, name, description)
values
  ('users.read', 'Visualizar usuários', 'Permite visualizar usuários da Automy.'),
  ('users.manage', 'Gerenciar usuários', 'Permite criar, alterar e desativar usuários.'),
  ('clients.read', 'Visualizar clientes', 'Permite visualizar clientes.'),
  ('clients.manage', 'Gerenciar clientes', 'Permite criar, alterar e desativar clientes.'),
  ('products.read', 'Visualizar produtos', 'Permite visualizar produtos.'),
  ('products.manage', 'Gerenciar produtos', 'Permite criar, alterar e desativar produtos.'),
  ('contracts.read', 'Visualizar contratos', 'Permite visualizar contratos.'),
  ('contracts.manage', 'Gerenciar contratos', 'Permite criar, alterar e cancelar contratos.'),
  ('finance.read', 'Visualizar financeiro', 'Permite visualizar informações financeiras.'),
  ('finance.manage', 'Gerenciar financeiro', 'Permite operar cobranças e registros financeiros.'),
  ('schedule.read', 'Visualizar agenda', 'Permite visualizar agenda operacional.'),
  ('schedule.manage', 'Gerenciar agenda', 'Permite criar e alterar compromissos.'),
  ('support.read', 'Visualizar suporte', 'Permite visualizar chamados de suporte.'),
  ('support.manage', 'Gerenciar suporte', 'Permite operar chamados de suporte.'),
  ('settings.read', 'Visualizar configurações', 'Permite visualizar configurações.'),
  ('settings.manage', 'Gerenciar configurações', 'Permite alterar configurações.'),
  ('audit.read', 'Visualizar auditoria', 'Permite consultar logs de auditoria.')
on conflict do nothing;

insert into public.roles (key, name, description, is_system)
values
  ('admin', 'Administrador', 'Acesso administrativo completo à Automy.', true),
  ('manager', 'Gestor', 'Acesso gerencial para operação e acompanhamento.', true),
  ('operator', 'Operador', 'Acesso operacional para execução das rotinas.', true),
  ('read_only', 'Leitura', 'Acesso somente leitura para acompanhamento.', true)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
cross join public.permissions
where roles.key = 'admin'
  and roles.company_id is null
  and roles.deleted_at is null
  and permissions.deleted_at is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
join public.permissions on permissions.key in (
  'clients.read',
  'clients.manage',
  'products.read',
  'products.manage',
  'contracts.read',
  'contracts.manage',
  'finance.read',
  'schedule.read',
  'schedule.manage',
  'support.read',
  'support.manage',
  'settings.read'
)
where roles.key = 'manager'
  and roles.company_id is null
  and roles.deleted_at is null
  and permissions.deleted_at is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
join public.permissions on permissions.key in (
  'clients.read',
  'products.read',
  'contracts.read',
  'schedule.read',
  'schedule.manage',
  'support.read',
  'support.manage'
)
where roles.key = 'operator'
  and roles.company_id is null
  and roles.deleted_at is null
  and permissions.deleted_at is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
join public.permissions on permissions.key in (
  'clients.read',
  'products.read',
  'contracts.read',
  'finance.read',
  'schedule.read',
  'support.read',
  'settings.read',
  'audit.read'
)
where roles.key = 'read_only'
  and roles.company_id is null
  and roles.deleted_at is null
  and permissions.deleted_at is null
on conflict do nothing;
