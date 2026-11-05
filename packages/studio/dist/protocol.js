// The studio's HTTP and WebSocket API (packages/cli/skills/kinetograph/references/AUTHORING.md §11.5). The server
// answers with these shapes and the UI reads them; both import this file:
// types and the binary frame codec, nothing that touches Node or the DOM.
/** Splits a binary frame message into its header and image bytes. */
export function decodeFrameMessage(message) {
    const bytes = message instanceof Uint8Array ? message : new Uint8Array(message);
    const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true);
    const header = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + length)));
    return { header, image: bytes.subarray(4 + length) };
}
/** The binary frame message for `header` and `image`. */
export function encodeFrameMessage(header, image) {
    const json = new TextEncoder().encode(JSON.stringify(header));
    const out = new Uint8Array(4 + json.length + image.length);
    new DataView(out.buffer).setUint32(0, json.length, true);
    out.set(json, 4);
    out.set(image, 4 + json.length);
    return out;
}
//# sourceMappingURL=protocol.js.map