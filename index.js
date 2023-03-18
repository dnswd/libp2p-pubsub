import { createLibp2p } from 'libp2p'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { webRTCStar } from '@libp2p/webrtc-star'
import { noise } from "@chainsafe/libp2p-noise"
import { mplex } from '@libp2p/mplex'
import wrtc from "wrtc"
const star = webRTCStar({ wrtc: wrtc })

const node = await createLibp2p({
    addresses: {
        listen: [
            '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
            '/dns4/wrtc-star2.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
        ]
    },
    connectionManager: {
        pollInterval: 5000,
        autoDial: true, // auto dial to peers we find when we have less peers than `connectionManager.minPeers`
    },
    pubsub: gossipsub({
        allowPublishToZeroPeers: true
    }),
    transports: [
        star.transport
    ],
    streamMuxers: [mplex()],
    peerDiscovery: [
        star.discovery,

    ],
    connectionEncryption: [noise()],
})

await node.start()
console.log(`${Math.floor(new Date().getTime() / 1000)} Node started`)

const topic = 'my-topic'
await node.pubsub.subscribe(topic)

node.pubsub.addEventListener('message', (msg) => {
    console.log(`${Math.floor(new Date().getTime() / 1000)} Received message [${msg.detail.topic}] ${new TextDecoder().decode(msg.detail.data)}`)
})

node.connectionManager.addEventListener('peer:connect', async (evt) => {
    console.log(`${Math.floor(new Date().getTime() / 1000)} CONNECTED PEER`)
    const msg = new TextEncoder().encode('banana2')
    await node.pubsub.publish(topic, msg)
})

// Listen for new peers
node.addEventListener('peer:discovery', (evt) => {
    console.log(`Discovered ${evt.detail.id.toString()}`)
    if (evt.detail.id.toString() === "12D3KooWBDjKD1wNqQhv7N1furfzg1XCm5SRA98msbjszNbWzhjv") {
        throw new Error("FOUND BANANA")
    }

    //dial them when we discover them
    node.dial(evt.detail.id).catch(err => {
        console.log(`Could not dial ${evt.detail.id}`)
    })
})

console.log(`libp2p id is ${node.peerId.toString()}`)