import { useState } from 'react';

const steps = [
  {
    number: '01',
    icon: 'ri-search-eye-line',
    title: 'Site Analysis & Soil Testing',
    duration: '1–2 days',
    color: '#8B4513',
    description:
      'Before any construction begins, the local soil is analyzed to determine its clay, sand, and silt composition. The ideal BTC mix requires 15–25% clay content.',
    details: [
      'Collect soil samples at 30–50 cm depth',
      'Perform the jar test and ribbon test to assess clay content',
      'Adjust mix with sand or stabilizer if needed',
      'Validate soil suitability with a compression test',
    ],
    image:
      'https://readdy.ai/api/search-image?query=African%20construction%20worker%20collecting%20soil%20samples%20from%20ground%20for%20testing%2C%20earth%20tones%2C%20warm%20sunlight%2C%20Senegal%20landscape%2C%20professional%20site%20analysis%2C%20terracotta%20soil%2C%20simple%20clean%20background%2C%20photorealistic%2C%20high%20detail&width=600&height=400&seq=btc_step1&orientation=landscape',
  },
  {
    number: '02',
    icon: 'ri-tools-line',
    title: 'Soil Preparation & Mixing',
    duration: '1 day',
    color: '#A0522D',
    description:
      'The excavated soil is sieved, dried if necessary, and blended with the correct proportions of sand and cement stabilizer to achieve optimal compressive strength.',
    details: [
      'Sieve soil through a 5 mm mesh to remove stones and roots',
      'Dry soil to 10–15% moisture content',
      'Add 5–8% cement by weight as stabilizer',
      'Mix thoroughly until a uniform color is achieved',
    ],
    image:
      'https://readdy.ai/api/search-image?query=Workers%20mixing%20compressed%20earth%20soil%20with%20cement%20stabilizer%20on%20a%20construction%20site%2C%20terracotta%20earth%20tones%2C%20manual%20labor%2C%20West%20Africa%2C%20warm%20golden%20light%2C%20clean%20simple%20background%2C%20photorealistic%20high%20quality&width=600&height=400&seq=btc_step2&orientation=landscape',
  },
  {
    number: '03',
    icon: 'ri-stack-line',
    title: 'Brick Pressing (BTC Machine)',
    duration: '1–3 days',
    color: '#B8622A',
    description:
      'The prepared mix is loaded into a hydraulic or manual press machine. Each brick is compressed under high pressure to form a dense, uniform block with precise dimensions.',
    details: [
      'Load the mix into the press mold',
      'Apply 2–10 MPa compression pressure',
      'Eject the brick carefully onto a flat surface',
      'Produce 200–500 bricks per day depending on machine type',
    ],
    image:
      'https://readdy.ai/api/search-image?query=BTC%20compressed%20earth%20brick%20press%20machine%20in%20operation%2C%20worker%20pressing%20earth%20bricks%2C%20terracotta%20blocks%2C%20African%20construction%20site%2C%20warm%20earthy%20tones%2C%20industrial%20machine%2C%20clean%20background%2C%20photorealistic%20high%20detail&width=600&height=400&seq=btc_step3&orientation=landscape',
  },
  {
    number: '04',
    icon: 'ri-sun-line',
    title: 'Curing & Drying',
    duration: '21–28 days',
    color: '#C8722E',
    description:
      'Freshly pressed bricks must cure slowly in the shade to develop full strength. Rapid drying in direct sunlight causes cracking and weakens the block.',
    details: [
      'Stack bricks in the shade with 2–3 cm gaps for airflow',
      'Lightly water bricks twice daily for the first 7 days',
      'Keep bricks covered with jute or plastic sheeting',
      'Test compressive strength after 28 days (target: ≥ 2 MPa)',
    ],
    image:
      'https://readdy.ai/api/search-image?query=Rows%20of%20compressed%20earth%20BTC%20bricks%20curing%20in%20the%20shade%2C%20stacked%20neatly%2C%20terracotta%20color%2C%20African%20village%20construction%2C%20warm%20ambient%20light%2C%20earthy%20tones%2C%20clean%20simple%20background%2C%20photorealistic&width=600&height=400&seq=btc_step4&orientation=landscape',
  },
  {
    number: '05',
    icon: 'ri-layout-grid-line',
    title: 'Foundation & First Course',
    duration: '2–4 days',
    color: '#8B4513',
    description:
      'A solid concrete or stone foundation is laid first. The first course of BTC bricks is set on a mortar bed, carefully leveled and aligned to ensure a straight, stable wall.',
    details: [
      'Lay a concrete strip foundation at least 30 cm deep',
      'Apply a damp-proof course (DPC) membrane',
      'Set the first brick course with a 1 cm mortar joint',
      'Check level and plumb at every corner',
    ],
    image:
      'https://readdy.ai/api/search-image?query=Construction%20worker%20laying%20the%20first%20course%20of%20compressed%20earth%20BTC%20bricks%20on%20a%20concrete%20foundation%2C%20mortar%20joints%2C%20West%20Africa%2C%20terracotta%20bricks%2C%20warm%20sunlight%2C%20clean%20earthy%20background%2C%20photorealistic&width=600&height=400&seq=btc_step5&orientation=landscape',
  },
  {
    number: '06',
    icon: 'ri-building-2-line',
    title: 'Wall Construction & Reinforcement',
    duration: '1–3 weeks',
    color: '#A0522D',
    description:
      'Courses are laid in a running bond pattern. Iron bars (rebars) are inserted every 1.20 m vertically and horizontally through the brick holes, then grouted for structural integrity.',
    details: [
      'Lay bricks in staggered running bond pattern',
      'Insert 8–10 mm rebar every 1.20 m (BTC standard)',
      'Fill rebar channels with liquid cement grout',
      'Install lintels above all door and window openings',
    ],
    image:
      'https://readdy.ai/api/search-image?query=Masons%20building%20a%20compressed%20earth%20BTC%20brick%20wall%20with%20iron%20rebar%20reinforcement%2C%20running%20bond%20pattern%2C%20terracotta%20blocks%2C%20African%20construction%2C%20warm%20golden%20light%2C%20earthy%20tones%2C%20photorealistic%20high%20quality&width=600&height=400&seq=btc_step6&orientation=landscape',
  },
  {
    number: '07',
    icon: 'ri-paint-brush-line',
    title: 'Finishing & Rendering',
    duration: '3–5 days',
    color: '#B8622A',
    description:
      'BTC walls can be left exposed for a natural look or rendered with a thin earth or lime plaster. Joints are pointed and surfaces sealed to protect against moisture.',
    details: [
      'Point all mortar joints flush or slightly recessed',
      'Apply a 5–10 mm earth or lime render coat if desired',
      'Seal exterior surfaces with a lime wash or natural oil',
      'Install window frames, doors, and roof structure',
    ],
    image:
      'https://readdy.ai/api/search-image?query=Finished%20compressed%20earth%20BTC%20brick%20wall%20with%20smooth%20lime%20plaster%20render%2C%20natural%20terracotta%20texture%2C%20African%20eco%20house%2C%20warm%20sunlight%2C%20beautiful%20earthy%20tones%2C%20clean%20background%2C%20photorealistic%20high%20detail&width=600&height=400&seq=btc_step7&orientation=landscape',
  },
];

