import React, { useState, useEffect } from "react";
import { Settings, X, Video, Mic, Volume2 } from "lucide-react";

interface DeviceSettingsProps {
  onClose: () => void;
  localStream: MediaStream | null;
}

export default function DeviceSettingsModal({ onClose, localStream }: DeviceSettingsProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedAudio, setSelectedAudio] = useState("");

  useEffect(() => {
    // Fetch available devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
    });

    // Check active tracks to select defaults
    if (localStream) {
      const vTrack = localStream.getVideoTracks()[0];
      const aTrack = localStream.getAudioTracks()[0];
      
      if (vTrack) setSelectedVideo(vTrack.getSettings().deviceId || "");
      if (aTrack) setSelectedAudio(aTrack.getSettings().deviceId || "");
    }
  }, [localStream]);

  const handleVideoChange = async (deviceId: string) => {
    setSelectedVideo(deviceId);
    if (!localStream) return;

    const oldTrack = localStream.getVideoTracks()[0];
    if (oldTrack) oldTrack.stop();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getVideoTracks()[0];
      localStream.removeTrack(oldTrack);
      localStream.addTrack(newTrack);
    } catch (err) {
      console.error("Failed to switch camera device:", err);
    }
  };

  const handleAudioChange = async (deviceId: string) => {
    setSelectedAudio(deviceId);
    if (!localStream) return;

    const oldTrack = localStream.getAudioTracks()[0];
    if (oldTrack) oldTrack.stop();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getAudioTracks()[0];
      localStream.removeTrack(oldTrack);
      localStream.addTrack(newTrack);
    } catch (err) {
      console.error("Failed to switch microphone device:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 text-white">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-md p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="text-gray-400" size={18} />
            <h3 className="font-semibold text-sm">Device Settings</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Device Selectors */}
        <div className="space-y-4 text-xs">
          {/* Camera Select */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-gray-400 font-medium">
              <Video size={14} /> Camera Input
            </label>
            <select
              value={selectedVideo}
              onChange={(e) => handleVideoChange(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-2 text-white focus:outline-none focus:border-red-500"
            >
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Mic Select */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-gray-400 font-medium">
              <Mic size={14} /> Microphone Input
            </label>
            <select
              value={selectedAudio}
              onChange={(e) => handleAudioChange(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-2 text-white focus:outline-none focus:border-red-500"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="bg-red-700 hover:bg-red-800 text-white rounded px-4 py-2 text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
