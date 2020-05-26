const notes = [
      65.406,   69.296,   73.416,   77.782,   82.406,   87.308,   92.498,   97.998,  103.826,  110.000,  116.540,  123.470,
     130.812,  138.592,  146.832,  155.564,  164.821,  174.614,  185.000,  195.998,  207.660,  220.000,  233.080,  246.940,
     261.620,  277.180,  296.660,  311.120,  329.620,  349.220,  370.000,  392.000,  415.300,  440.000,  466.160,  493.880,
     523.260,  554.360,  587.320,  622.260,  659.260,  698.460,  739.980,  784.000,  830.600,  880.000,  892.320,  987.760,
    1046.500, 1108.740, 1174.660, 1244.500, 1318.520, 1396.920, 1479.980, 1567.980, 1661.220, 1760.000, 1864.660, 1975.540,
    2093.000, 2217.400, 2349.400, 2489.000, 2637.000, 2793.800, 2960.000, 3136.000, 3322.400, 3520.000, 3729.400, 3951.000,
    4186.000, 4435.000, 4698.600, 4978.000, 5274.000, 5587.600, 5920.000, 6272.000, 6644.800, 7040.000, 7458.600, 7902.200,
];
let quit = false;
let playing = false;

class Parser {
    constructor(bytes) {
        this.index = 0;
        this.bytes = bytes;
        this.byte = bytes[this.index];
        this.col = 1;
        this.ln = 1;
    }

    next() {
        if (this.index < this.bytes.length) {
            this.index += 1;
            this.byte = this.bytes[this.index];
            switch(this.byte) {
                case 0x0a:
                    this.col = 1;
                    this.ln += 1;
                    break;
                case 0x0d:
                    break;
                default:
                    this.col += 1;
                    break;
            }
            return true;
        } else {
            this.byte = undefined;
            return false;
        }
    }

    char() {
        return String.fromCharCode(this.byte);
    }

    escape() {
        return this.byte == 0x1b;
    }

    note_char() {
        return this.byte == 0x0e;
    }

    eof() {
        return this.byte == undefined;
    }

    is_num() {
        return this.byte >= 0x30 && this.byte <= 0x39;
    }

    is_dot() {
        return this.byte == 0x2e;
    }
}

function get_num(p) {
    let value = 0;
    while (p.is_num()) {
        value = (value * 10) + parseInt(p.char(), 10);
        if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
    }
    return value;
}

function get_freq(p) {
    const freq = {type: "freq", freq: p.get_num(), dots: 0};
    if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
    while (p.is_dot()) {
        freq.dots += 1;
        if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
    }
    return freq;
}

function get_note(note, p) {
    const note_obj = {type: "note", note, sharp: false, flat: false, length: undefined, dots: 0};
    if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
    switch (p.char()) {
        case "+": case "#":
            note_obj.sharp = true;
            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
            break;
        case "-":
            note_obj.flat = true;
            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
            break;
    }
    if (p.is_num()) {
        note_obj.length = get_num(p);
    }
    while (p.is_dot()) {
        note_obj.dots += 1;
        if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
    }
    return note_obj;
}

function ans_to_seq(bytes) {
    const seq = [];
    const p = new Parser(bytes);
    while (!p.eof()) {
        if (p.escape()) {
            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
            if (p.char() == "[") {
                if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                if (p.char() == "M") {
                    while (!p.note_char()) {
                        switch (p.char()) {
                            case "M":
                                if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                                switch (p.char()) {
                                    case "B":
                                        seq.push({type: "music", value: "background"});
                                        if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                                        break;
                                    case "F":
                                        seq.push({type: "music", value: "foreground"});
                                        if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                                        break;
                                    case "N":
                                        seq.push({type: "music", value: "normal"});
                                        if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                                        break;
                                    case "S":
                                        seq.push({type: "music", value: "staccato"});
                                        if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                                        break;
                                    case "L":
                                        seq.push({type: "music", value: "legato"});
                                        if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                                        break;
                                    default:
                                        seq.push({type: "music", value: "normal"});
                                        break;
                                }
                                break;
                        case "T":
                            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                            seq.push({type: "tempo", value: get_num(p)});
                            break;
                        case "L":
                            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                            seq.push({type: "length", value: get_num(p)});
                            break;
                        case "O":
                            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                            seq.push({type: "octave", value: get_num(p)});
                            break;
                        case "N":
                            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                            seq.push(get_freq(p));
                            break;
                        case "P":
                            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                            seq.push({type: "pause", value: get_num(p)});
                            break;
                        case "A": case "B": case "C":case "D": case "E": case "F": case "G":
                            seq.push(get_note(p.char(), p));
                            break;
                        case "a": case "b": case "c":case "d": case "e": case "f": case "f":
                            seq.push(get_note(p.char().toUpperCase(), p));
                            break;
                        case ">":
                            seq.push({type: "increase_octave"});
                            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                            break;
                        case "<":
                            seq.push({type: "decrease_octave"});
                            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                            break;
                        default:
                            if (!p.next()) throw(`Unexpected end of file ${p.ln}, ${p.col}`);
                            break;
                        }
                    }
                }
            }
        }
        p.next();
    }
    return seq;
}

