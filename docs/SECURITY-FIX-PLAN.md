# Security Vulnerability Fix Plan

**Date:** 2026-01-21  
**Status:** Planning  
**Total Vulnerabilities:** 8 (3 moderate, 5 high)

## Executive Summary

This plan addresses 8 security vulnerabilities across 3 dependency chains:
1. **Electron** (moderate) - ASAR Integrity Bypass
2. **Vite/esbuild** (moderate) - Development server vulnerability  
3. **electron-builder/tar** (high) - File overwrite and symlink poisoning

All fixes require major version upgrades with potential breaking changes. This plan uses a phased, tested approach to minimize risk.

---

## Vulnerability Details

### 🔴 HIGH PRIORITY (5 vulnerabilities)

#### 1. tar - Arbitrary File Overwrite (GHSA-8qq5-rm4j-mr97)
- **Severity:** High
- **Affected:** `tar <=7.5.2`
- **Via:** `electron-builder@24.9.1` → `app-builder-lib` → `tar`
- **Impact:** Attackers could overwrite arbitrary files during package extraction
- **Fix:** Upgrade `electron-builder` to `^26.5.0`
- **Breaking Changes:** Yes - major version jump (24 → 26)

### 🟡 MODERATE PRIORITY (3 vulnerabilities)

#### 2. Electron - ASAR Integrity Bypass (GHSA-vmqv-hx8q-j7mg)
- **Severity:** Moderate
- **Affected:** `electron <35.7.5`
- **Current:** `electron@28.1.0`
- **Impact:** ASAR file integrity can be bypassed via resource modification
- **Fix Options:**
  - **Option A (Recommended):** Upgrade to `electron@35.7.5` (latest stable in v35)
  - **Option B:** Upgrade to `electron@40.0.0` (latest, more breaking changes)
- **Breaking Changes:** Yes - major version jump (28 → 35 or 40)

#### 3. esbuild/Vite - Dev Server Vulnerability (GHSA-67mh-4wv8-2f99)
- **Severity:** Moderate
- **Affected:** `esbuild <=0.24.2` (via `vite@5.0.11`)
- **Impact:** Any website can send requests to dev server and read responses
- **Fix:** Upgrade `vite` to `^7.3.1`
- **Breaking Changes:** Yes - major version jump (5 → 7)
- **Note:** Only affects development server, not production builds

---

## Fix Strategy

### Phase 1: High Priority - electron-builder/tar (Week 1)
**Goal:** Fix the 5 high-severity vulnerabilities first

#### Step 1.1: Backup & Branch
```bash
git checkout -b security/fix-electron-builder
git tag backup/pre-security-fix
```

#### Step 1.2: Upgrade electron-builder
```bash
npm install --save-dev electron-builder@^26.5.0
```

#### Step 1.3: Test Build Process
- [ ] Run `npm run electron:compile` - verify TypeScript compilation
- [ ] Run `npm run electron:pack` - verify unpacked build works
- [ ] Run `npm run electron:build` - verify full installer build
- [ ] Test installer on clean VM/container
- [ ] Verify secure storage still works in built app

#### Step 1.4: Update Documentation
- [ ] Update README.md with new electron-builder version
- [ ] Document any build configuration changes

#### Step 1.5: Commit & Test
```bash
git add package.json package-lock.json
git commit -m "security: upgrade electron-builder to 26.5.0 (fixes 5 high-severity tar vulnerabilities)"
npm audit  # Verify tar vulnerabilities are resolved
```

---

### Phase 2: Moderate Priority - Electron (Week 1-2)
**Goal:** Fix ASAR integrity bypass vulnerability

#### Step 2.1: Research Breaking Changes
Review Electron changelog for v28 → v35:
- [ ] Check Node.js version requirements
- [ ] Review API deprecations
- [ ] Check `safeStorage` API compatibility
- [ ] Review `BrowserWindow` webPreferences changes

#### Step 2.2: Upgrade Electron (Conservative)
```bash
npm install --save-dev electron@^35.7.5
```

#### Step 2.3: Update Electron Code
Check and update if needed:
- [ ] `electron/main.ts` - verify BrowserWindow API compatibility
- [ ] `electron/preload.ts` - verify contextBridge API compatibility
- [ ] `electron/electron.d.ts` - update type definitions if needed
- [ ] Update dev server port reference (currently hardcoded to 3002)

#### Step 2.4: Test Electron App
- [ ] Run `npm run electron:dev` - verify dev mode works
- [ ] Test secure storage encryption/decryption
- [ ] Test window creation and lifecycle
- [ ] Test IPC communication
- [ ] Run `npm run electron:build` - verify production build
- [ ] Test built app on target platforms (Windows/Mac/Linux)

#### Step 2.5: Fix Port Reference
Update `electron/main.ts` line 29 to use Vite config port (3005):
```typescript
mainWindow.loadURL('http://localhost:3005');
```

