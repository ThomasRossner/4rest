#!/bin/bash
# Legt den IONOS-Schlüssel in den ssh-agent.
# Erwartet IONOS_SSH_PASSPHRASE.
# Optional: IONOS_SSH_KEY_PATH (Standard: ~/.ssh/id_ed25519).

ionos_require_passphrase() {
  if [ -z "${IONOS_SSH_PASSPHRASE:-}" ]; then
    echo "ERROR: IONOS_SSH_PASSPHRASE ist nicht gesetzt." >&2
    echo "Lokal: export IONOS_SSH_PASSPHRASE='…'" >&2
    echo "GitHub: Actions-Secret IONOS_SSH_PASSPHRASE." >&2
    return 1
  fi
}

ionos_ssh_add_key() {
  ionos_require_passphrase || return 1
  local key="${IONOS_SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
  if [ ! -f "$key" ]; then
    echo "ERROR: SSH-Schlüssel nicht gefunden: $key" >&2
    return 1
  fi

  if [ -z "${SSH_AUTH_SOCK:-}" ]; then
    eval "$(ssh-agent -s)" >/dev/null
  fi

  local fingerprint
  fingerprint="$(ssh-keygen -lf "$key" | awk '{print $2}')"
  if ssh-add -l 2>/dev/null | grep -q "$fingerprint"; then
    return 0
  fi

  local askpass
  askpass="$(mktemp)"
  cat > "$askpass" << 'EOF'
#!/bin/sh
printf '%s\n' "$IONOS_SSH_PASSPHRASE"
EOF
  chmod 700 "$askpass"
  DISPLAY="${DISPLAY:-:0}" SSH_ASKPASS="$askpass" SSH_ASKPASS_REQUIRE=force \
    ssh-add "$key" </dev/null
  local status=$?
  rm -f "$askpass"
  if [ "$status" -ne 0 ]; then
    echo "ERROR: ssh-add für $key ist fehlgeschlagen." >&2
    return "$status"
  fi
}
