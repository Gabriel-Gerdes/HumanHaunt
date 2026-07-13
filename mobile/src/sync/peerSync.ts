import TcpSocket from 'react-native-tcp-socket';
import type Server from 'react-native-tcp-socket/lib/types/Server';
import type Socket from 'react-native-tcp-socket/lib/types/Socket';

import type { ClaimEvent, Device } from '../domain/types';

export const DEFAULT_SYNC_PORT = 45678;

type SyncMessage =
  | {
      type: 'hello';
      device: Device;
    }
  | {
      type: 'request_events';
      deviceId: string;
    }
  | {
      type: 'claim_events';
      events: ClaimEvent[];
    };

type PeerSyncOptions = {
  device: Device;
  getEvents: () => Promise<ClaimEvent[]>;
  importEvents: (events: ClaimEvent[]) => Promise<number>;
  onImportedEvents: () => void;
  onStatus: (status: string) => void;
};

export class PeerSyncService {
  private readonly options: PeerSyncOptions;
  private readonly sockets = new Set<Socket>();
  private readonly buffers = new Map<Socket, string>();
  private server?: Server;

  constructor(options: PeerSyncOptions) {
    this.options = options;
  }

  startServer(port = DEFAULT_SYNC_PORT) {
    if (this.server?.listening) {
      this.options.onStatus(`Already hosting on port ${port}`);
      return;
    }

    this.server = TcpSocket.createServer(socket => {
      this.attachSocket(socket, 'incoming peer');
      this.sendHello(socket);
      this.sendEvents(socket);
    });

    this.server.on('error', error => {
      this.options.onStatus(`Host error: ${error.message}`);
    });

    this.server.listen(
      {
        host: '0.0.0.0',
        port,
        reuseAddress: true,
      },
      () => {
        this.options.onStatus(`Hosting peer sync on port ${port}`);
      },
    );
  }

  connectToPeer(host: string, port = DEFAULT_SYNC_PORT) {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const socket = TcpSocket.createConnection(
        {
          host,
          port,
          connectTimeout: 5000,
        },
        () => {
          settled = true;
          this.attachSocket(socket, host);
          this.sendHello(socket);
          this.sendEvents(socket);
          this.options.onStatus(`Connected to ${host}:${port}`);
          resolve();
        },
      );

      socket.on('error', error => {
        this.options.onStatus(`Peer error: ${error.message}`);

        if (!settled) {
          settled = true;
          reject(error);
        }
      });
    });
  }

  async broadcastEvents() {
    const events = await this.options.getEvents();

    for (const socket of this.sockets) {
      this.send(socket, {
        type: 'claim_events',
        events,
      });
    }
  }

  stop() {
    for (const socket of this.sockets) {
      socket.destroy();
    }

    this.sockets.clear();
    this.buffers.clear();

    if (this.server) {
      this.server.close();
      this.server = undefined;
    }

    this.options.onStatus('Peer sync stopped');
  }

  private attachSocket(socket: Socket, label: string) {
    this.sockets.add(socket);
    this.buffers.set(socket, '');
    this.options.onStatus(`Peer connected: ${label}`);

    socket.on('data', data => {
      this.handleData(socket, data.toString());
    });

    socket.on('close', () => {
      this.sockets.delete(socket);
      this.buffers.delete(socket);
      this.options.onStatus(`Peer disconnected: ${label}`);
    });

    socket.on('error', error => {
      this.options.onStatus(`Peer socket error: ${error.message}`);
    });
  }

  private async sendHello(socket: Socket) {
    this.send(socket, {
      type: 'hello',
      device: this.options.device,
    });

    this.send(socket, {
      type: 'request_events',
      deviceId: this.options.device.id,
    });
  }

  private async sendEvents(socket: Socket) {
    this.send(socket, {
      type: 'claim_events',
      events: await this.options.getEvents(),
    });
  }

  private send(socket: Socket, message: SyncMessage) {
    socket.write(`${JSON.stringify(message)}\n`);
  }

  private handleData(socket: Socket, chunk: string) {
    const buffered = `${this.buffers.get(socket) ?? ''}${chunk}`;
    const lines = buffered.split('\n');
    const remainder = lines.pop() ?? '';

    this.buffers.set(socket, remainder);

    for (const line of lines) {
      if (line.trim()) {
        this.handleMessage(socket, line);
      }
    }
  }

  private async handleMessage(socket: Socket, line: string) {
    try {
      const message = JSON.parse(line) as SyncMessage;

      if (message.type === 'hello') {
        this.options.onStatus(`Peer hello: ${message.device.name}`);
        return;
      }

      if (message.type === 'request_events') {
        await this.sendEvents(socket);
        return;
      }

      if (message.type === 'claim_events') {
        const importedCount = await this.options.importEvents(message.events);

        if (importedCount > 0) {
          this.options.onStatus(`Imported ${importedCount} peer claims`);
          this.options.onImportedEvents();
        } else {
          this.options.onStatus('Peer claims already up to date');
        }
      }
    } catch (error) {
      this.options.onStatus(`Ignored invalid sync message: ${String(error)}`);
    }
  }
}
