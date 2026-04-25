import { useState, useRef, useEffect } from 'react';

interface Video {
  id: string;
  title: string;
  quality: string;
}

const INITIAL_VIDEOS: Video[] = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Introduction à la Brique de Terre Compressée (BTC)',
    quality: '4K',
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Technique de fabrication des briques BTC',
    quality: '4K',
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Pose et montage des murs en BTC',
    quality: '4K',
  },
];

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface AddVideoModalProps {
  onClose: () => void;
  onAdd: (video: Video) => void;
}

function AddVideoModal({ onClose, onAdd }: AddVideoModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setError('');
    const id = extractYouTubeId(val.trim());
    setPreview(id ?? null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeId(url.trim());
    if (!id) {
      setError('Invalid YouTube URL. Please paste a valid link.');
      return;
    }
    onAdd({
      id,
      title: title.trim() || 'YouTube Video',
      quality: 'HD',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500">
              <i className="ri-youtube-fill text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Add YouTube Video</h3>
              <p className="text-xs text-gray-500">Paste a YouTube link to add it to the library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* URL input */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">YouTube URL *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ri-links-line text-gray-400 text-sm"></i>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full h-11 pl-9 pr-4 rounded-xl border-2 text-sm focus:outline-none transition-all ${
                  error
                    ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                    : preview
                    ? 'border-green-400 focus:ring-2 focus:ring-green-300'
                    : 'border-gray-200 focus:ring-2 focus:ring-red-400 focus:border-red-400'
                }`}
              />
              {preview && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <i className="ri-checkbox-circle-fill text-green-500 text-base"></i>
                </div>
              )}
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <i className="ri-error-warning-line"></i> {error}
              </p>
            )}
          </div>

          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Video title <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BTC Wall Construction Tutorial"
              className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
            />
          </div>

          {/* Thumbnail preview */}
          {preview && (
            <div className="rounded-xl overflow-hidden border-2 border-green-200 bg-gray-50">
              <div className="relative aspect-video">
                <img
                  src={`https://img.youtube.com/vi/${preview}/maxresdefault.jpg`}
                  alt="Video preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500/90">
                    <i className="ri-play-fill text-white text-xl"></i>
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-md flex items-center gap-1">
                  <i className="ri-checkbox-circle-line text-xs"></i> Valid
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i className="ri-add-line"></i>
              Add Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface VideoPlayerModalProps {
  video: Video;
  onClose: () => void;
}

function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-black rounded-2xl overflow-hidden w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="px-5 py-3 bg-gray-900">
          <p className="text-white text-sm font-medium truncate">{video.title}</p>
        </div>
      </div>
    </div>
  );
}

export default function VideosSection() {
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  const handleAddVideo = (video: Video) => {
    setVideos((prev) => [...prev, video]);
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <section id="videos" className="py-20 bg-[#FAF8F5]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <i className="ri-youtube-line text-2xl text-red-500"></i>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Video Library
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Learn BTC construction techniques through our video tutorials. Add your own YouTube links to enrich the library.
          </p>
        </div>

        {/* Controls bar */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-gray-200">
            {['All', 'Tutorials', 'Techniques', 'Formation'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#8B4513] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Add YouTube Video button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 active:scale-95 transition-all duration-200 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-youtube-fill text-base"></i>
            <i className="ri-add-line text-base"></i>
            Add YouTube Video
          </button>
        </div>

        {/* Video count */}
        <div className="max-w-7xl mx-auto mb-5">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{videos.length}</span> video{videos.length !== 1 ? 's' : ''} in the library
          </p>
        </div>

        {/* Grid */}
        {videos.length === 0 ? (
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50">
              <i className="ri-youtube-line text-3xl text-red-400"></i>
            </div>
            <p className="text-gray-500 text-sm max-w-xs">
              No videos yet. Click <strong>Add YouTube Video</strong> to get started.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line"></i>
              Add your first video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {videos.map((video, index) => (
              <div
                key={`${video.id}-${index}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden group hover:border-red-200 transition-all duration-300 cursor-pointer"
                onClick={() => setPlayingVideo(video)}
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                      <i className="ri-play-fill text-white text-2xl"></i>
                    </div>
                  </div>
                  {/* Quality badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs font-bold rounded">
                    {video.quality}
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveVideo(index); }}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 cursor-pointer"
                    title="Remove video"
                  >
                    <i className="ri-delete-bin-line text-xs"></i>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-red-500 transition-colors leading-snug">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                    <i className="ri-youtube-fill text-red-500 text-sm"></i>
                    <span>YouTube</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add video card */}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white rounded-xl border-2 border-dashed border-gray-200 overflow-hidden group hover:border-red-400 hover:bg-red-50/30 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[200px] p-6"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50 group-hover:bg-red-100 transition-colors">
                <i className="ri-add-line text-red-500 text-2xl"></i>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 group-hover:text-red-500 transition-colors">Add YouTube Video</p>
                <p className="text-xs text-gray-400 mt-0.5">Paste any YouTube link</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddVideoModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddVideo}
        />
      )}
      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </section>
  );
}