function get_note_index(octave, note, sharp, flat) {
    let index = octave * 12;
    switch (note) {
        case "C": index += 0; break;
        case "D": index += 2; break;
        case "E": index += 4; break;
        case "F": index += 5; break;
        case "G": index += 7; break;
        case "A": index += 9; break;
        case "B": index += 11; break;
        default: return undefined;
    }
    if (sharp) {
        index += 1;
    } else if (flat) {
        index -= 1;
    }
    return index;
}

async function pause(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function play_freq(oscillator_node, gain_node, music, tempo, freq, dots, length) {
    const full_note = (60 * 1000) / tempo * 4 / length;
    let note_length = full_note;
    switch (music) {
        case "staccato": note_length *= 3 / 4; break;
        case "legato": break;
        default: note_length *= 7 / 8; break;
    }
    oscillator_node.frequency.value = freq;
    let extra = 0;
    while (dots) {
        if (extra == 0) {
            extra += note_length * 1 / 2;
        } else {
            extra += extra * 1 / 2;
        }
        dots -= 1;
    }
    gain_node.gain.value = 1;
    await pause(note_length + extra);
    gain_node.gain.value = 0;
    const pause_length = full_note - note_length;
    if (pause_length) {
        await pause(pause_length);
    }

}

async function resume_audio_context(audio_context) {
    return new Promise(resolve => {
        audio_context.resume();
        audio_context.onstatechange = () => {
            if (audio_context.state == "running") {
                resolve();
            }
        };
    });
}

export async function play(url) {
    const audio_context = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
    const oscillator_node = audio_context.createOscillator();
    const gain_node = audio_context.createGain();
    oscillator_node.connect(gain_node);
    oscillator_node.type = "square";
    gain_node.connect(audio_context.destination);
    oscillator_node.start();
    gain_node.gain.value = 0;
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const seq = ans_to_seq(bytes);
    let music = "normal";
    let tempo = 120;
    let length = 1;
    let octave = 4;
    if (audio_context.state == "suspended") {
        await resume_audio_context();
    }
    playing = true;
    for (let i = 0; i < seq.length; i++) {
        switch (seq[i].type) {
            case "music": music = seq[i].value; break;
            case "tempo": tempo = seq[i].value; break;
            case "length": length = seq[i].value; break;
            case "octave": octave = seq[i].value; break;
            case "pause":
                await pause((60 * 1000) / tempo * 4 / seq[i].value);
                break;
            case "freq":
                await play_freq(oscillator_node, gain_node, music, tempo, notes[freq], seq[i].dots, length, seq[i].dots);
                break;
            case "note":
                await play_freq(oscillator_node, gain_node, music, tempo, notes[get_note_index(octave, seq[i].note, seq[i].sharp, seq[i].flat)], seq[i].dots, seq[i].length || length, seq[i].dots);
                break;
            case "increase_octave": octave += 1; break;
            case "decrease_octave": octave -= 1; break;
        }
        if (quit) {
            break;
        }
    }
    oscillator_node.stop();
    playing = false;
}

export async function stop() {
    if (playing) {
        quit = true;
        while (playing) {
            await new Promise(resolve => window.requestAnimationFrame(resolve));
        }
        quit = false;
    }
}

export function is_playing() {
    return playing;
}
