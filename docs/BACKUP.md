# Git Backup

Kuilo respalda tu vault automáticamente con Git usando [isomorphic-git](https://isomorphic-git.org/) — sin necesidad de tener Git instalado.

## Auto-backup

Cada vez que guardas un documento, Kuilo hace commit automático 30 segundos después. Sin intervención del usuario.

## Backup manual

**Conectores AI** → sección **Git Backup** → **Hacer backup ahora**

## Push a remoto

Configura cualquier repositorio Git:
1. **Remote URL** — `https://github.com/user/repo.git`
2. **Token** — Personal Access Token con permisos `repo`

Funciona con: GitHub, GitLab, Bitbucket, Gitea, o cualquier servidor Git.

## Recuperación

Si tu PC muere:
```bash
git clone https://github.com/user/repo.git mi-vault
```
Abre Kuilo → cambia vault a `mi-vault` → todo restaurado.

## Técnico

- `isomorphic-git` — Git en JavaScript puro, sin binario nativo
- Commits con autor `Kuilo <kuilo@local>`
- `.git/` dentro del vault (no interfiere con los documentos)