#### Step 2.6: Commit & Test
```bash
git add .
git commit -m "security: upgrade electron to 35.7.5 (fixes ASAR integrity bypass)"
npm audit  # Verify electron vulnerability is resolved
```

---

### Phase 3: Moderate Priority - Vite/esbuild (Week 2)
**Goal:** Fix development server vulnerability

#### Step 3.1: Research Vite 7 Breaking Changes
- [ ] Review Vite 7 migration guide
- [ ] Check plugin compatibility (@vitejs/plugin-react)
- [ ] Review build output changes
- [ ] Check TypeScript/Vite integration

#### Step 3.2: Upgrade Vite
```bash
npm install --save-dev vite@^7.3.1
npm install --save-dev @vitejs/plugin-react@latest
```

#### Step 3.3: Update Vite Config
Check `vite.config.ts` for compatibility:
- [ ] Verify plugin syntax
- [ ] Check base path configuration
- [ ] Verify server configuration
- [ ] Test HMR (Hot Module Replacement)

#### Step 3.4: Test Development
- [ ] Run `npm run dev` - verify dev server starts
- [ ] Test hot reloading
- [ ] Test build: `npm run build`
- [ ] Test preview: `npm run preview`
- [ ] Verify all panels load correctly
- [ ] Test API calls and WebSocket connections

#### Step 3.5: Commit & Test
```bash
git add .
git commit -m "security: upgrade vite to 7.3.1 (fixes esbuild dev server vulnerability)"
npm audit  # Verify all vulnerabilities are resolved
```

---

## Testing Checklist

### Pre-Upgrade Baseline
- [ ] Document current behavior
- [ ] Run full test suite: `npm run ralph`
- [ ] Test API endpoints: `npm run test:api`
- [ ] Build and test web version
- [ ] Build and test Electron version
- [ ] Test on all target platforms

### Post-Upgrade Verification
- [ ] Run `npm audit` - should show 0 vulnerabilities
- [ ] Run full test suite: `npm run ralph`
- [ ] Test API endpoints: `npm run test:api`
- [ ] Test web dev server: `npm run dev`
- [ ] Test web build: `npm run build && npm run preview`
- [ ] Test Electron dev: `npm run electron:dev`
- [ ] Test Electron build: `npm run electron:build`
- [ ] Test secure storage in Electron app
- [ ] Test all 18 panels load correctly
- [ ] Test command bar functionality
- [ ] Test workspace layout persistence
- [ ] Test API authentication and requests
- [ ] Test WebSocket connections
- [ ] Performance check: verify bundle size hasn't increased significantly

---

## Rollback Plan

If issues arise during upgrade:

1. **Immediate Rollback:**
   ```bash
   git checkout backup/pre-security-fix
   npm install
   ```

2. **Partial Rollback:**
   - Revert specific phase commits
   - Keep working upgrades, rollback problematic ones

3. **Alternative Approach:**
   - If Electron 35 has issues, try Electron 33.x (intermediate)
   - If Vite 7 has issues, check if Vite 6.x has fix

---

## Risk Assessment

| Phase | Risk Level | Mitigation |
|-------|-----------|------------|
| Phase 1 (electron-builder) | Low | Build tool only, doesn't affect runtime |
| Phase 2 (Electron) | Medium | Major version jump, but APIs appear stable |
| Phase 3 (Vite) | Low | Dev-only vulnerability, can test thoroughly |

---

## Timeline Estimate

- **Phase 1:** 2-4 hours (testing included)
- **Phase 2:** 4-8 hours (if breaking changes found)
- **Phase 3:** 2-4 hours (testing included)
- **Total:** 1-2 days of focused work

---

## Success Criteria

✅ All 8 vulnerabilities resolved (npm audit shows 0)  
✅ All existing functionality works  
✅ Build processes complete successfully  
✅ Test suite passes  
✅ No performance regressions  
✅ Documentation updated

---

## Notes

- **Development Server Vulnerability:** The esbuild/Vite issue only affects the dev server. Production builds are not vulnerable. This can be deprioritized if needed.

- **Electron Version Choice:** Electron 35.7.5 is recommended over 40.0.0 to minimize breaking changes while still fixing the vulnerability.

- **Testing Priority:** Focus on Electron app testing since that's where most breaking changes are likely.

---

## References

- [Electron Security Advisory GHSA-vmqv-hx8q-j7mg](https://github.com/advisories/GHSA-vmqv-hx8q-j7mg)
- [esbuild Security Advisory GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- [tar Security Advisory GHSA-8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97)
- [Electron v35 Release Notes](https://www.electronjs.org/docs/latest/breaking-changes)
- [Vite 7 Migration Guide](https://vitejs.dev/guide/migration)