export default function ConstructionProcess() {
  const [activeStep, setActiveStep] = useState(0);

  const step = steps[activeStep];

  return (
    <section id="process" className="py-20 bg-gradient-to-b from-[#FAF8F5] to-[#F0EAE0]">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-[#8B4513]/10 text-[#8B4513] text-xs font-semibold rounded-full uppercase tracking-widest mb-4">
            Step-by-Step Guide
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            BTC Brick Construction Process
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            From raw earth to a finished wall — follow each phase of the Compressed Earth Brick
            (BTC) building method used by BTC Expert in Senegal.
          </p>
        </div>

        {/* Step Navigator */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer border ${
                activeStep === i
                  ? 'bg-[#8B4513] text-white border-[#8B4513] shadow-md scale-105'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#8B4513] hover:text-[#8B4513]'
              }`}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                  activeStep === i ? 'bg-white text-[#8B4513]' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {s.number}
              </span>
              {s.title.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>

        {/* Active Step Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DDD0]">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-64 md:h-auto min-h-[300px]">
              <img
                src={step.image}
                alt={step.title}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="text-4xl font-black text-white/30 leading-none">{step.number}</span>
                <span className="text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
                  {step.duration}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <i className={`${step.icon} text-xl`} style={{ color: step.color }}></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      Step {step.number}
                    </p>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-6">{step.description}</p>

                <ul className="space-y-3">
                  {step.details.map((d, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <span
                        className="mt-0.5 w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ backgroundColor: `${step.color}20` }}
                      >
                        <i className="ri-check-line text-xs" style={{ color: step.color }}></i>
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  disabled={activeStep === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-[#8B4513] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line"></i> Previous
                </button>

                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${
                        activeStep === i
                          ? 'w-6 h-2 bg-[#8B4513]'
                          : 'w-2 h-2 bg-gray-200 hover:bg-[#8B4513]/40'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  disabled={activeStep === steps.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#8B4513] hover:bg-[#8B4513]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  Next <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline overview */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'ri-time-line', label: 'Total Build Time', value: '6–10 weeks' },
            { icon: 'ri-team-line', label: 'Crew Size', value: '3–6 masons' },
            { icon: 'ri-leaf-line', label: 'CO₂ Savings', value: 'Up to 70%' },
            { icon: 'ri-shield-check-line', label: 'Lifespan', value: '50+ years' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5 border border-[#E8DDD0] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#8B4513]/10 flex-shrink-0">
                <i className={`${stat.icon} text-[#8B4513] text-lg`}></i>
              </div>
              <div>
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="text-base font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
