import React, { useState } from "react";
import { BarChart2, Plus, Check } from "lucide-react";
import { notify } from "~/services/notificationService";
interface PollsPanelProps {
  meetingId: string;
  polls: any[];
  userId: number;
  isHost: boolean;
  emitSocketEvent: (event: string, payload: any) => void;
}

export default function PollsPanel({ meetingId, polls, userId, isHost, emitSocketEvent }: PollsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => {
    setOptions(prev => [...prev, ""]);
  };

  const handleOptionChange = (idx: number, val: string) => {
    setOptions(prev => prev.map((opt, i) => i === idx ? val : opt));
  };

  const handleCreatePoll = () => {
    if (!question.trim()) {
      notify.error("Please enter a question");
      return;
    }
    const cleanOptions = options.filter(opt => opt.trim() !== "");
    if (cleanOptions.length < 2) {
      notify.error("Please provide at least 2 options");
      return;
    }

    emitSocketEvent("poll-create", { question, options: cleanOptions });
    setQuestion("");
    setOptions(["", ""]);
    setShowCreate(false);
    notify.success("Poll created successfully!");
  };

  const handleVote = (pollId: string, optionIndex: number) => {
    emitSocketEvent("poll-vote", { pollId, optionIndex, userId });
  };

  // Helper: check if current user voted on this option index
  const userVotedFor = (poll: any, optionIndex: number) => {
    const list = poll.votes?.[optionIndex] || [];
    return list.includes(userId);
  };

  const getVoteCount = (poll: any, optionIndex: number) => {
    return poll.votes?.[optionIndex]?.length || 0;
  };

  const getTotalVotes = (poll: any) => {
    return Object.values(poll.votes || {}).reduce((acc: number, cur: any) => acc + (cur?.length || 0), 0);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4 text-white overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-yellow-500" size={18} />
          <h3 className="font-semibold text-sm">Meeting Polls</h3>
        </div>
        {isHost && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-xs bg-red-700 hover:bg-red-800 text-white rounded px-2.5 py-1.5 transition"
          >
            <Plus size={14} />
            Create Poll
          </button>
        )}
      </div>

      {showCreate ? (
        <div className="space-y-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
          <h4 className="text-xs font-semibold text-gray-400">Create New Poll</h4>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Do you agree with the current project milestone?"
              className="w-full bg-gray-950 text-sm border border-gray-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Options</label>
            {options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="w-full bg-gray-950 text-xs border border-gray-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500"
              />
            ))}
            <button
              onClick={handleAddOption}
              className="text-xs text-red-500 hover:underline flex items-center mt-1"
            >
              + Add Option
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="text-xs bg-gray-700 hover:bg-gray-600 rounded px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePoll}
              className="text-xs bg-red-700 hover:bg-red-800 text-white rounded px-3 py-1.5"
            >
              Launch Poll
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              No active polls. Hosts can create polls at any time.
            </div>
          ) : (
            polls.map((poll) => {
              const totalVotes = getTotalVotes(poll);

              return (
                <div key={poll.pollId} className="bg-gray-950/60 p-4 rounded-lg border border-gray-700 space-y-3">
                  <h4 className="font-semibold text-sm">{poll.question}</h4>

                  <div className="space-y-2">
                    {poll.options.map((opt: string, idx: number) => {
                      const votes = getVoteCount(poll, idx);
                      const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      const hasVoted = userVotedFor(poll, idx);

                      return (
                        <button
                          key={idx}
                          onClick={() => handleVote(poll.pollId, idx)}
                          className={`w-full text-left relative overflow-hidden rounded border p-2.5 transition flex justify-between items-center text-xs ${hasVoted ? "border-red-600 bg-red-950/10" : "border-gray-700 bg-gray-900/40 hover:bg-gray-900/80"}`}
                        >
                          {/* Progress bar background */}
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-red-700/10 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />

                          <span className="relative z-10 flex items-center gap-1.5 font-medium">
                            {hasVoted && <Check className="text-red-500" size={13} />}
                            {opt}
                          </span>
                          <span className="relative z-10 text-gray-400">
                            {votes} ({percent}%)
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>Total Votes: {totalVotes}</span>
                    <span>Status: {poll.isActive ? "Active" : "Closed"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
