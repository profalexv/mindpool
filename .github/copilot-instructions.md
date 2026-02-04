# MindPool v1.17 - AI Agent Instructions

## Project Overview

**MindPool** is a real-time voting/polling application for interactive presentations and audience engagement. Controllers create sessions with questions, presenters display them, and audiences vote via browser.

**Architecture**: Node.js/Express backend + Socket.IO + vanilla JavaScript frontend (no frameworks)

**Key Components**:
- `server-v2.js` - Main backend with routing, session management, rate limiting
- `admin-v2.js` - Admin interface (create/join sessions, manage questions)
- `presenter.js`, `audience.js`, `controller.js` - Role-specific clients
- Frontend files: `pages/*.html`, `scripts/*.js`, `styles/mindpool.css`

---

## Critical Architecture Patterns

### Socket.IO Real-Time Communication

**Session-based messaging model**: All events route through `sessionCode`
```javascript
// Backend: Broadcast to specific role in session
io.to(`session-${sessionCode}-controller`).emit('eventName', data);
io.to(`session-${sessionCode}-audience`).emit('eventName', data);
```

**Common Events** (see `API_EXEMPLOS.md` for full list):
- `createSession` → returns `{ success, sessionCode }`
- `joinAdminSession` → validates password, role in ('controller'|'presenter')
- `createQuestion` → adds to `session.questions[]` array
- `submitAnswer` → stores vote in `question.results{}`
- `editQuestion`, `duplicateQuestion`, `deleteQuestion` (v1.17 new)

**Important**: Always use callback pattern for request/response:
```javascript
socket.emit('event', data, (response) => { handle response });
```

### Session Data Structure

Sessions stored in-memory (`sessions` Map):
```javascript
{
  code: "ABC123",                         // 6-char unique code
  controllerPassword: "$2a$10$...",      // bcrypt hash if ENABLE_PASSWORD_HASHING=true
  presenterPassword: "$2a$10$...",
  questions: [                            // Array indexed by ID
    {
      id: 0,
      text: "Question?",
      questionType: "yes_no" | "options" | "text",
      options: [{ id: "opt1", text: "Yes" }],  // only for 'options' type
      results: { yes: 5, no: 2 },         // vote tallies
      acceptingAnswers: boolean,
      createdAt: timestamp
    }
  ],
  controllerSocketId: "socket-abc...",
  presenterSocketIds: ["socket-1", "socket-2"],
  audienceCount: 42,
  deadline: null | timestamp,
  createdAt: timestamp
}
```

### Environment-Driven Configuration

Use `.env` file (vars loaded by `dotenv`):
- `NODE_ENV`: "local" | "production" (controls CORS origins, URLs)
- `PORT`: server port (default 3000)
- `ENABLE_PASSWORD_HASHING`: "true" | "false" (bcryptjs)
- `ENABLE_RATE_LIMITING`: "true" | "false" (login attempt throttling)
- `SESSION_TIMEOUT`: minutes (0 = no expiry)
- `LOG_LEVEL`: "DEBUG" | "INFO" | "WARN" | "ERROR"

**Frontend detects environment**:
```javascript
const isDev = window.location.hostname === 'localhost' || '127.0.0.1';
const backendUrl = isDev ? 'http://localhost:3000' : 'https://mindpool-backend.onrender.com';
```

### Session History (Client-Side)

Admin (`admin-v2.js`) stores recent sessions in `localStorage`:
```javascript
// Key: 'mindpool_session_history'
[
  { code: "ABC123", role: "controller", timestamp: "2024-01-15T...", hashedPass: "base64" },
  // Limit: 10 sessions, prevents duplicates
]
```

---

## Developer Workflows

### Local Development

```bash
cd scripts
npm install                    # Install: express, socket.io, bcryptjs, dotenv, cors, rate-limiter-flexible
cp .env.example .env          # Create config
./start.sh local              # Runs: NODE_ENV=local PORT=3000 node server-v2.js
```

**Test**: Open `http://localhost:3000` → admin page at `?role=admin`

### Testing

Run `./test.sh` at root - checks health endpoint and creates test sessions via REST and Socket.IO.

**Manual testing flow**:
1. Controller: Create session
2. Presenter: Join with presenter password
3. Audience: Join without password
4. Controller: Create question → Presenter displays → Audience votes
5. Controller: View results in real-time

### Production Deployment

Hosted on Render.com (`https://mindpool-backend.onrender.com`)
- Environment variables set in Render dashboard
- Auto-scales from Node.js buildpack
- Static files served from root (HTML, CSS, JS)

---

## Code Organization Conventions

### File Structure
```
scripts/
  server.js                 # Active backend (v1.17)
  admin.js                  # Active admin UI (v1.17)
  audience.js, presenter.js # Client-side scripts
  package.json              # Dependencies
  start.sh                  # Launch script
.archive/
  server-v1.16.js          # Legacy v1.16 (reference only)
  admin-v1.16.js           # Legacy v1.16 (reference only)
pages/
  admin.html                # Admin UI
  presenter.html            # Presenter display
  audience.html             # Audience voting
styles/
  mindpool.css              # Shared styles
```

