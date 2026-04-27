const multiplayer = (() => {
  let socket = null;
  let joinedRoomId = null;
  let currentStatus = '未接続';
  let playersInRoom = 0;
  let readyPlayersInRoom = 0;
  let isReadyPressed = false;
  const DEFAULT_WS_URL = 'wss://tetris-multiplayer-8et5.onrender.com';

  const statusEl = () => document.getElementById('multiplayerStatus');
  const roomInputEl = () => document.getElementById('roomInput');
  const joinBtnEl = () => document.getElementById('joinRoomBtn');
  const leaveBtnEl = () => document.getElementById('leaveRoomBtn');
  const startBtnEl = () => document.getElementById('startGameBtn');

  function setStatus(text) {
    currentStatus = text;
    const el = statusEl();
    if (el) el.textContent = text;
  }

  function cleanupSocket() {
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
    socket = null;
    joinedRoomId = null;
    playersInRoom = 0;
    readyPlayersInRoom = 0;
    isReadyPressed = false;
    updateStartButton();
  }

  function safeSend(payload) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  }

  function leaveRoom() {
    cleanupSocket();
    setStatus('切断しました');
    if (typeof window.onRoomLeft === 'function') {
      window.onRoomLeft();
    }
  }

  function updateStartButton() {
    const startBtn = startBtnEl();
    if (!startBtn) return;

    if (!joinedRoomId) {
      startBtn.disabled = true;
      startBtn.textContent = 'ゲームを開始します';
      return;
    }

    if (playersInRoom < 2) {
      startBtn.disabled = true;
      startBtn.textContent = '相手を待機中';
      return;
    }

    if (isReadyPressed) {
      startBtn.disabled = true;
      startBtn.textContent = '開始準備OK';
      return;
    }

    startBtn.disabled = false;
    startBtn.textContent = 'ゲームを開始します';
  }

  function updateRoomState(players, readyPlayers) {
    playersInRoom = players;
    readyPlayersInRoom = readyPlayers;
    updateStartButton();

    if (!joinedRoomId) return;

    if (playersInRoom < 2) {
      setStatus(`接続完了: ${joinedRoomId} / 待機中 (${playersInRoom}/2)`);
      if (typeof window.onLobbyWaiting === 'function') {
        window.onLobbyWaiting('接続完了。相手の参加を待っています...');
      }
      return;
    }

    if (readyPlayersInRoom < 2) {
      setStatus(`2人接続済み: 開始準備 ${readyPlayersInRoom}/2`);
      if (typeof window.onLobbyWaiting === 'function') {
        window.onLobbyWaiting(`両者の開始待ち (${readyPlayersInRoom}/2)`);
      }
      return;
    }
  }

  function joinRoom() {
    const serverUrl = DEFAULT_WS_URL;
    const roomId = roomInputEl().value.trim().toUpperCase();

    if (!roomId) {
      setStatus('ルームIDを入力してください');
      return;
    }

    cleanupSocket();

    setStatus('接続中...');
    socket = new WebSocket(serverUrl);

    socket.onopen = () => {
      safeSend({ type: 'join_room', roomId });
    };

    socket.onmessage = (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === 'joined_room') {
        joinedRoomId = message.roomId;
        isReadyPressed = false;
        updateRoomState(message.players, message.readyPlayers || 0);
        if (typeof window.onRoomJoined === 'function') {
          window.onRoomJoined(message.players);
        }
        return;
      }
      if (message.type === 'room_update') {
        updateRoomState(message.players, message.readyPlayers || 0);
        return;
      }
      if (message.type === 'ready_ack') {
        isReadyPressed = true;
        updateStartButton();
        return;
      }
      if (message.type === 'match_start') {
        setStatus(`対戦開始: ${joinedRoomId}`);
        isReadyPressed = false;
        updateStartButton();
        if (typeof window.onMatchStart === 'function') {
          window.onMatchStart();
        }
        return;
      }
      if (message.type === 'receive_garbage') {
        if (typeof window.onReceiveGarbage === 'function') {
          window.onReceiveGarbage(message.amount);
        }
        return;
      }
      if (message.type === 'you_win') {
        setStatus('相手がゲームオーバー: あなたの勝ち');
        return;
      }
      if (message.type === 'opponent_left') {
        setStatus('相手が退出しました');
        isReadyPressed = false;
        updateStartButton();
        if (typeof window.onOpponentLeft === 'function') {
          window.onOpponentLeft();
        }
        return;
      }
      if (message.type === 'error') {
        setStatus(`エラー: ${message.message}`);
      }
    };

    socket.onerror = () => {
      setStatus('接続エラー');
    };

    socket.onclose = () => {
      if (joinedRoomId) {
        setStatus(`切断: ${joinedRoomId}`);
      } else {
        setStatus('未接続');
      }
      joinedRoomId = null;
      socket = null;
      playersInRoom = 0;
      readyPlayersInRoom = 0;
      isReadyPressed = false;
      updateStartButton();
      if (typeof window.onRoomLeft === 'function') {
        window.onRoomLeft();
      }
    };
  }

  function readyForStart() {
    if (!joinedRoomId) {
      setStatus('先にルーム参加してください');
      return;
    }
    if (playersInRoom < 2) {
      setStatus('相手の参加を待っています');
      return;
    }
    if (isReadyPressed) {
      setStatus('あなたは準備完了済みです');
      return;
    }
    safeSend({ type: 'player_ready' });
  }

  function sendGarbage(amount) {
    if (!joinedRoomId) return;
    safeSend({ type: 'send_garbage', amount });
  }

  function notifyLost() {
    if (!joinedRoomId) return;
    safeSend({ type: 'player_lost' });
  }

  function initUI() {
    joinBtnEl().addEventListener('click', joinRoom);
    leaveBtnEl().addEventListener('click', leaveRoom);
    startBtnEl().addEventListener('click', readyForStart);
    updateStartButton();
    setStatus(currentStatus);
  }

  return {
    initUI,
    readyForStart,
    sendGarbage,
    notifyLost
  };
})();
