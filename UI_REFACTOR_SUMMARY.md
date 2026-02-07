# UI Refactor: Consistent Discovery Toggle Pattern

## ✅ Changes Implemented

### Before (Inconsistent):
- **NMOS RDS**: "Connect RDS" button → Opens modal
- **AES67/SAP**: Toggle switch + Settings

### After (Consistent):
- **NMOS RDS**: Toggle switch + Settings ✅
- **AES67/SAP**: Toggle switch + Settings ✅

## Visual Comparison

### Old Header:
```
[Connect RDS] [Add Node] [Settings] [About]
    ↓ Opens modal
```

### New Header:
```
[Add Node] [Settings] [About]
          ↑ Simpler, cleaner
```

### New Discovery Controls:
```
┌─ Discovery Controls ────────────────────────────────────┐
│                                                          │
│  📡 NMOS RDS Discovery   [●──] OFF  Disabled  ⚙️        │
│  🎙️ AES67/SAP Discovery  [──●] ON   Connected ⚙️        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Settings Modal Updates

### New Tab Structure:
```
┌─ Settings ──────────────────────────────────────────┐
│                                                      │
│  [NMOS RDS] [AES67/SAP] [History] [Reset] [CORS]   │
│      ↑ NEW       ↑                                  │
│                                                      │
│  ┌─ NMOS RDS Configuration ────────────────────┐   │
│  │                                              │   │
│  │  Registry Query API URL:                    │   │
│  │  [http://192.168.1.100:3001___________]     │   │
│  │                                              │   │
│  │  [Test Connection] [Save Settings]          │   │
│  │                                              │   │
│  │  Status:                                     │   │
│  │  Connection:  Not configured                │   │
│  │  Discovered Nodes: 0                        │   │
│  │                                              │   │
│  │  Quick Setup:                                │   │
│  │  1. Enter Query API URL (port 3001)         │   │
│  │  2. Test Connection                          │   │
│  │  3. Save Settings                            │   │
│  │  4. Enable toggle on main page               │   │
│  │  5. Nodes auto-discovered!                   │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

## Files Modified

### HTML (`index.html`)
- ❌ Removed "Connect RDS" button from header
- ✅ Added NMOS RDS toggle control (matching AES67 style)
- ✅ Added NMOS RDS tab in Settings modal
- ❌ Removed old "Connect RDS" modal (no longer needed)

### JavaScript (`js/app.js`)
- ✅ Added `NMOSRDSConfig` import
- ✅ Added `nmosRdsEnabled` and `nmosRdsClient` state
- ✅ Added NMOS RDS initialization in `init()`
- ✅ Added toggle event listener
- ✅ Added settings button event listener
- ✅ Removed old Connect RDS modal event listeners

### New Files Created
- ✅ `js/nmosrds-config.js` - Configuration management (like AES67Config)

## Behavior Changes

### User Flow (NMOS RDS):

**Old Way:**
1. Click "Connect RDS" button
2. Modal opens
3. Enter registry URL
4. Click "Discover Nodes"
5. Select nodes from list
6. Click "Add Selected Nodes"
7. Nodes added

**New Way:**
1. Click Settings gear button next to NMOS toggle
2. Enter registry URL in Settings modal
3. Click "Save Settings"
4. Toggle NMOS RDS Discovery ON
5. Nodes auto-discovered in background
6. Available in node dropdowns

### Benefits:
- ✅ **Consistent UX**: Both protocols work the same way
- ✅ **Always-on discovery**: Toggle stays on, continuously discovers
- ✅ **Less clicks**: No modal, direct toggle
- ✅ **Cleaner UI**: Header less cluttered
- ✅ **Better UX symmetry**: NMOS RDS ↔ AES67/SAP mirrors

## Implementation Status

### Completed ✅
- [x] Remove "Connect RDS" button from header
- [x] Add NMOS RDS toggle control
- [x] Add NMOS RDS Settings tab
- [x] Remove old Connect RDS modal
- [x] Create NMOSRDSConfig class
- [x] Update app.js imports and state
- [x] Add toggle event listeners
- [x] Add settings button listeners
- [x] Remove old modal listeners

### TODO (Methods to implement)
- [ ] `initializeNMOSRDS()` - Initialize RDS client
- [ ] `handleNMOSRDSToggle(enabled)` - Handle toggle on/off
- [ ] `updateNMOSRDSStatus(status)` - Update status display
- [ ] `testNMOSRDSConnection()` - Test registry connection
- [ ] `saveNMOSRDSSettings()` - Save RDS configuration
- [ ] `updateNMOSRDSSettingsUI()` - Update settings UI

## Next Steps

The HTML and event listener setup is complete. The remaining work is to implement the actual methods in `app.js` that handle:

1. **Discovery Logic**: Auto-discover nodes when toggle is ON
2. **Connection Testing**: Verify registry URL works
3. **Settings Management**: Save/load configuration
4. **Status Updates**: Show connection status in UI

These methods should mirror the existing AES67 methods but call `NMOSClient.discoverFromRDS()` instead.

## Design Philosophy

This refactor achieves:
- **Consistency**: Both protocols use identical UI patterns
- **Discoverability**: Settings clearly associated with toggles
- **Simplicity**: Fewer clicks, clearer workflow
- **Scalability**: Easy to add more discovery protocols in future

---

**Status**: HTML/UI Complete ✅
**Next**: Implement JavaScript methods for NMOS RDS discovery logic
