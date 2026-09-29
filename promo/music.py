"""Synthesises the ad's background music + sound effects into music.wav.

Everything is generated from code (no samples), so the track is royalty-free.
Cue times match the scene timeline in ad.html.
"""
import wave

import numpy as np

SR = 44100
DUR = 32.0
N = int(SR * DUR)
out = np.zeros(N)

DROP = 3.4                 # logo reveal: the groove starts here
CTA = 27.6                 # final scene
BEAT = (CTA - DROP) / 48   # ~119 BPM so that the CTA lands on a downbeat
BAR = BEAT * 4


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.005, d=0.25, s=0.0, r=0.05, length=None):
    length = length or n
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = int(r * SR)
    if rel and length < n:
        e[length:] *= np.exp(-np.arange(n - length) / rel)
    return e


def add(sig, at, gain=1.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    out[i : i + len(sig)] += sig * gain


def osc(freq, dur, kind='sine'):
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * freq * t
    if kind == 'sine':
        return np.sin(ph)
    if kind == 'tri':
        return 2 / np.pi * np.arcsin(np.sin(ph))
    if kind == 'square':
        return np.tanh(np.sin(ph) * 4) * 0.6
    if kind == 'saw':
        return 2 * (t * freq % 1) - 1
    raise ValueError(kind)


def pluck(note, at, dur=0.35, gain=0.18, kind='square'):
    f = midi(note)
    s = osc(f, dur, kind) * 0.7 + osc(f * 2, dur, 'sine') * 0.2
    add(s * env(len(s), 0.003, dur * 0.35), at, gain)


def pad(notes, at, dur, gain=0.05):
    n = int(dur * SR)
    s = np.zeros(n)
    for note in notes:
        for det in (-0.08, 0.08):
            s += osc(midi(note + det), dur, 'saw')
    # crude low-pass: moving average
    k = 24
    s = np.convolve(s, np.ones(k) / k, mode='same')
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.35)
    add(s * e, at, gain)


def kick(at, gain=0.55):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    add(s, at, gain)


rng = np.random.default_rng(7)


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR))


def hat(at, gain=0.05):
    s = noise(0.05)
    s = s - np.convolve(s, np.ones(6) / 6, mode='same')  # high-pass-ish
    add(s * env(len(s), 0.001, 0.015), at, gain)


def clap(at, gain=0.16):
    s = noise(0.18)
    s = np.convolve(s, np.ones(3) / 3, mode='same')
    e = env(len(s), 0.001, 0.05)
    for off in (0.0, 0.012, 0.024):
        add(s * e, at + off, gain / 2)


def whoosh(at, dur=0.4, gain=0.12, up=True):
    s = noise(dur)
    n = len(s)
    t = np.arange(n) / n
    # sweep a simple resonant band by varying the smoothing window
    outw = np.zeros(n)
    for i in range(0, n, 512):
        p = t[i] if up else 1 - t[i]
        k = int(40 - 34 * p)
        seg = s[i : i + 512 + k]
        outw[i : i + 512] = np.convolve(seg, np.ones(k) / k, mode='same')[:512][: len(outw[i : i + 512])]
    e = np.sin(np.pi * t) ** 2
    add(outw * e * 3, at, gain)


def blip(note, at, gain=0.16, dur=0.12):
    f = midi(note)
    t = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * (f * t + f * 0.6 * t * t / dur))  # upward chirp
    add(s * env(len(s), 0.002, dur * 0.4), at, gain)


def ding(note, at, gain=0.18):
    for k, g in ((1, 1), (2, 0.4), (3, 0.15)):
        s = osc(midi(note) * k, 0.9, 'sine')
        add(s * env(len(s), 0.002, 0.3), at, gain * g)


def boing(at, gain=0.2):
    dur = 0.45
    t = np.arange(int(dur * SR)) / SR
    f = 180 + 260 * np.exp(-t * 6) * (1 + 0.3 * np.sin(2 * np.pi * 14 * t))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    add(s * env(len(s), 0.004, 0.18), at, gain)


def crash(at, gain=0.12):
    s = noise(1.6)
    s = s - np.convolve(s, np.ones(4) / 4, mode='same')
    add(s * env(len(s), 0.002, 0.5), at, gain)


# ---------------- intro (hook): tick-tock + questioning pad ----------------
for i in range(7):
    t = 0.2 + i * 0.45
    blip(84 if i % 2 == 0 else 79, t, 0.06, 0.05)
pad([57, 60, 64], 0.0, DROP, 0.03)   # Am
for i, n in enumerate([72, 74, 76, 79, 81, 79, 76]):
    pluck(n, 0.6 + i * 0.08, 0.2, 0.05, 'tri')  # the "?" slots appearing
whoosh(DROP - 0.42, 0.42, 0.14)

