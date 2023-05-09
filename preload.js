/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const dgram = require('dgram');
const { contextBridge } = require('electron');
const { pack } = require('msgpackr');

const client = dgram.createSocket('udp4');
const sendBuffer = async (messageObj) => client.send(pack(messageObj), 9000, 'localhost', (err) => {
  err && console.log(err);
});
contextBridge.exposeInMainWorld('dgram', {
  sendBuffer
}
  // we can also expose variables, not just functions
);