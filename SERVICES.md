# Serviços do projeto

Este documento lista todos os serviços externos usados pelo site **Ericeira Wave House**, para que servem, e onde encontrar/gerir cada credencial.

---

## GitHub

- **Para quê**: guarda o código do site (este repositório).
- **URL**: https://github.com/ericeirawavehouse/ericeira-wave-house
- **Login**: conta GitHub associada ao email ericeirawavehouse@gmail.com.

## Vercel

- **Para quê**: aloja o site publicado (deploy automático a cada `git push`) e corre as funções do servidor (`/api/send-checkin-email`).
- **URL**: https://vercel.com
- **Login**: ligado à conta GitHub.
- **Variáveis de ambiente configuradas** (em Settings → Environment Variables):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
- **Onde estão os valores**: só na própria Vercel (Settings → Environment Variables) e no gestor de passwords, como cópia de segurança.

## Supabase

- **Para quê**: base de dados do site (reservas, mensagens de contacto, check-ins) e login do painel de administração (`/admin`).
- **URL**: https://supabase.com
- **Projeto**: o ligado ao `VITE_SUPABASE_URL` em `.env.local`.
- **Utilizador admin do site** (para entrar em `/admin/login`): database.(password_normal).
- **Login**: ligado à conta GitHub.

## Domínio + Email (Amen.pt)

- **Para quê**: dono do domínio `ericeirawavehouse.pt` e da caixa de email `reservas@ericeirawavehouse.pt`, usada pelo site para enviar emails de check-in (via SMTP: `smtp-pt.securemail.pro`, porta 465).
- **URL**: https://www.amen.pt
- **Password do Ámen.pt**: ligado à conta GitHub. 
- **Password do email reservas@ericeirawavehouse.pt**: (login Amen.pt + password da caixa `reservas@ericeirawavehouse.pt`, que também está na Vercel como `SMTP_PASSWORD`, neste caso reservas.(password_normal)).

## Gmail (ericeirawavehouse@gmail.com)

- **Para quê**: email de contacto público do negócio. Aparece no site (rodapé, "Reply-To" dos emails automáticos) para os hóspedes responderem a dúvidas.
- **Login e Password**: ericeirawavehouse@gmail.com ; (password_normal).
- **Nota**: recebe as respostas dos hóspedes aos emails do `reservas@ericeirawavehouse.pt`.

---

## Checklist se precisares de trocar alguma password

1. Troca a password no serviço original.
2. Atualiza o valor correspondente na Vercel (Settings → Environment Variables), se aplicável.
3. Faz um novo deploy na Vercel para a alteração ter efeito (variáveis de ambiente só se aplicam a partir do próximo deployment).