# ---------------- groove: I–V–vi–IV in C ----------------
chords = [
    (48, [60, 64, 67]),  # C
    (43, [59, 62, 67]),  # G
    (45, [57, 60, 64]),  # Am
    (41, [57, 60, 65]),  # F
]
arp_pat = [0, 1, 2, 1, 0, 2, 1, 2]
bars = int((CTA + 2 * BAR - DROP) / BAR)
for b in range(bars):
    t0 = DROP + b * BAR
    root, tri = chords[b % 4]
    last = t0 + BAR > CTA + 0.01
    pad([n + 12 for n in tri], t0, BAR + 0.1, 0.022)
    for beat in range(4):
        tb = t0 + beat * BEAT
        kick(tb, 0.5 if beat % 2 == 0 else 0.4)
        if beat % 2 == 1:
            clap(tb)
        hat(tb + BEAT / 2)
        # bass: root on beats, octave bounce on the offbeat
        s = osc(midi(root), BEAT * 0.9, 'tri')
        add(s * env(len(s), 0.004, 0.2), tb, 0.22)
        s = osc(midi(root + 12), BEAT * 0.4, 'tri')
        add(s * env(len(s), 0.004, 0.08), tb + BEAT / 2, 0.12)
    for k in range(8):
        pluck(tri[arp_pat[k]] + 12, t0 + k * BEAT / 2, 0.22, 0.07)
    if last:
        break
crash(DROP, 0.1)

# ---------------- CTA: big finish ----------------
crash(CTA, 0.13)
for n in [60, 64, 67, 72, 76, 79, 84]:
    pluck(n, CTA + (n - 60) * 0.012, 1.8, 0.05, 'tri')
pad([48, 60, 64, 67, 72], CTA, DUR - CTA, 0.03)
for i, n in enumerate([72, 76, 79, 84]):
    pluck(n, CTA + 1.3 + i * 0.12, 0.3, 0.07)
kick(CTA, 0.6)
ding(84, CTA + 1.3, 0.12)

# ---------------- sound effects on visual cues ----------------
boing(DROP + 0.15)                                             # mascot pops
for i in range(7):
    blip(72 + [0, 2, 4, 5, 7, 9, 12][i], DROP + 0.7 + i * 0.07, 0.08)  # title letters

S3 = 7.0
whoosh(S3 - 0.4, 0.4, 0.12)
add(noise(0.04) * env(int(0.04 * SR), 0.001, 0.01), S3 + 1.0, 0.3)   # shutter
add(noise(0.05) * env(int(0.05 * SR), 0.001, 0.015), S3 + 1.08, 0.25)
for i in range(6):                                              # scanning chirps
    blip(88 + (i % 2) * 3, S3 + 1.4 + i * 0.19, 0.03, 0.06)
ding(84, S3 + 2.6, 0.14)
for i in range(4):
    blip(76 + i * 3, S3 + 2.75 + i * 0.22, 0.12)
whoosh(12.6, 0.4, 0.12)

S4 = 13.0
fills = [0.9, 1.35, 1.6, 2.05, 2.25, 2.45, 2.65, 3.05, 3.2, 3.35, 3.5, 3.65, 3.8, 3.95, 4.1]
scale = [72, 74, 76, 77, 79, 81, 83, 84, 86, 88, 89, 91, 93, 95, 96]
for f, n in zip(fills, scale):
    blip(n, S4 + f, 0.1)
for i, n in enumerate([84, 88, 91, 96]):                        # combo fanfare
    pluck(n, S4 + 4.25 + i * 0.09, 0.3, 0.08)
whoosh(18.2, 0.4, 0.12)

S5 = 18.6
for i in range(4):
    ding(79 + [0, 2, 4, 5][i], S5 + 1.5 + i * 0.55, 0.12)
boing(S5 + 1.25, 0.1)

S6 = 23.6
whoosh(S6 - 0.4, 0.4, 0.14)
for i in range(6):                                              # streak counter
    blip(80 + i, S6 + 0.4 + i * 0.17, 0.07, 0.07)
for i, n in enumerate([72, 76, 79, 84, 88]):                    # level up
    pluck(n, S6 + 2.0 + i * 0.07, 0.4, 0.09)
crash(S6 + 2.0, 0.07)
for i in range(3):
    ding(88 + i * 2, S6 + 2.15 + i * 0.2, 0.08)
whoosh(CTA - 0.4, 0.4, 0.14)
blip(79, CTA + 1.35, 0.12)

# ---------------- master ----------------
fade = int(0.8 * SR)
out[-fade:] *= np.linspace(1, 0, fade)
out = np.tanh(out * 1.3)
out /= np.max(np.abs(out)) / 0.89
pcm = (out * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print('wrote music.wav', DUR, 's, beat', round(BEAT, 4))
