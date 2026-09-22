import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuickHelpLogo } from '../components/Logo';
import { UserAccount } from '../types';
import { registerRealWorker } from '../services/storage';

interface WorkerSignupProps {
  onUserChange?: (user: UserAccount | null) => void;
}

const TRADE_SKILL_PRESETS: Record<string, string[]> = {
  Electrician: [
    'Wiring & Rewiring',
    'Switchboard Repair',
    'Lighting & Fixtures',
    'Inverter Setup',
    'MCB Tripping',
    'Appliance Socket',
  ],
  Plumber: [
    'Leakage Fixing',
    'Tap & Spout Replacement',
    'Toilet Flush Cistern',
    'Pipe Fitting',
    'Water Tank Float',
    'Drain Clearing',
  ],
  Carpenter: [
    'Door Locks & Hinges',
    'Furniture Repair',
    'Wood Polishing',
    'Modular Kitchen Fittings',
    'Bed Frame Assembly',
  ],
  'AC Repair': [
    'Jet Foam Servicing',
    'Gas Leakage & Refill',
    'Compressor Diagnostics',
    'PCB Board Check',
    'Split AC Installation',
  ],
  Painter: [
    'Wall Putty & Primer',
    'Room Painting',
    'Ceiling Water Seepage Fix',
    'Exterior Weather Coating',
  ],
  Cleaner: [
    'Bathroom Deep Scrubbing',
    'Kitchen Degreasing',
    'Full Home Deep Clean',
    'Sofa & Upholstery Care',
  ],
  'Appliance Repair': [
    'Washing Machine Drum Fix',
    'Refrigerator Cooling Gas',
    'Microwave Heating Fault',
    'Geyser Element Replacement',
  ],
};

