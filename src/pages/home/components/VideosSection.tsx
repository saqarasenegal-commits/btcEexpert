import { useState } from 'react';

export default function VideosSection() {
  const [activeTab, setActiveTab] = useState('Calculateur');

  const videos = [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Introduction à la Brique de Terre Compressée (BTC)',
      quality: '4 K'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'Technique de fabrication des briques BTC',
      quality: '4 K'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'Pose et montage des murs en BTC',
      quality: '4 K'
    }
  ];

  return (
    <section id="videos" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <i className="ri-youtube-line text-2xl text-red-500"></i>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Vidéos Éducatives
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Apprenez les techniques de construction BTC à travers nos tutoriels vidéo. Ajoutez vos propres liens YouTube pour enrichir la formation.
          </p>
        </div>

        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-3 bg-white rounded-full p-1 shadow-md">
              {['Calculateur', 'Expertise', 'Formation'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#8B4513] text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#8B4513] text-[#8B4513] rounded-lg hover:bg-[#8B4513] hover:text-white transition-all duration-300 whitespace-nowrap cursor-pointer">
              <i className="ri-add-line"></i>
              Se connecter
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-[#8B4513] flex items-center justify-center">
              <i className="ri-robot-line text-white text-lg"></i>
            </div>
            <span className="text-sm font-medium text-gray-700">BTC Expert</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {videos.map((video, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden bg-gray-200">
                <img
                  src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors whitespace-nowrap">
                    <i className="ri-play-fill"></i>
                    Regarder
                  </button>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded">
                  {video.quality}
                </div>
                <button className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#8B4513] transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <i className="ri-youtube-line text-red-500"></i>
                  <span>YouTube</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
