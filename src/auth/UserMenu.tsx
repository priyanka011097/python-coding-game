import { useEffect, useState } from "react";
import type { AuthUser } from "./useAuth";
import type { SyncStatus } from "../sync/progressSync";
import { onSyncStatus } from "../sync/progressSync";



interface UserMenuProps {
  user: AuthUser;
  onLogout: () => Promise<void>;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [busy, setBusy] = useState<boolean>(false);
  const [imgOk, setImgOk] = useState<boolean>(Boolean(user.picture));
  const [sync, setSync] = useState<SyncStatus>("off");
  const initial = (user.name || user.email).charAt(0).toUpperCase();

  useEffect(() => onSyncStatus(setSync), []);

  return (
    <div className="usermenu">
      {/* Saving happens quietly; only a failure is worth interrupting for. */}
      {sync === "error" && (
        <span
          className="usermenu__sync usermenu__sync--error"
          title="Could not reach the database. Changes are kept here and retried."
          role="status"
        >
          Not saved
        </span>
      )}
      {imgOk ? (
        <img
          className="usermenu__avatar"
          src={user.picture}
          alt=""
          // Google's avatar host refuses requests that carry a referrer.
          referrerPolicy="no-referrer"
          onError={() => setImgOk(false)}
        />
      ) : (
        <span className="usermenu__avatar usermenu__avatar--text" aria-hidden="true">
          {initial}
        </span>
      )}
      <span className="usermenu__name" title={user.email}>
        {user.name}
      </span>
      <button
        type="button"
        className="usermenu__out"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void onLogout().finally(() => setBusy(false));
        }}
      >
        {busy ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
