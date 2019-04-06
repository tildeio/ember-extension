import { run } from '@ember/runloop';
import BasicAdapter from './basic';

export default BasicAdapter.extend({
  init() {
    this._super();
    this.socket = window.EMBER_INSPECTOR_CONFIG.remoteDebugSocket;
    this._connect();
  },

  sendMessage(options) {
    options = options || {};
    this.get('socket').emit('emberInspectorMessage', options);
  },

  _connect() {
    this.get('socket').on('emberInspectorMessage', message => {
      run(() => {
        this._messageReceived(message);
      });
    });
  },

  _disconnect() {
    this.get('socket').removeAllListeners('emberInspectorMessage');
  },

  willDestroy() {
    this._disconnect();
  }
});

