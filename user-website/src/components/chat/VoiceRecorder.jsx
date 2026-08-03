import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Play, Pause } from "lucide-react";

const VoiceRecorder = ({ onSendVoiceNote, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      if (onCancel) onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayPreview = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (!audioBlob) return;
    onSendVoiceNote({
      blob: audioBlob,
      url: audioUrl,
      duration: recordingTime,
    });
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-white w-full animate-in fade-in duration-200">
      <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
        <Mic size={18} className={isRecording ? "animate-pulse text-rose-600" : ""} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-cyan-400">
            {isRecording ? "Recording Voice Note..." : "Voice Note Preview"}
          </span>
          <span className="text-xs font-mono font-bold text-slate-300">
            {formatTime(recordingTime)}
          </span>
        </div>
        {/* Animated Waveform Visualization */}
        <div className="flex items-center gap-1 h-3 mt-1">
          {[40, 70, 30, 90, 50, 80, 20, 60, 95, 45, 75, 35, 85].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isRecording ? "bg-cyan-400 animate-pulse" : "bg-slate-400"
              }`}
              style={{ height: isRecording ? `${Math.random() * 80 + 20}%` : `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
            title="Stop recording"
          >
            <Square size={16} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={togglePlayPreview}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
              title="Play preview"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Send size={14} /> Send
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Cancel"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
