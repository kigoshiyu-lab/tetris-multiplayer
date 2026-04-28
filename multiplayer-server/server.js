const { WebSocketServer } = require('ws');

const port = Number(process.env.PORT || 8080);
const wss = new WebSocketServer({ port });

const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: new Set(),
      readyPlayers: new Set()
    });
  }
  return rooms.get(roomId);
}

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(room, payload, exclude = null) {
  room.players.forEach((player) => {
    if (player !== exclude) {
      send(player, payload);
    }
  });
}

function removeFromRoom(ws) {
  const { roomId } = ws.meta || {};
  if (!roomId || !rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  room.readyPlayers.delete(ws);
  room.players.delete(ws);
  broadcast(room, { type: 'opponent_left' }, ws);
  broadcast(room, { type: 'room_update', players: room.players.size, readyPlayers: room.readyPlayers.size });

  if (room.players.size === 0) {
    rooms.delete(roomId);
  }
}

wss.on('connection', (ws) => {
  ws.meta = { roomId: null };
  send(ws, { type: 'connected' });

  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'error', message: 'invalid_json' });
      return;
    }

    if (message.type === 'join_room') {
      const roomId = String(message.roomId || '').trim().toUpperCase();
      if (!roomId) {
        send(ws, { type: 'error', message: 'room_id_required' });
        return;
      }

      removeFromRoom(ws);
      const room = getOrCreateRoom(roomId);

      if (room.players.size >= 2) {
        send(ws, { type: 'error', message: 'room_full' });
        return;
      }

      room.players.add(ws);
      ws.meta.roomId = roomId;
      room.readyPlayers.delete(ws);

      send(ws, { type: 'joined_room', roomId, players: room.players.size, readyPlayers: room.readyPlayers.size });
      broadcast(room, { type: 'room_update', players: room.players.size, readyPlayers: room.readyPlayers.size });
      return;
    }

    if (message.type === 'player_ready') {
      const roomId = ws.meta.roomId;
      if (!roomId || !rooms.has(roomId)) return;
      const room = rooms.get(roomId);

      if (!room.players.has(ws)) return;
      room.readyPlayers.add(ws);

      send(ws, { type: 'ready_ack' });
      broadcast(room, { type: 'room_update', players: room.players.size, readyPlayers: room.readyPlayers.size });

      if (room.players.size === 2 && room.readyPlayers.size === 2) {
        room.readyPlayers.clear();
        broadcast(room, { type: 'match_start' });
      }
      return;
    }

    if (message.type === 'send_garbage') {
      const roomId = ws.meta.roomId;
      if (!roomId || !rooms.has(roomId)) return;

      const amount = Number(message.amount || 0);
      if (!Number.isInteger(amount) || amount <= 0) return;

      const room = rooms.get(roomId);
      broadcast(room, { type: 'receive_garbage', amount }, ws);
      return;
    }

    if (message.type === 'player_lost') {
      const roomId = ws.meta.roomId;
      if (!roomId || !rooms.has(roomId)) return;
      const room = rooms.get(roomId);
      broadcast(room, { type: 'you_win' }, ws);
      return;
    }

    if (message.type === 'use_item') {
      const roomId = ws.meta.roomId;
      if (!roomId || !rooms.has(roomId)) return;
      const itemType = String(message.itemType || '');
      const allowed = new Set([
        'fog_top',
        'fog_bottom',
        'control_swap',
        'hide_stack',
        'shuffle_stack'
      ]);
      if (!allowed.has(itemType)) return;
      const room = rooms.get(roomId);
      broadcast(room, { type: 'item_effect', itemType }, ws);
    }
  });

  ws.on('close', () => {
    removeFromRoom(ws);
  });
});

console.log(`WebSocket server is running on port ${port}`);
