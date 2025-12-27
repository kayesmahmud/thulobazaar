# Development Server Scripts

## Problem
Running multiple dev servers simultaneously can cause:
- **Massive token usage** in Claude Code (17 shells = 10 min to hit daily limit)
- Port conflicts
- High system resource usage

## Solution: Safe Dev Scripts

### Usage

**Start servers safely:**
```bash
# Terminal 1:
npm run dev:web-safe

# Terminal 2:
npm run dev:api-safe
```

**Stop all dev servers:**
```bash
npm run dev:stop
```

### What the safe scripts do:

1. ✅ Check if port is already in use
2. ✅ Kill old process if found
3. ✅ Count total running dev processes
4. ✅ Warn if ≥2 processes detected
5. ✅ Prompt to kill old processes
6. ✅ Start the requested server

### Example Output

```bash
$ npm run dev:web-safe

⚠️  WARNING: Already 2 dev processes running
📋 Current processes:
  - PID 12345: npm run dev:web
  - PID 67890: npm run dev:api

💡 Kill old processes? (y/n)
```

### Regular vs Safe Commands

| Command | Safe? | Auto-kills duplicates? |
|---------|-------|----------------------|
| `npm run dev:web` | ❌ No | No |
| `npm run dev:api` | ❌ No | No |
| `npm run dev:web-safe` | ✅ Yes | Prompts first |
| `npm run dev:api-safe` | ✅ Yes | Prompts first |
| `npm run dev:stop` | ✅ Yes | Kills all |

### Best Practices

1. **Always use safe scripts** when working with Claude Code
2. **Run dev:stop** before starting a new session
3. **Monitor processes** with `ps aux | grep "npm run dev"`
4. **Use separate terminals** instead of background tasks in Claude

### Ports Used

- **Frontend (Next.js):** Port 3333
- **Backend (Express):** Port 5000

### Troubleshooting

**Port still in use?**
```bash
# Check what's using the port
lsof -ti:3333
lsof -ti:5000

# Force kill
lsof -ti:3333 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

**Too many processes?**
```bash
# Kill all dev processes
pkill -f "npm run dev"
pkill -f "turbo run dev"
```

**Claude Code daily limit hit?**
This usually means too many background shells are running. Use:
```bash
npm run dev:stop
```
Then restart servers in your own terminal (not through Claude Code).
