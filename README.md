# VitePot 🐝

[![npm version](https://img.shields.io/npm/v/@itznotabug/vitepot.svg?logo=npm&logoColor=white)](https://www.npmjs.com/package/@itznotabug/vitepot)
[![CI](https://img.shields.io/github/actions/workflow/status/itznotabug/vitepot/ci.yaml?branch=main&logo=github&logoColor=white)](https://github.com/itznotabug/vitepot/actions/workflows/ci.yaml)
[![License](https://img.shields.io/npm/l/%40itznotabug%2Fvitepot?logo=apache&logoColor=white&color=blue)](https://github.com/ItzNotABug/vitepot/blob/main/LICENSE)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![VitePress](https://img.shields.io/badge/VitePress-1.x-5a67d8.svg?logo=vitepress&logoColor=white)](https://vitepress.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Static-first honeypot plugin for VitePress and other Vite-powered static sites.

VitePot emits realistic-looking sensitive files like `/.env`, `/wp-config.php`, `/backup.sql`, `/.git/config`,
`/vercel.json`, and `settings.py` so noisy crawlers, path probers, and low-effort scanners spend time on bait instead
of your real surface area.

## What It Does

- Serves traps from memory in `vitepress dev`
- Emits real trap files during `vitepress build`
- Reuses the same trap responses in preview
- Generates syntax-aware fake content for env, PHP, SQL, Git, JSON, JS, YAML, Python, INI, logs, and plain text
- Uses reserved `.test` domains and RFC 5737 test-net IPs so generated data never points to real infrastructure
- Supports custom traps with sync content, async content, binary content, and per-trap directory placement

## Installation

```bash
bun add @itznotabug/vitepot
```

## Usage

### Quick Start

```ts
// .vitepress/config.mts
import { defineConfig } from 'vitepress';
import { vitepot } from '@itznotabug/vitepot';

export default defineConfig({
    vite: {
        plugins: [
            vitepot()
        ],
    },
});
```

That enables the built-in trap set at the site root.

### Full Example

```ts
import { defineConfig } from 'vitepress';
import { vitepot } from '@itznotabug/vitepot';

export default defineConfig({
    vite: {
        plugins: [
            vitepot({
                variants: ['cms-roots', 'archive-roots'],
                dirs: ['/legacy'],
                custom: [
                    {
                        path: '/private.env'
                    },
                    {
                        path: '/secrets.ini', kind: 'ini'
                    },
                    {
                        path: '/credentials.txt',
                        content: 'admin=disabled\nroot=disabled\n',
                    },
                    {
                        path: '/ai-keys.json',
                        contentType: 'application/json',
                        content: async ({ helpers }) =>
                            JSON.stringify(
                                {
                                    openai: helpers.fakeOpenAIKey(),
                                    anthropic: helpers.fakeAnthropicKey(),
                                    google: helpers.fakeGoogleAIKey(),
                                },
                                null,
                                2,
                            ),
                    },
                    {
                        path: '/archive.bin',
                        contentType: 'application/octet-stream',
                        content: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
                    },
                ],
            }),
        ],
    },
});
```

## Runtime Model

### Dev

During `vitepress dev`, VitePot registers middleware and serves trap responses directly from memory. No files are
written.

### Build

During `vitepress build`, VitePot generates the trap set and emits static assets into the output bundle. If a trap path
collided with an existing output file, VitePot **skips it** and logs a warning.

### Preview

During preview, the same trap middleware is mounted so local preview behavior stays aligned with the built output.

## Built-In Trap Set

The default set includes 43 file traps across:

- leaked env and credential files
- Git and source-control metadata
- WordPress and PHP config files
- SQL dumps and backups
- server config and auth files
- framework and deployment config files
- application logs

Examples:

- `/.env`
- `/.aws/credentials`
- `/.git/config`
- `/wp-config.php`
- `/config.php`
- `/backup.sql`
- `/web.config`
- `/wp-login.php`
- `/xmlrpc.php`
- `/vercel.json`
- `/next.config.js`
- `/config/database.yml`
- `/settings.py`
- `/connectionstrings.config`

## Placement

### Variants

Variants mirror compatible built-in traps into common subpaths.

```ts
vitepot({
    variants: ['cms-roots'],
});
```

Available presets:

- `cms-roots` → `/blog`, `/site`, `/wordpress`
- `app-roots` → `/public`, `/api`
- `archive-roots` → `/backup`, `/backups`, `/old`

Variant expansion is filtered by trap compatibility. Example: `cms-roots` expands `/wp-config.php`, but not `/.env`.

### Explicit Directories

You can also mirror traps into directories you choose:

```ts
vitepot({
    dirs: ['/legacy', '/staging'],
});
```

## API

### Plugin Options

```ts
interface VitePotOptions {
    enabled?: boolean;
    variants?: VariantPreset[];
    dirs?: string[];
    custom?: CustomTrap[];
}
```

### `enabled`

Turns the plugin on or off. Defaults to `true`.

### `variants`

Adds built-in preset directories for compatible built-in traps.

### `dirs`

Adds explicit extra directories for expansion. Root is always included automatically.

### `custom`

Adds user-defined file traps.

```ts
type CustomTrap = {
    path: string;
    kind?: TrapKind;
    content?: string | Uint8Array | Promise<string | Uint8Array> |
        ((ctx: CustomTrapContext) => string | Uint8Array | Promise<string | Uint8Array>);
    contentType?: string;
    dirs?: string[];
};
```

Rules:

- `path` must start with `/`
- file paths must not end with `/`
- `content` overrides the built-in generator
- `dirs` on a custom trap applies only to that trap

### Trap Kinds

Built-in generator families map file paths to realistic content shapes:

- `env`
- `wordpress`
- `php`
- `sql`
- `git`
- `server`
- `json`
- `js`
- `yaml`
- `python`
- `ini`
- `log`
- `text`

If `kind` is omitted on a custom trap, VitePot infers it from the path.

### Fake Data Helpers

Custom content factories receive deterministic helpers:

```ts
helpers.fakeDomain()           // calmrouter.test
helpers.fakeEmail()            // admin@calmrouter.test
helpers.fakeHostname()         // db-3.calmrouter.test
helpers.fakeTestNetIPv4()      // 192.0.2.15
helpers.fakeMysqlPassword()    // strong fake password
helpers.fakeApiToken()         // generic token
helpers.fakePhpSecret()        // 64-char hex secret
helpers.fakeJwtLikeSecret()    // JWT-like secret
helpers.fakeCloudKey()         // AWS-style access key
helpers.fakeTimestamp()        // ISO timestamp
helpers.fakeOpenAIKey()        // sk-proj-...
helpers.fakeAnthropicKey()     // sk-ant-api...
helpers.fakeGoogleAIKey()      // AIzaSy...
helpers.fakeHuggingFaceToken() // hf_...
helpers.fakeStripeKey()        // sk_live_...
helpers.fakeSupabaseKey()      // JWT-like Supabase key
helpers.fakeClerkKey()         // sk_live_...
helpers.fakeVercelToken()      // Vercel-style token
helpers.fakeSentryDSN()        // https://key@host.test/123
```

All generated domains use the reserved `.test` TLD, and all generated IPs use RFC 5737 test-net ranges.

## Important Notes

### Server Execution Prevention

If your production server can execute certain file types (PHP, Python, Ruby, etc.), configure it to serve honeypot files
as static text instead of executing them. Use `.htaccess` (Apache), `nginx.conf` (Nginx), or equivalent configuration
for your web server to disable execution and force `text/plain` content-type for trap files.

### Dotfile Limitations

**VitePress Preview:** Dotfiles (`.env`, `.git/config`, etc.) are blocked by VitePress's preview serverThey work in dev
mode via middleware and are emitted during build, but won't be served in `vitepress preview`.

**Production Hosting:** Some managed hosting providers might block dotfiles for security. Non-dotfile traps
(`wp-config.php`, `backup.sql`, etc.) work everywhere. Dotfiles should work on servers where you have full control (VPS,
dedicated servers with custom web server configuration).

## Development

```bash
bun install
bun run check
bun test
bun run typecheck
bun run build
```
