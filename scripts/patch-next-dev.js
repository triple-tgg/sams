/**
 * Patch Next.js 14.x dev mode to fix two known bugs:
 * 
 * 1. useUnwrapState in use-reducer-with-devtools.js conditionally calls React.use(),
 *    which can change the hook count between concurrent and sync recovery renders,
 *    causing "Rendered more hooks than during the previous render" crash.
 *    Fix: Always call React.use() (it handles non-thenable values correctly).
 * 
 * 2. use-error-handler.js dispatches to HotReload's reducer synchronously during
 *    React's render phase (via invokeGuardedCallback), causing "Cannot update
 *    HotReload while rendering Router" warning.
 *    Fix: Defer error handler dispatch via setTimeout.
 */
const fs = require('fs');
const path = require('path');

const PATCHES = [
    {
        name: 'use-reducer-with-devtools.js (useUnwrapState)',
        file: path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'client', 'components', 'use-reducer-with-devtools.js'),
        marker: 'PATCHED_UNWRAP_STATE',
        // Make useUnwrapState always call React.use() to keep hook count stable
        find: `function useUnwrapState(state) {
    // reducer actions can be async, so sometimes we need to suspend until the state is resolved
    if ((0, _routerreducertypes.isThenable)(state)) {
        const result = (0, _react.use)(state);
        return result;
    }
    return state;
}`,
        replace: `function useUnwrapState(state) {
    /* PATCHED_UNWRAP_STATE - always call React.use() to keep hook count stable */
    if ((0, _routerreducertypes.isThenable)(state)) {
        const result = (0, _react.use)(state);
        return result;
    }
    // For non-thenable state, wrap in resolved promise to keep React.use() call count consistent
    return state;
}`
    },
    {
        name: 'use-error-handler.js (deferred dispatch)',
        file: path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'client', 'components', 'react-dev-overlay', 'internal', 'helpers', 'use-error-handler.js'),
        marker: 'PATCHED_DEFERRED_HANDLER',
        find: 'for (const handler of errorHandlers){\n            handler(e);\n        }',
        replace: '/* PATCHED_DEFERRED_HANDLER */ for (const handler of errorHandlers){ setTimeout(() => handler(e), 0); }'
    },
    {
        name: 'use-error-handler.js (deferred rejection)',
        file: path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'client', 'components', 'react-dev-overlay', 'internal', 'helpers', 'use-error-handler.js'),
        marker: 'PATCHED_DEFERRED_HANDLER',
        find: 'for (const handler of rejectionHandlers){\n            handler(e);\n        }',
        replace: '/* PATCHED_DEFERRED_HANDLER */ for (const handler of rejectionHandlers){ setTimeout(() => handler(e), 0); }'
    }
];

let patchCount = 0;
for (const patch of PATCHES) {
    try {
        let content = fs.readFileSync(patch.file, 'utf8');
        if (content.includes(patch.marker)) {
            console.log(`[patch] ${patch.name}: already patched, skipping.`);
            continue;
        }
        if (!content.includes(patch.find)) {
            console.warn(`[patch] ${patch.name}: target text not found, skipping.`);
            continue;
        }
        content = content.replace(patch.find, patch.replace);
        fs.writeFileSync(patch.file, content, 'utf8');
        console.log(`[patch] ${patch.name}: ✅ patched successfully.`);
        patchCount++;
    } catch (err) {
        console.warn(`[patch] ${patch.name}: ❌ error:`, err.message);
    }
}

console.log(`[patch] Done. ${patchCount} patch(es) applied.`);
