import { type AudioPcm } from '@kinetographdev/audio';
import type { AudioClipJson } from '@kinetographdev/scene';
/** How many peaks the mix and each clip keep; a request for fewer buckets takes the loudest of the ones it covers. */
export declare const PEAK_BUCKETS = 4096;
/** The mixed audio of a composition, over all its frames. */
export interface AudioMix {
    /** 16-bit stereo PCM WAV of the whole composition. */
    wav: Uint8Array;
    sampleRate: number;
    seconds: number;
    /** Peaks (0..1) of the whole mix, `PEAK_BUCKETS` of them across the composition. */
    peaks: number[];
    /** Peaks of each clip alone, across the frames it plays in (first frame, then the one after its last). */
    clips: {
        id: string;
        startFrame: number;
        endFrame: number;
        peaks: number[];
    }[];
}
/** The loudest sample in each of `buckets` equal slices of samples `begin..end` of any channel, 0..1. */
export declare function peaksOf(channels: Float32Array[], begin: number, end: number, buckets: number): number[];
/** `pcm` as a 16-bit PCM WAV file. */
export declare function encodeWav(pcm: AudioPcm): Uint8Array;
/** The mix of the clips seen on each frame; null when the composition has no sound. */
export declare function mixAudio(frames: {
    frame: number;
    audio: AudioClipJson[];
}[], info: {
    fps: number;
    durationInFrames: number;
    baseDir: string;
}): Promise<AudioMix | null>;
//# sourceMappingURL=audio-mix.d.ts.map