### Naming Conventions

- **Socket rooms**: `session-{CODE}-{ROLE}` (e.g., `session-ABC123-controller`)
- **Question IDs**: Auto-increment within session (0, 1, 2...)
- **Session codes**: 6 uppercase alphanumeric (e.g., "ABC123")
- **Events**: camelCase with action prefix (e.g., `createQuestion`, `submitAnswer`)
- **Responses**: Always `{ success: boolean, message?: string, data?: any }`

### Frontend Patterns

**No framework** - vanilla JavaScript with direct DOM manipulation:
```javascript
// Common pattern from admin-v2.js
const element = document.getElementById('id');
element.addEventListener('click', handler);
element.style.display = 'none'; // show/hide
element.textContent = 'content';
```

**Form handling**: Input validation before `socket.emit()`, error display in `#error-message` div

**Toast notifications**: Injected into DOM (admin-v2.js: `showMessage()`)

---

## Integration Points & External Dependencies

### NPM Dependencies
- **express** (4.18.2) - HTTP routing, static file serving
- **socket.io** (4.7.2) - WebSocket communication
- **bcryptjs** (2.4.3) - Password hashing (optional, feature-gated)
- **dotenv** (16.3.1) - Env variable loading
- **cors** (2.8.5) - Cross-origin requests
- **rate-limiter-flexible** (2.4.1) - Rate limiting (optional)
- **pg** (8.11.3) - Listed in package.json but **not currently used** (legacy)

### CORS Configuration

Dynamic origin list (see `server-v2.js` getOrigins()):
```javascript
[
  "https://mindpool.alexandre.pro.br",
  "http://localhost:3000",  // Dev
  "http://localhost:*"      // Any local port
]
```

### Critical Behaviors

1. **Session cleanup**: Expired sessions auto-deleted (check `SESSION_TIMEOUT`)
2. **Rate limiting**: Per-IP login attempts throttled if `ENABLE_RATE_LIMITING=true`
3. **Password hashing**: Controlled by `ENABLE_PASSWORD_HASHING` - gracefully degrades to base64 if bcryptjs unavailable
4. **Logging**: Structured logs with level filtering (DEBUG/INFO/WARN/ERROR)

---

## Common Tasks & Examples

### Adding a New Socket Event

1. Backend handler in `server-v2.js` (socket.on):
```javascript
socket.on('newEventName', (data, callback) => {
  const session = getSession(data.sessionCode);
  if (!session) return callback({ success: false, message: 'Session not found' });
  // Process...
  callback({ success: true, data: result });
  // Broadcast to relevant rooms
  io.to(`session-${data.sessionCode}-audience`).emit('eventUpdate', updatedData);
});
```

2. Frontend call in `admin-v2.js` (or other client):
```javascript
socket.emit('newEventName', {
  sessionCode: currentSessionCode,
  // other data
}, (response) => {
  if (response.success) { /* handle success */ }
  else { showError(response.message); }
});
```

### Modifying Question Logic

Questions stored in `session.questions[]`. To modify:
1. Find question by ID: `const q = session.questions[questionId]`
2. Update property: `q.text = newText`
3. Broadcast: `io.to(...).emit('questionUpdated', q)`
4. See `editQuestion`, `duplicateQuestion`, `deleteQuestion` events for examples

### Exporting Results

REST endpoints (server-v2.js):
```javascript
GET /api/export/{sessionCode}/json   // Full session object as JSON
GET /api/export/{sessionCode}/csv    // Formatted CSV download
```

---

## Debugging Tips

1. **Enable verbose logging**: Set `LOG_LEVEL=DEBUG` in .env
2. **Check Socket.IO connections**: Look for `socket-connected`, `socket-disconnected` logs
3. **Validate JSON**: Use `JSON.parse()` in try/catch for Socket.IO events
4. **localStorage inspection**: Open browser DevTools → Application → localStorage → mindpool_session_history
5. **Test endpoints with curl**: `curl http://localhost:3000/health`

---

## Documentation References

- **COMECE_AQUI.md** - Quick start (2 min read)
- **MAPA_VISUAL.md** - Architecture diagrams & data structures
- **API_EXEMPLOS.md** - Full Socket.IO & REST event catalog
- **GUIA_ATUALIZACAO_v1.17.md** - Integration guide with v1.17 features
- **test.sh** - Automated test suite

---

## Version Notes

**Current**: v1.17 (latest - unified)
- Single `server.js` and `admin.js` files
- Password hashing with bcryptjs
- Rate limiting
- Question edit/duplicate/delete
- Session history in localStorage
- Structured logging
- CSV/JSON export

**Legacy**: v1.16 (archived in `.archive/`) - Reference only, do not use