export const WorkerSignupPage: React.FC<WorkerSignupProps> = ({ onUserChange }) => {
  const navigate = useNavigate();

  const [primaryTrade, setPrimaryTrade] = useState('Electrician');
  const [experience, setExperience] = useState('3 - 5 Years (Experienced)');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Wiring & Rewiring',
    'Switchboard Repair',
    'Lighting & Fixtures',
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [dispatchRadius, setDispatchRadius] = useState<number>(5);
  const [baseLocation, setBaseLocation] = useState('Freeganj & Madhav Nagar, Ujjain');

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    termsAccepted: true,
  });

  const [error, setError] = useState('');

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkillInput.trim() && !selectedSkills.includes(customSkillInput.trim())) {
      setSelectedSkills([...selectedSkills, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const handleTradeChange = (trade: string) => {
    setPrimaryTrade(trade);
    const presets = TRADE_SKILL_PRESETS[trade] || [];
    setSelectedSkills(presets.slice(0, 3));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Please enter your full legal name');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (selectedSkills.length === 0) {
      setError('Please select at least one core skill specialization');
      return;
    }
    if (!formData.termsAccepted) {
      setError('You must accept the Partner Safety Code and Payout Guidelines');
      return;
    }

    // Register real worker (offline initial state, clean data isolation)
    const newWorker = registerRealWorker({
      fullName: formData.fullName,
      email: formData.email,
      mobile: formData.mobile,
      primaryTrade,
      experience,
      skills: selectedSkills,
      baseLocation,
      dispatchRadius,
    });

    if (onUserChange) onUserChange(newWorker);

    // Redirect to worker dashboard
    navigate('/worker/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-center">
        <Link to="/">
          <QuickHelpLogo size="lg" />
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl w-full mx-auto bg-[#ffffff] p-8 md:p-10 rounded-3xl shadow-[0_4px_24px_rgba(18,52,91,0.08)] border border-[#e1e9e5]/80 my-8">
        {/* Step Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/select-role"
            className="flex items-center gap-1 text-xs font-semibold text-[#006c4c] hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Change Role</span>
          </Link>
          <span className="font-['Inter'] text-[12px] font-bold text-[#006c4c] tracking-wider uppercase">
            Step 2 of 2
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#f2f3ff] rounded-full mb-6 overflow-hidden">
          <div className="w-full h-full bg-[#006c4c] rounded-full transition-all" />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#7bfac4]/30 text-[#007351] rounded-full text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">handyman</span>
            <span>Technician Partner Registration</span>
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#001f3f]">
            Create Technician Profile
          </h2>
          <p className="font-['Inter'] text-xs text-[#43474e] mt-1.5">
            Receive direct nearby job dispatches with guaranteed instant payouts
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#ffdad6] text-[#93000a] text-xs font-semibold rounded-xl flex items-center gap-2 border border-[#ba1a1a]/20">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Personal Info */}
          <div>
            <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                badge
              </span>
              <span>1. Identity Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Sunil Sharma"
                  className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
                />
              </div>

              <div>
                <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                  Mobile Number *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl bg-[#e9edff] text-[#0d1b36] text-xs font-semibold border-r border-[#c3c6cf]/30">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-r-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
                  />
                </div>
              </div>

              <div>
                <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="partner@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
                />
              </div>

              <div>
                <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all placeholder:text-[#74777f]/70"
                />
              </div>
            </div>
          </div>

          {/* Section: Trade Specialization */}
          <div className="pt-3 border-t border-[#e1e9e5]/60">
            <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                build
              </span>
              <span>2. Trade Expertise & Qualifications</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                  Primary Trade *
                </label>
                <select
                  value={primaryTrade}
                  onChange={(e) => handleTradeChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all"
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="AC Repair">AC Specialist / HVAC</option>
                  <option value="Painter">Painter</option>
                  <option value="Cleaner">Cleaning Specialist</option>
                  <option value="Appliance Repair">Appliance Repair</option>
                </select>
              </div>

              <div>
                <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                  Experience Level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all"
                >
                  <option value="1 - 2 Years (Beginner / Junior Pro)">1 - 2 Years (Beginner / Junior Pro)</option>
                  <option value="3 - 5 Years (Experienced)">3 - 5 Years (Experienced)</option>
                  <option value="5+ Years (Master Technician)">5+ Years (Master Technician)</option>
                </select>
              </div>
            </div>

            {/* Core Skills Chips */}
            <div className="mb-2">
              <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1.5">
                Core Skill Tags (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(TRADE_SKILL_PRESETS[primaryTrade] || []).map((skill) => {
                  const isChecked = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#006c4c] text-white shadow-xs'
                          : 'bg-[#f2f3ff] text-[#43474e] hover:bg-[#e9edff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isChecked ? 'check' : 'add'}
                      </span>
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Skill Formlet */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Add custom skill (e.g. Inverter Wiring)"
                  className="px-3 py-1.5 bg-[#f2f3ff] rounded-lg text-xs font-['Inter'] flex-1 text-[#0d1b36] outline-none border border-transparent focus:border-[#006c4c]"
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="px-3 py-1.5 bg-[#12345b] text-white text-xs font-semibold rounded-lg hover:bg-[#001f3f]"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Section: Operating Location & Dispatch Radius */}
          <div className="pt-3 border-t border-[#e1e9e5]/60">
            <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#001f3f] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c4c] text-[18px]">
                near_me
              </span>
              <span>3. Dispatch Radius & Operating Zone</span>
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block font-['Inter'] text-xs font-semibold text-[#0d1b36] mb-1">
                  Base Operating Ward / Center
                </label>
                <input
                  type="text"
                  value={baseLocation}
                  onChange={(e) => setBaseLocation(e.target.value)}
                  placeholder="e.g. Freeganj & Madhav Nagar, Ujjain"
                  className="w-full px-3.5 py-2.5 bg-[#f2f3ff] rounded-xl text-sm font-['Inter'] text-[#0d1b36] border border-transparent focus:border-[#006c4c] focus:bg-[#ffffff] outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#0d1b36]">
                    Service Radius: <span className="text-[#006c4c] font-bold text-sm">{dispatchRadius} km</span>
                  </span>
                  <span className="text-[#74777f]">Max recommended: 15 km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={dispatchRadius}
                  onChange={(e) => setDispatchRadius(Number(e.target.value))}
                  className="w-full accent-[#006c4c] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#74777f] font-mono mt-0.5">
                  <span>1 km (Hyperlocal)</span>
                  <span>10 km</span>
                  <span>25 km (Citywide)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Offline Notice Banner */}
          <div className="p-3.5 bg-[#f2f3ff] rounded-xl border border-[#d9e2ff] flex items-start gap-2.5 text-xs text-[#0d1b36]">
            <span className="material-symbols-outlined text-[#12345b] text-[18px] shrink-0 mt-0.5">
              info
            </span>
            <div className="font-['Inter'] leading-relaxed">
              <strong>Initial Duty Status:</strong> New technician accounts start in <strong>OFFLINE</strong> mode by default. You can easily switch to <strong>Available</strong> anytime on your dashboard when you are ready to receive job leads!
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              className="rounded text-[#006c4c] focus:ring-[#006c4c] border-[#c3c6cf] mt-0.5"
            />
            <span className="text-[#43474e]">
              I agree to the QuickHelp Partner Code of Conduct, zero-commission guarantee, and honest pricing guidelines.
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-3 bg-[#12345b] hover:bg-[#001f3f] text-white font-['Inter'] font-semibold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 mt-2"
          >
            <span>Complete Registration & Enter Dashboard</span>
            <span className="material-symbols-outlined text-[18px]">check</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#43474e]">
          Already registered as a partner?{' '}
          <Link to="/login" className="font-bold text-[#006c4c] hover:underline">
            Log in to Partner Desk
          </Link>
        </div>
      </div>

      <div className="text-center font-['Inter'] text-[11px] text-[#74777f]">
        QuickHelp Technologies • Partner Pro Network
      </div>
    </div>
  );
};
