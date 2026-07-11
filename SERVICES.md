# Serviços do projeto

Este documento lista todos os serviços externos usados pelo site **Ericeira Wave House**, para que servem, e onde encontrar/gerir cada credencial.

**Nunca guardes passwords, chaves de API ou tokens neste ficheiro.** Usa um gestor de passwords (ex: Google Password Manager, Bitwarden, 1Password) para guardar os valores reais. Este documento é só o "mapa" de onde cada coisa está.

---

## GitHub

- **Para quê**: guarda o código do site (este repositório).
- **URL**: https://github.com/ericeirawavehouse/ericeira-wave-house
- **Login**: conta GitHub `martaclfvalentim`.
- **Onde está a password**: gestor de passwords pessoal.

## Vercel

- **Para quê**: aloja o site publicado (deploy automático a cada `git push`) e corre as funções do servidor (`/api/send-checkin-email`).
- **URL**: https://vercel.com
- **Login**: normalmente ligado à conta GitHub.
- **Variáveis de ambiente configuradas** (em Settings → Environment Variables, sem valores aqui):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
- **Onde estão os valores**: só na própria Vercel (Settings → Environment Variables) e no gestor de passwords, como cópia de segurança.

## Supabase

- **Para quê**: base de dados do site (reservas, mensagens de contacto, check-ins) e login do painel de administração (`/admin`).
- **URL**: https://supabase.com
- **Projeto**: o ligado ao `VITE_SUPABASE_URL` em `.env.local`.
- **Utilizador admin do site** (para entrar em `/admin/login`): criado em Authentication → Users, com o teu email e uma password à escolha.
- **Onde estão as passwords**: gestor de passwords pessoal (login Supabase + password do utilizador admin do site).

## Domínio + Email (Amen.pt)

- **Para quê**: dono do domínio `ericeirawavehouse.pt` e da caixa de email `reservas@ericeirawavehouse.pt`, usada pelo site para enviar emails de check-in (via SMTP: `smtp-pt.securemail.pro`, porta 465).
- **URL**: https://www.amen.pt
- **Onde está a password**: gestor de passwords pessoal (login Amen.pt + password da caixa `reservas@ericeirawavehouse.pt`, que também está na Vercel como `SMTP_PASSWORD`).

## Gmail (ericeirawavehouse@gmail.com)

- **Para quê**: email de contacto público do negócio. Aparece no site (rodapé, "Reply-To" dos emails automáticos) para os hóspedes responderem a dúvidas.
- **Onde está a password**: gestor de passwords pessoal.
- **Nota**: já não é usado para enviar os emails automáticos do site (isso passou a ser feito pelo `reservas@ericeirawavehouse.pt` via Amen.pt) — só recebe as respostas dos hóspedes.

---

## Checklist se precisares de trocar alguma password

1. Troca a password no serviço original.
2. Atualiza o valor correspondente na Vercel (Settings → Environment Variables), se aplicável.
3. Faz um novo deploy na Vercel para a alteração ter efeito (variáveis de ambiente só se aplicam a partir do próximo deployment).
4. Atualiza o gestor de passwords.
