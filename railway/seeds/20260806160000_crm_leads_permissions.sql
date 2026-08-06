insert into public.permissions (key, name, description)
values
  ('leads.read', 'Visualizar leads', 'Permite visualizar leads recebidos pela Landing.'),
  ('leads.manage', 'Gerenciar leads', 'Permite alterar status, atribuir e converter leads.')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
cross join public.permissions
where roles.key = 'admin'
  and roles.company_id is null
  and roles.deleted_at is null
  and permissions.key in ('leads.read', 'leads.manage')
  and permissions.deleted_at is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
cross join public.permissions
where roles.key = 'manager'
  and roles.company_id is null
  and roles.deleted_at is null
  and permissions.key in ('leads.read', 'leads.manage')
  and permissions.deleted_at is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
cross join public.permissions
where roles.key = 'operator'
  and roles.company_id is null
  and roles.deleted_at is null
  and permissions.key = 'leads.read'
  and permissions.deleted_at is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
cross join public.permissions
where roles.key = 'read_only'
  and roles.company_id is null
  and roles.deleted_at is null
  and permissions.key = 'leads.read'
  and permissions.deleted_at is null
on conflict do nothing;
